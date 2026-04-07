import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { calcSimilarity } from "@/lib/similarity";

const client = new Anthropic();

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
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 50,
    system: SYSTEM_PROMPT(word),
    messages: [{ role: "user", content: question }],
  });

  const answer =
    message.content[0].type === "text" ? message.content[0].text : "...";

  return Response.json({ answer, correct: false, score });
}
