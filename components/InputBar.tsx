"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onSubmit: (question: string) => void;
  disabled: boolean;
  placeholder?: string;
};

export default function InputBar({ onSubmit, disabled, placeholder = "질문하거나 정답을 맞춰봐..." }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xs gap-2"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 placeholder-zinc-300 outline-none focus:border-zinc-400 disabled:opacity-50"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
      >
        전송
      </button>
    </form>
  );
}
