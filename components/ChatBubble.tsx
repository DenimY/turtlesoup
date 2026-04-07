type Props = {
  question: string;
  answer: string;
};

export default function ChatBubble({ question, answer }: Props) {
  return (
    <div className="flex flex-col gap-0.5 text-sm text-zinc-500">
      <span className="text-zinc-400">Q. {question}</span>
      <span className="pl-3 font-medium text-zinc-600">{answer}</span>
    </div>
  );
}
