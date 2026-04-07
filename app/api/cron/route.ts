import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORD_GENERATION_PROMPT } from "@/lib/prompts";

const client = new Anthropic();

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  const supabaseAdmin = getSupabaseAdmin();
  // 이미 단어가 있으면 스킵
  const { data: existing } = await supabaseAdmin
    .from("words")
    .select("id")
    .eq("date", date)
    .single();

  if (existing) {
    return Response.json({ message: "이미 있어.", date });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [{ role: "user", content: WORD_GENERATION_PROMPT }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(text);

  await supabaseAdmin.from("words").insert({
    date,
    word: parsed.word,
    category: parsed.category,
    hints: [],
  });

  return Response.json({ message: "생성 완료.", date, word: parsed.word });
}
