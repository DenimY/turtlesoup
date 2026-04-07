"use client";

import { useState } from "react";

type Props = {
  text: string;
  onClose: () => void;
};

export default function ShareModal({ text, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-center text-base font-semibold text-zinc-800">
          결과 공유
        </h2>
        <pre className="mb-4 whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-center text-sm leading-6 text-zinc-600">
          {text}
        </pre>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-full bg-zinc-800 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            {copied ? "복사됨!" : "클립보드 복사"}
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
