type Props = {
  question: string;
  answer: string;
  score: number;
  isQuestion?: boolean;
};

export default function ChatBubble({ question, answer, score, isQuestion }: Props) {
  return (
    <div className="flex flex-col gap-0.5 text-sm text-zinc-700">
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-700 font-medium">{question}</span>
        {isQuestion && (
          <span className="text-xs text-violet-500 font-semibold">Q</span>
        )}
      </div>
      <div className="flex items-center gap-2 pl-3">
        <span className="font-medium text-zinc-800">{answer}</span>
        {score > 0 && (
          <span className={`text-xs font-semibold ${
            score >= 70 ? "text-emerald-500" :
            score >= 40 ? "text-amber-500" :
            "text-zinc-400"
          }`}>
            {score}
          </span>
        )}
      </div>
    </div>
  );
}
