"use client";

import { useEffect, useState } from "react";

type LogEntry = {
  question: string;
  answer: string;
  score: number;
};

type Props = {
  qCount: number;
  startTime: number | null;
  score: number;
  bestGuess: { word: string; score: number } | null;
  log: LogEntry[];
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function StatsBar({ qCount, startTime, score, bestGuess, log }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const topGuesses = [...log]
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
      {/* 유사도 바 */}
      <div className="w-full">
        <div className="mb-1 flex justify-between text-xs text-zinc-400">
          <span>유사도</span>
          <span>{score}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* 최고 유사도 단어 + 드롭다운 토글 */}
      {bestGuess && (
        <div className="w-full">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-1.5 text-xs hover:bg-zinc-100 transition-colors"
          >
            <span className="text-zinc-400">가장 근접한 단어</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-zinc-700">{bestGuess.word}</span>
              <span className="text-emerald-500">{bestGuess.score}%</span>
              <span className="text-zinc-300">{open ? "▲" : "▼"}</span>
            </div>
          </button>

          {/* 드롭다운 */}
          {open && topGuesses.length > 0 && (
            <div className="mt-1 w-full rounded-lg border border-zinc-100 bg-white shadow-sm overflow-hidden">
              {topGuesses.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-zinc-50 last:border-0"
                >
                  <span className="text-zinc-500">{entry.question}</span>
                  <span className={`font-semibold ${entry.score >= 70 ? "text-emerald-500" : entry.score >= 40 ? "text-amber-500" : "text-zinc-400"}`}>
                    {entry.score}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 질문수 / 시간 */}
      <div className="flex gap-4 text-xs text-zinc-400">
        <span>질문 {qCount}개</span>
        {startTime && <span>{formatTime(elapsed)}</span>}
      </div>
    </div>
  );
}
