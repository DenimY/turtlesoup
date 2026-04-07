"use client";

import { useEffect, useState } from "react";

type RankEntry = {
  nickname: string;
  q_count: number;
  elapsed_sec: number;
  rank: number;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}초`;
  return `${m}분 ${s}초`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function RankingBoard({ myRank }: { myRank: number }) {
  const [list, setList] = useState<RankEntry[]>([]);

  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => r.json())
      .then(setList);
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="w-full max-w-xs">
      <p className="mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide">오늘의 랭킹</p>
      <div className="flex flex-col gap-1">
        {list.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
              entry.rank === myRank
                ? "bg-emerald-50 border border-emerald-200 font-semibold"
                : "bg-zinc-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-center">
                {MEDALS[entry.rank - 1] ?? `${entry.rank}`}
              </span>
              <span className="text-zinc-700">{entry.nickname}</span>
            </div>
            <div className="flex gap-3 text-xs text-zinc-400">
              <span>{entry.q_count}개</span>
              <span>{formatTime(entry.elapsed_sec)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
