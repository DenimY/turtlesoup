"use client";

import { useRef, useState } from "react";

type Props = {
  onSubmit: (nickname: string) => void;
};

export default function NicknameModal({ onSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = inputRef.current?.value.trim() ?? "";
    onSubmit(val || "익명");
  }

  function handleChange() {
    const val = inputRef.current?.value ?? "";
    setIsEmpty(val.trim().length === 0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-center text-base font-semibold text-zinc-800">
          🎉 정답!
        </h2>
        <p className="mb-4 text-center text-sm text-zinc-400">
          랭킹에 올릴 닉네임을 입력해줘.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            onChange={handleChange}
            onCompositionEnd={handleChange}
            placeholder="닉네임 (최대 10자)"
            maxLength={10}
            autoFocus
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400"
          />
          <button
            type="submit"
            className="rounded-full bg-zinc-800 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            {isEmpty ? "익명으로 등록" : "등록"}
          </button>
        </form>
      </div>
    </div>
  );
}
