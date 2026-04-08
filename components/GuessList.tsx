"use client";

import { useState } from "react";

type LogEntry = {
  question: string;
  answer: string;
  score: number;
};

const PREVIEW = 5;

export default function GuessList({ log }: { log: LogEntry[] }) {
  const [open, setOpen] = useState(false);

  // 중복 단어 제거 (같은 단어면 최고 점수만)
  const seen = new Map<string, LogEntry>();
  for (const e of log) {
    if (e.score <= 0) continue;
    const key = e.question.trim();
    if (!seen.has(key) || seen.get(key)!.score < e.score) {
      seen.set(key, e);
    }
  }
  const topGuesses = [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  if (topGuesses.length === 0) return null;

  const visible = open ? topGuesses : topGuesses.slice(0, PREVIEW);
  const hasMore = topGuesses.length > PREVIEW;

  return (
    <div className="w-full max-w-xs rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
      <div className="px-3 py-2 text-xs font-bold text-zinc-700 border-b border-zinc-200 bg-zinc-50">
        근접한 단어
      </div>
      {visible.map((entry, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-2 text-sm border-b border-zinc-100 last:border-0"
        >
          <span className="text-zinc-700 font-medium">{entry.question}</span>
          <span className={`text-sm font-bold ${
            entry.score >= 70 ? "text-emerald-500" :
            entry.score >= 40 ? "text-amber-500" :
            "text-zinc-400"
          }`}>
            {entry.score}
          </span>
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors text-center border-t border-zinc-100"
        >
          {open ? "접기 ▲" : `${topGuesses.length - PREVIEW}개 더 보기 ▼`}
        </button>
      )}
    </div>
  );
}
