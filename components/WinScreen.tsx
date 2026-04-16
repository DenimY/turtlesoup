"use client";

import { useState } from "react";
import ShareModal from "./ShareModal";
import RankingBoard from "./RankingBoard";

type Props = {
  word: string;
  qCount: number;
  elapsedSec: number;
  rank: number;
  onTryNewWord?: (word: string) => void;
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

export default function WinScreen({ word, qCount, elapsedSec, rank, onTryNewWord }: Props) {
  const [showShare, setShowShare] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [newWord, setNewWord] = useState("");
  const isCustomGame = rank === 0;
  const shareText = buildShareText(word, qCount, elapsedSec, rank);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = newWord.trim();
    if (!trimmed || !onTryNewWord) return;
    onTryNewWord(trimmed);
  }

  return (
    <>
      <div className="w-full max-w-xs rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🎉</span>
          <span className="font-bold text-emerald-700">정답!</span>
          {isCustomGame && (
            <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-600">개인 게임</span>
          )}
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
          {!isCustomGame && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-zinc-700">{rank}번째</span>
              <span>정답자</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {!isCustomGame && (
            <button
              onClick={() => setShowShare(true)}
              className="w-full rounded-full bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              결과 공유
            </button>
          )}
          {onTryNewWord && !showInput && (
            <button
              onClick={() => setShowInput(true)}
              className="w-full rounded-full border border-emerald-400 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              새로운 정답으로 시도하기
            </button>
          )}
          {showInput && (
            <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
              <input
                autoFocus
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="새 정답 단어 입력"
                className="flex-1 rounded-full border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={!newWord.trim()}
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                시작
              </button>
            </form>
          )}
        </div>
      </div>

      {!isCustomGame && <RankingBoard myRank={rank} />}

      {showShare && (
        <ShareModal text={shareText} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
