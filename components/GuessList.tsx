"use client";

type LogEntry = {
  question: string;
  answer: string;
  score: number;
  isQuestion?: boolean;
};

export default function GuessList({ log }: { log: LogEntry[] }) {
  // 중복 단어 제거 (같은 단어면 최고 점수만), 질문 제외
  const seen = new Map<string, LogEntry>();
  for (const e of log) {
    if (e.isQuestion) continue;
    const key = e.question.trim();
    if (!seen.has(key) || seen.get(key)!.score < e.score) {
      seen.set(key, e);
    }
  }
  const topGuesses = [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  if (topGuesses.length === 0) return null;

  return (
    <div className="w-full max-w-xs rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
      <div className="px-3 py-2 text-xs font-bold text-zinc-700 border-b border-zinc-200 bg-zinc-50">
        근접한 단어
      </div>
      {topGuesses.map((entry, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-2 text-sm border-b border-zinc-100 last:border-0"
        >
          <span className="text-zinc-700 font-medium">{entry.question}</span>
          <span className={`text-sm font-bold ${
            entry.score >= 70 ? "text-emerald-500" :
            entry.score >= 40 ? "text-amber-500" :
            entry.score > 0   ? "text-zinc-500" :
                                "text-zinc-400"
          }`}>
            {entry.score}
          </span>
        </div>
      ))}
    </div>
  );
}
