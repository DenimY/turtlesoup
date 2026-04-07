import Groq from "groq-sdk";
import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT, type ToneType } from "@/lib/prompts";
import { calcSimilarity } from "@/lib/similarity";

// "~이 아니야?" → "~이야? (부정 의문문)" 으로 변환해 AI 혼선 방지
function normalizeQuestion(q: string): string {
  const negPatterns = [
    /^(.+?)이?\s*아니야\?*$/,
    /^(.+?)이?\s*아닌가\?*$/,
    /^(.+?)이?\s*아니지\?*$/,
    /^(.+?)이?\s*아닌거야\?*$/,
  ];
  for (const pattern of negPatterns) {
    const m = q.match(pattern);
    if (m) {
      return `"${m[1]}"이 아닌 게 맞아? (즉, "${m[1]}"이 아니라는 게 사실이야?)`;
    }
  }
  return q;
}

export async function POST(request: Request) {
  const client = new Groq();
  const { question, tone = "chic" } = await request.json();

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

  // 부정 의문문 전처리: "~이 아니야?" → "~이야?" + 맥락 설명으로 변환
  const normalizedQuestion = normalizeQuestion(question);

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 50,
    messages: [
      { role: "system", content: SYSTEM_PROMPT(word, tone as ToneType) },
      { role: "user", content: normalizedQuestion },
    ],
  });

  const answer = completion.choices[0]?.message?.content ?? "...";

  return Response.json({ answer, correct: false, score });
}
