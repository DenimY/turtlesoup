"use client";

import { useState } from "react";
import ShareModal from "./ShareModal";
import RankingBoard from "./RankingBoard";

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
      <div className="w-full max-w-xs rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🎉</span>
          <span className="font-bold text-emerald-700">정답!</span>
        </div>
        <p className="text-2xl font-bold text-zinc-800 mb-4">{word}</p>
        <div className="flex gap-5 text-sm text-zinc-500 mb-4">
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-zinc-700">{qCount}개</span>
            <span>질문</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-zinc-700">{formatTime(elapsedSec)}</span>
            <span>시간</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-zinc-700">{rank}번째</span>
            <span>정답자</span>
          </div>
        </div>
        <button
          onClick={() => setShowShare(true)}
          className="w-full rounded-full bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          결과 공유
        </button>
      </div>

      <RankingBoard myRank={rank} />

      {showShare && (
        <ShareModal text={shareText} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
