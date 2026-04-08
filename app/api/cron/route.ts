import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORD_GENERATION_PROMPT } from "@/lib/prompts";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const date = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  const supabaseAdmin = getSupabaseAdmin();
  const { data: existing } = await supabaseAdmin
    .from("words")
    .select("id")
    .eq("date", date)
    .single();

  if (existing) {
    return Response.json({ message: "이미 있어.", date });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: WORD_GENERATION_PROMPT,
    config: { maxOutputTokens: 100 },
  });

  const text = response.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return Response.json({ error: "단어 생성 실패" }, { status: 500 });
  }
  const parsed = JSON.parse(jsonMatch[0]);

  await supabaseAdmin.from("words").insert({
    date,
    word: parsed.word,
    category: parsed.category,
    hints: [],
  });

  return Response.json({ message: "생성 완료.", date, word: parsed.word });
}
