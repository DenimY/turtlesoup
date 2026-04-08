import { GoogleGenAI } from "@google/genai";
import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT, type ToneType } from "@/lib/prompts";
import { calcSimilarity } from "@/lib/similarity";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  try {
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

    // 1. 정답 여부 먼저 체크 (정확히 일치)
    if (question.trim() === word) {
      console.log("[정답] 정확히 일치 → Gemini 호출 없음");
      return Response.json({ answer: "...맞아.", correct: true, score: 100, isQuestion: false });
    }

    // 2. 유사도 측정
    const score = await calcSimilarity(word, question);
    console.log(`[유사도] word="${word}" | question="${question}" | score=${score}`);

    if (score >= 100) {
      console.log("[정답] 유사도 100 → Gemini 호출 없음");
      return Response.json({ answer: "...맞아.", correct: true, score, isQuestion: false });
    }

    // 3. 질문 여부 판별 (의문형 어미 + ?)
    const isQuestion = /[?？]/.test(question) &&
      /(이야|야|이니|니|인가|인가요|나요|을까|ㄹ까|지|죠|잖아|이에요|에요|이죠|이지|이잖아|아|어|어요|나|까|래|대|게)[?？]/.test(question);

    if (!isQuestion) {
      console.log(`[Gemini] 호출 없음 (단어 추측: "${question}")`);
      return Response.json({ answer: "...", correct: false, score, isQuestion: false });
    }

    // 4. Gemini 호출
    console.log(`[Gemini] 호출 중 | 질문: "${question}"`);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: question,
      config: {
        systemInstruction: SYSTEM_PROMPT(word, tone as ToneType),
        maxOutputTokens: 50,
      },
    });

    const answer = response.text ?? "...";

    return Response.json({ answer, correct: false, score, isQuestion: true });
  } catch (err) {
    console.error("[ask] error:", err);
    return Response.json({ error: "서버 오류가 발생했어." }, { status: 500 });
  }
}
