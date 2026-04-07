"use client";

import { useEffect, useRef, useState } from "react";
import TurtleChat from "@/components/TurtleChat";
import ChatBubble from "@/components/ChatBubble";
import StatsBar from "@/components/StatsBar";
import InputBar from "@/components/InputBar";
import WinScreen from "@/components/WinScreen";
import NicknameModal from "@/components/NicknameModal";
import { TURTLE_WELCOME, TONE_LABELS, type ToneType } from "@/lib/prompts";

type LogEntry = {
  question: string;
  answer: string;
  score: number;
};

type WinData = {
  word: string;
  qCount: number;
  elapsedSec: number;
  rank: number;
};

// 정답 메타 단어 목록
const META_WORDS = ["정답이 뭐야", "답이 뭐야", "뭔지 말해", "답 알려줘", "정답 알려줘", "뭐야 정답", "정답을 말해", "모르겠어", "모름"];

function getOrCreateSessionId(): string {
  const key = "ts_session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function Home() {
  const [bubble, setBubble] = useState(TURTLE_WELCOME);
  const [isThinking, setIsThinking] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [qCount, setQCount] = useState(0);
  const [score, setScore] = useState(0);
  const [bestGuess, setBestGuess] = useState<{ word: string; score: number } | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [winData, setWinData] = useState<WinData | null>(null);
  const [noWord, setNoWord] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [pendingWin, setPendingWin] = useState<{ qCount: number; elapsedSec: number } | null>(null);
  const [tone, setTone] = useState<ToneType>("friendly");

  const sessionIdRef = useRef<string>("");
  const startTimeRef = useRef<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    fetch("/api/today-word")
      .then((r) => { if (!r.ok) setNoWord(true); })
      .catch(() => setNoWord(true));
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const MAX_Q = 100;

  function isMetaWord(text: string) {
    const t = text.trim();
    return META_WORDS.some((w) => t.includes(w));
  }

  async function handleQuestion(question: string) {
    if (won || qCount >= MAX_Q) return;

    if (isMetaWord(question)) {
      setBubble("그걸 물어보면 어떡해.");
      return;
    }

    if (!startTimeRef.current) {
      const now = Date.now();
      startTimeRef.current = now;
      setStartTime(now);
    }

    setIsThinking(true);
    const nextCount = qCount + 1;
    setQCount(nextCount);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, tone }),
    });
    const data = await res.json();

    setIsThinking(false);
    setBubble(data.answer);
    const newScore = data.score ?? 0;
    setScore(newScore);
    if (newScore > 0 && (bestGuess === null || newScore > bestGuess.score)) {
      setBestGuess({ word: question, score: newScore });
    }
    setLog((prev) => [...prev, { question, answer: data.answer, score: newScore }]);

    if (data.correct) {
      const elapsedSec = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;
      setPendingWin({ qCount: nextCount, elapsedSec });
      setShowNickname(true);
    }
  }

  async function handleNicknameSubmit(nickname: string) {
    setShowNickname(false);
    if (!pendingWin) return;

    const wordRes = await fetch("/api/today-word");
    const wordData = await wordRes.json();

    const solveRes = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionIdRef.current,
        q_count: pendingWin.qCount,
        elapsed_sec: pendingWin.elapsedSec,
        nickname,
      }),
    });
    const solveData = await solveRes.json();

    setWon(true);
    setWinData({
      word: wordData.word ?? "???",
      qCount: pendingWin.qCount,
      elapsedSec: pendingWin.elapsedSec,
      rank: solveData.rank ?? 1,
    });
  }

  if (noWord) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-2xl">🐢</p>
        <p className="text-zinc-400 text-sm">오늘 준비 중이야. 나중에 와.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-col justify-between gap-4 py-10">
      {/* 닉네임 입력 모달 */}
      {showNickname && <NicknameModal onSubmit={handleNicknameSubmit} />}

      {/* 제목 */}
      <div className="flex flex-col items-center gap-1 px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">🐢 바다거북 스프</h1>
        <p className="text-sm text-zinc-400">스무고개로 오늘의 단어를 맞춰봐.</p>
      </div>

      {/* 하우투 + 말투 선택 */}
      <div className="mx-auto w-full max-w-xs space-y-2">
        <div className="rounded-xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 space-y-1">
          <p>💬 질문으로 단어를 추측해봐. 거북이가 예/아니오로 답해줘.</p>
          <p>🎯 단어를 알아냈으면 그냥 입력하면 돼. 질문 횟수 제한은 100개.</p>
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-zinc-400">말투</span>
          {(Object.keys(TONE_LABELS) as ToneType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                tone === t
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {TONE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* 중단: 스탯 + 정답 카드 + 질문 로그 */}
      <div className="flex flex-1 flex-col items-center gap-4 px-6 overflow-hidden">
        <StatsBar qCount={qCount} startTime={startTime} score={score} bestGuess={bestGuess} log={log} />
        {won && winData && (
          <WinScreen
            word={winData.word}
            qCount={winData.qCount}
            elapsedSec={winData.elapsedSec}
            rank={winData.rank}
          />
        )}
        {log.length > 0 && (
          <div className="w-full max-w-xs space-y-2 max-h-60 overflow-y-auto">
            {log.map((entry, i) => (
              <ChatBubble key={i} question={entry.question} answer={entry.answer} />
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>

      {/* 하단: 입력창 + 거북이 */}
      <div className="flex flex-col items-center gap-4">
        <InputBar onSubmit={handleQuestion} disabled={isThinking || won || qCount >= MAX_Q} />
        <TurtleChat bubble={bubble} isThinking={isThinking} />
      </div>
    </main>
  );
}
