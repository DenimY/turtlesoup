type Props = {
  question: string;
  answer: string;
  isQuestion?: boolean;
};

export default function ChatBubble({ question, answer, isQuestion }: Props) {
  return (
    <div className="flex flex-col gap-0.5 text-sm text-zinc-500">
      <span className="text-zinc-400">
        Q. {question}
        {isQuestion && <span className="ml-1.5 text-xs text-violet-400">AI</span>}
      </span>
      <span className="pl-3 font-medium text-zinc-600">{answer}</span>
    </div>
  );
}
