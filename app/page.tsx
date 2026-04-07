"use client";

import { useEffect, useRef, useState } from "react";
import TurtleChat from "@/components/TurtleChat";
import ChatBubble from "@/components/ChatBubble";
import StatsBar from "@/components/StatsBar";
import InputBar from "@/components/InputBar";
import WinScreen from "@/components/WinScreen";
import { TURTLE_WELCOME, TURTLE_THINKING } from "@/lib/prompts";

type LogEntry = {
  question: string;
  answer: string;
};

type WinData = {
  word: string;
  qCount: number;
  elapsedSec: number;
  rank: number;
};

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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [winData, setWinData] = useState<WinData | null>(null);
  const [noWord, setNoWord] = useState(false);

  const sessionIdRef = useRef<string>("");
  const startTimeRef = useRef<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();

    // 오늘 단어 확인
    fetch("/api/today-word")
      .then((r) => {
        if (!r.ok) setNoWord(true);
      })
      .catch(() => setNoWord(true));
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  async function handleQuestion(question: string) {
    if (won) return;

    // 타이머 시작
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
      body: JSON.stringify({ question }),
    });
    const data = await res.json();

    setIsThinking(false);
    setBubble(data.answer);
    setScore(data.score ?? 0);
    setLog((prev) => [...prev, { question, answer: data.answer }]);

    if (data.correct) {
      await handleWin(nextCount);
    }
  }

  async function handleWin(finalQCount: number) {
    setWon(true);
    const elapsedSec = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;

    const wordRes = await fetch("/api/today-word");
    const wordData = await wordRes.json();

    const solveRes = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionIdRef.current,
        q_count: finalQCount,
        elapsed_sec: elapsedSec,
      }),
    });
    const solveData = await solveRes.json();

    setWinData({
      word: wordData.word ?? "???",
      qCount: finalQCount,
      elapsedSec,
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
    <main className="flex min-h-full flex-col items-center justify-between gap-6 px-6 py-10">
      {/* 상단: 거북이 + 말풍선 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 w-full">
        {won && winData ? (
          <WinScreen
            word={winData.word}
            qCount={winData.qCount}
            elapsedSec={winData.elapsedSec}
            rank={winData.rank}
          />
        ) : (
          <>
            <TurtleChat bubble={bubble} isThinking={isThinking} />
            <StatsBar qCount={qCount} startTime={startTime} score={score} />
          </>
        )}
      </div>

      {/* 중단: 질문 로그 */}
      {!won && log.length > 0 && (
        <div className="w-full max-w-xs space-y-2 max-h-40 overflow-y-auto py-2">
          {log.map((entry, i) => (
            <ChatBubble key={i} question={entry.question} answer={entry.answer} />
          ))}
          <div ref={logEndRef} />
        </div>
      )}

      {/* 하단: 입력창 */}
      {!won && (
        <InputBar onSubmit={handleQuestion} disabled={isThinking} />
      )}
    </main>
  );
}
