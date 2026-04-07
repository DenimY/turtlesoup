"use client";

import { useState } from "react";

type Props = {
  onSubmit: (nickname: string) => void;
};

export default function NicknameModal({ onSubmit }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(value.trim() || "익명");
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
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="닉네임 (최대 10자)"
            maxLength={10}
            autoFocus
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400"
          />
          <button
            type="submit"
            className="rounded-full bg-zinc-800 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            {value.trim() ? "등록" : "익명으로 등록"}
          </button>
        </form>
      </div>
    </div>
  );
}
