"use client";

import { useEffect, useRef, useState } from "react";
import TurtleChat from "@/components/TurtleChat";
import StatsBar from "@/components/StatsBar";
import GuessList from "@/components/GuessList";
import InputBar from "@/components/InputBar";
import WinScreen from "@/components/WinScreen";
import NicknameModal from "@/components/NicknameModal";
import { TURTLE_WELCOME, TONE_LABELS, type ToneType } from "@/lib/prompts";

type LogEntry = {
  question: string;
  answer: string;
  score: number;
  isQuestion: boolean;
};

type WinData = {
  word: string;
  qCount: number;
  elapsedSec: number;
  rank: number;
};

const META_WORDS = [
  "정답이 뭐야", "답이 뭐야", "뭔지 말해", "답 알려줘", "정답 알려줘",
  "정답을 말해", "정답 말해", "대답해", "답해", "말해봐", "알려줘",
  "뭐야?", "뭐야", "뭔데", "모르겠어", "모름", "포기",
];

const BASE_Q = 20;
const BONUS_Q = 10;
const GAME_KEY = "ts_game";

function getOrCreateSessionId(): string {
  const key = "ts_session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export default function Home() {
  const [bubble, setBubble] = useState(TURTLE_WELCOME);
  const [isThinking, setIsThinking] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [qCount, setQCount] = useState(0);
  const [score, setScore] = useState(0);
  const [bestGuess, setBestGuess] = useState<{ word: string; score: number } | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [winData, setWinData] = useState<WinData | null>(null);
  const [noWord, setNoWord] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [pendingWin, setPendingWin] = useState<{ qCount: number; elapsedSec: number } | null>(null);
  const [tone, setTone] = useState<ToneType>("friendly");
  const [maxQ, setMaxQ] = useState(BASE_Q);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const sessionIdRef = useRef<string>("");
  const startTimeRef = useRef<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  // 초기 로드가 완료되기 전에 save effect가 빈 상태를 덮어쓰지 않도록 방지
  const loadedRef = useRef(false);

  // 마운트: 세션 ID, 오늘 단어 확인, 저장된 상태 복원
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    fetch("/api/today-word")
      .then((r) => { if (!r.ok) setNoWord(true); })
      .catch(() => setNoWord(true));

    try {
      const raw = localStorage.getItem(GAME_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.date === todayKST()) {
          if (saved.log?.length) setLog(saved.log);
          if (saved.qCount) setQCount(saved.qCount);
          if (saved.score) setScore(saved.score);
          if (saved.bestGuess) setBestGuess(saved.bestGuess);
          if (saved.startTime) {
            setStartTime(saved.startTime);
            startTimeRef.current = saved.startTime;
          }
          if (saved.won) setWon(saved.won);
          if (saved.winData) setWinData(saved.winData);
          if (saved.maxQ) setMaxQ(saved.maxQ);
          if (saved.bubble) setBubble(saved.bubble);
          if (saved.tone) setTone(saved.tone);
        }
      }
    } catch (_) { /* 손상된 데이터 무시 */ }

    loadedRef.current = true;
  }, []);

  // 상태 변경 시 localStorage 저장 (초기 로드 완료 후에만)
  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(GAME_KEY, JSON.stringify({
        date: todayKST(),
        log, qCount, score, bestGuess, startTime, won, winData, maxQ, bubble, tone,
      }));
    } catch (_) { /* 저장 실패 무시 */ }
  }, [log, qCount, score, bestGuess, startTime, won, winData, maxQ, bubble, tone]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  function isMetaWord(text: string) {
    const t = text.trim();
    return META_WORDS.some((w) => t.includes(w));
  }

  async function handleQuestion(question: string) {
    if (won || qCount >= maxQ) return;

    if (!question.includes("힌트") && isMetaWord(question)) {
      setBubble("그걸 물어보면 어떡해.");
      return;
    }

    if (!startTimeRef.current) {
      const now = Date.now();
      startTimeRef.current = now;
      setStartTime(now);
    }

    setIsThinking(true);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, tone }),
    });
    const data = await res.json();

    if (data._dev === "similarity_error") {
      console.warn("[DEV] similarity-server 응답 실패 — 점수가 0으로 처리됨. Railway 배포 상태 확인 필요.");
    }

    const nextCount = data.isQuestion ? qCount + 1 : qCount;
    if (data.isQuestion) setQCount(nextCount);

    setIsThinking(false);
    setBubble(data.answer);
    const newScore = data.score ?? 0;
    setScore(newScore);
    if (newScore > 0 && (bestGuess === null || newScore > bestGuess.score)) {
      setBestGuess({ word: question, score: newScore });
    }
    setLog((prev) => [...prev, { question, answer: data.answer, score: newScore, isQuestion: !!data.isQuestion }]);

    if (data.correct) {
      const elapsedSec = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;
      setPendingWin({ qCount: nextCount, elapsedSec });
      setShowNickname(true);
    }
  }

  async function handleNicknameSubmit(nickname: string) {
    setShowNickname(false);
    if (!pendingWin) return;

    const wordRes = await fetch("/api/today-word");
    const wordData = await wordRes.json();

    const solveRes = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionIdRef.current,
        q_count: pendingWin.qCount,
        elapsed_sec: pendingWin.elapsedSec,
        nickname,
      }),
    });
    const solveData = await solveRes.json();

    setWon(true);
    setWinData({
      word: wordData.word ?? "???",
      qCount: pendingWin.qCount,
      elapsedSec: pendingWin.elapsedSec,
      rank: solveData.rank ?? 1,
    });
  }

  if (noWord) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-2xl">🐢</p>
        <p className="text-zinc-500 text-sm">오늘 준비 중이야. 나중에 와.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-col justify-between gap-4 py-10">
      {showNickname && <NicknameModal onSubmit={handleNicknameSubmit} />}

      {/* 제목 */}
      <div className="flex flex-col items-center gap-1 px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">🐢 바다거북 스프</h1>
        <p className="text-sm text-zinc-500">스무고개로 오늘의 단어를 맞춰봐.</p>
      </div>

      {/* 안내 + 말투 선택 */}
      <div className="mx-auto w-full max-w-xs space-y-2">
        <div className="rounded-xl bg-zinc-50 px-4 py-3 text-xs text-zinc-700 space-y-1.5">
          <p>💬 질문으로 단어를 추측해봐. 거북이가 예/아니오로 답해줘.</p>
          <p>🎯 단어를 알아냈으면 물음표 없이 그냥 입력하면 돼. 기본 질문 횟수는 20개.</p>
          <p className="text-zinc-500">· 유사도 100점 또는 정확히 일치하면 정답으로 인식해.</p>
          <p className="text-zinc-500">· 물음표(?)나 질문 어미(야?, 이야?, 나요? 등)로 끝나면 질문으로 간주해서 횟수가 차감돼.</p>
          <p className="text-zinc-500">· 정답을 말할 땐 단어만 단독으로 입력해야 정답으로 인식해.</p>
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-zinc-600 font-medium">말투</span>
          {(Object.keys(TONE_LABELS) as ToneType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                tone === t
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {TONE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* 중단: 스탯 + 정답 카드 + 최근 질문 */}
      <div className="flex flex-1 flex-col items-center gap-4 px-6 overflow-hidden">
        <StatsBar qCount={qCount} maxQ={maxQ} startTime={startTime} score={score} />
        {won && winData && (
          <WinScreen
            word={winData.word}
            qCount={winData.qCount}
            elapsedSec={winData.elapsedSec}
            rank={winData.rank}
          />
        )}
        {log.length > 0 && (() => {
          const last = log[log.length - 1];
          return (
            <div className="w-full max-w-xs flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-700 font-medium">{last.question}</span>
                {last.isQuestion && <span className="text-violet-500 font-semibold">Q</span>}
              </div>
              {last.score > 0 && (
                <span className={`font-semibold ${
                  last.score >= 70 ? "text-emerald-500" :
                  last.score >= 40 ? "text-amber-500" :
                  "text-zinc-500"
                }`}>{last.score}</span>
              )}
            </div>
          );
        })()}
      </div>

      {/* 하단: 광고 버튼 + 입력창 + 거북이 + 근접 단어 리스트 */}
      <div className="flex flex-col items-center gap-4">
        {!won && qCount >= maxQ && (
          <button
            onClick={() => {
              setIsWatchingAd(true);
              setTimeout(() => {
                setMaxQ((prev) => prev + BONUS_Q);
                setIsWatchingAd(false);
              }, 5000);
            }}
            disabled={isWatchingAd}
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-medium text-white hover:bg-amber-300 disabled:opacity-50 transition-colors"
          >
            {isWatchingAd ? "광고 시청 중... 잠시만 기다려줘" : "광고 보고 질문 10회 추가"}
          </button>
        )}
        <InputBar onSubmit={handleQuestion} disabled={isThinking || won || qCount >= maxQ || isWatchingAd} />
        <TurtleChat bubble={bubble} isThinking={isThinking} />
        <GuessList log={log} />
      </div>
    </main>
  );
}
