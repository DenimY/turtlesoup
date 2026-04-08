import { GoogleGenAI } from "@google/genai";
import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT, HINT_PROMPT, type ToneType } from "@/lib/prompts";
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

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const t = (tone as ToneType);

    // 1. 정답 여부 먼저 체크 (정확히 일치)
    if (question.trim() === word) {
      console.log("[정답] 정확히 일치 → Gemini 호출 없음");
      const correctAnswer = pick(
        t === "chic"   ? ["...맞아. 잘했네.", "정답이야. 역시.", "맞췄군."] :
        t === "grumpy" ? ["맞잖아! 왜 이제 맞춰!", "그게 맞아. 진짜로.", "어, 맞아. 됐어."] :
                         ["맞아!!! 🎉", "정답이야!! 대단한데?!", "와, 맞췄어!!"]
      );
      return Response.json({ answer: correctAnswer, correct: true, score: 100, isQuestion: false });
    }

    // 2. 힌트 요청 감지
    const isHintRequest = /힌트/.test(question.trim());
    if (isHintRequest) {
      console.log(`[힌트] 요청 → Gemini 호출`);
      const hintRes = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: "힌트 줘",
        config: {
          systemInstruction: HINT_PROMPT(word, t),
          maxOutputTokens: 80,
        },
      });
      return Response.json({ answer: hintRes.text ?? "...", correct: false, score: 0, isQuestion: true });
    }

    // 3. 유사도 측정
    const score = await calcSimilarity(word, question);
    console.log(`[유사도] word="${word}" | question="${question}" | score=${score}`);

    if (score >= 100) {
      console.log("[정답] 유사도 100 → Gemini 호출 없음");
      const correctAnswer = pick(
        t === "chic"   ? ["...맞아. 잘했네.", "정답이야. 역시.", "맞췄군."] :
        t === "grumpy" ? ["맞잖아! 왜 이제 맞춰!", "그게 맞아. 진짜로.", "어, 맞아. 됐어."] :
                         ["맞아!!! 🎉", "정답이야!! 대단한데?!", "와, 맞췄어!!"]
      );
      return Response.json({ answer: correctAnswer, correct: true, score, isQuestion: false });
    }

    // 3. 질문 여부 판별 (의문형 어미 + ?)
    const isQuestion = /[?？]/.test(question) &&
      /(이야|야|이니|니|인가|인가요|나요|을까|ㄹ까|지|죠|잖아|이에요|에요|이죠|이지|이잖아|아|어|어요|나|까|래|대|게)[?？]/.test(question);

    if (!isQuestion) {
      console.log(`[Gemini] 호출 없음 (단어 추측: "${question}")`);

      const guessAnswer =
        score >= 80 ? pick(
          t === "chic"    ? ["거의야.", "가깝네.", "조금만 더."] :
          t === "grumpy"  ? ["거의 다 왔잖아.", "그게 뭐야, 거의잖아.", "조금만 더 해봐."] :
                            ["거의 다 왔어~!", "엄청 가까운데?!", "조금만 더 해봐, 할 수 있어!"]
        ) :
        score >= 50 ? pick(
          t === "chic"    ? ["비슷해.", "연관은 있어.", "가깝긴 한데."] :
          t === "grumpy"  ? ["비슷하긴 한데 아니야.", "뭔가 연관은 있네.", "가깝긴 한데 틀렸어."] :
                            ["오, 뭔가 비슷한 느낌!", "연관은 있는 것 같아~", "조금 더 생각해봐!"]
        ) :
        score >= 20 ? pick(
          t === "chic"    ? ["멀어.", "방향이 달라.", "다시 생각해."] :
          t === "grumpy"  ? ["아직 멀었어.", "방향이 완전 다른데.", "좀 더 생각해봐."] :
                            ["음... 방향이 좀 다른 것 같아.", "아직 멀었어! 다시 해봐!", "흠, 다른 걸 생각해봐~"]
        ) :
        pick(
          t === "chic"    ? ["관련 없어.", "완전 달라.", "아니야."] :
          t === "grumpy"  ? ["전혀 관련 없잖아.", "완전 딴 얘기야.", "이게 뭐야."] :
                            ["전혀 아닌 것 같은데!", "완전 다른 거야~", "힌트를 좀 더 모아봐!"]
        );
      return Response.json({ answer: guessAnswer, correct: false, score, isQuestion: false });
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
