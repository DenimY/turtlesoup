import { GoogleGenAI } from "@google/genai";
import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT, type ToneType } from "@/lib/prompts";
import { calcSimilarity } from "@/lib/similarity";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  const { question, tone = "friendly" } = await request.json();

  if (!question?.trim()) {
    return Response.json({ error: "질문이 없어." }, { status: 400 });
  }

  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  const supabase = getSupabase();
  const { data: wordData, error } = await supabase
    .from("words")
    .select("word")
    .eq("date", today)
    .single();

  if (error || !wordData) {
    return Response.json({ error: "오늘 단어가 없어." }, { status: 404 });
  }

  const word = wordData.word;

  const score = await calcSimilarity(word, question);
  if (score >= 100) {
    return Response.json({ answer: "...맞아.", correct: true, score });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite-preview-06-17",
    contents: question,
    config: {
      systemInstruction: SYSTEM_PROMPT(word, tone as ToneType),
      maxOutputTokens: 50,
    },
  });

  const answer = response.text ?? "...";

  return Response.json({ answer, correct: false, score });
}
