"use client";

import { useState } from "react";
import ShareModal from "./ShareModal";

type Props = {
  word: string;
  qCount: number;
  elapsedSec: number;
  rank: number;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}초`;
  return `${m}분 ${s}초`;
}

function buildShareText(word: string, qCount: number, elapsedSec: number, rank: number) {
  const today = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
  return `🐢 바다거북 스프 ${today}
정답: ${word}
질문 ${qCount}개 · ${formatTime(elapsedSec)}
오늘 ${rank}번째 정답!

play.turtlesoup.kr`;
}

export default function WinScreen({ word, qCount, elapsedSec, rank }: Props) {
  const [showShare, setShowShare] = useState(false);
  const shareText = buildShareText(word, qCount, elapsedSec, rank);

  return (
    <>
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="text-4xl">🎉</div>
        <div>
          <p className="text-2xl font-bold text-zinc-800">{word}</p>
          <p className="mt-1 text-sm text-zinc-400">정답이야.</p>
        </div>
        <div className="flex gap-6 text-sm text-zinc-500">
          <div className="flex flex-col items-center">
            <span className="text-xl font-semibold text-zinc-700">{qCount}</span>
            <span>질문</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-semibold text-zinc-700">{formatTime(elapsedSec)}</span>
            <span>시간</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-semibold text-zinc-700">{rank}번째</span>
            <span>정답자</span>
          </div>
        </div>
        <button
          onClick={() => setShowShare(true)}
          className="rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          결과 공유
        </button>
      </div>

      {showShare && (
        <ShareModal text={shareText} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
