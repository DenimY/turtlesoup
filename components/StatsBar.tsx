"use client";

import { useEffect, useState } from "react";

type Props = {
  qCount: number;
  maxQ: number;
  startTime: number | null;
  score: number;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function StatsBar({ qCount, maxQ, startTime, score }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
      {/* 유사도 바 */}
      <div className="w-full">
        <div className="mb-1 flex justify-between text-xs text-zinc-600 font-medium">
          <span>유사도</span>
          <span>{score}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* 질문수 / 남은 횟수 / 시간 */}
      <div className="flex gap-4 text-xs text-zinc-600 font-medium">
        <span>질문 {qCount}개</span>
        <span className={qCount >= maxQ ? "text-red-500 font-bold" : ""}>
          남은 횟수 {Math.max(0, maxQ - qCount)}개
        </span>
        {startTime && <span>{formatTime(elapsed)}</span>}
      </div>
    </div>
  );
}
