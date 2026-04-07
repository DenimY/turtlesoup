import Groq from "groq-sdk";
import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { calcSimilarity } from "@/lib/similarity";

const client = new Groq();

export async function POST(request: Request) {
  const { question } = await request.json();

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

  // 유사도 체크 (정답 시도 감지)
  const score = await calcSimilarity(word, question);
  if (score >= 85) {
    return Response.json({ answer: "...맞아.", correct: true, score });
  }

  // 일반 질문 답변
  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 50,
    messages: [
      { role: "system", content: SYSTEM_PROMPT(word) },
      { role: "user", content: question },
    ],
  });

  const answer = completion.choices[0]?.message?.content ?? "...";

  return Response.json({ answer, correct: false, score });
}
