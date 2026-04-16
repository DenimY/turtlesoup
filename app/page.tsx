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
const WINS_KEY = "ts_wins";

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
  const [wins, setWins] = useState<WinData[]>([]);
  const [noWord, setNoWord] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [pendingWin, setPendingWin] = useState<{ qCount: number; elapsedSec: number } | null>(null);
  const [tone, setTone] = useState<ToneType>("friendly");
  const [maxQ, setMaxQ] = useState(BASE_Q);
  const [showGuideDetail, setShowGuideDetail] = useState(false);
  const [customWord, setCustomWord] = useState<string | null>(null);

  const sessionIdRef = useRef<string>("");
  const startTimeRef = useRef<number | null>(null);
  const loadedRef = useRef(false);

  // 마운트: 세션 ID, 오늘 단어 확인, 저장된 상태 복원
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    fetch("/api/today-word")
      .then((r) => { if (!r.ok) setNoWord(true); })
      .catch(() => setNoWord(true));

    // 1) 일반 게임 복원 (localStorage)
    let dailyWinData: WinData | null = null;
    try {
      const raw = localStorage.getItem(GAME_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.date === todayKST()) {
          if (saved.log?.length) setLog(saved.log);
          if (saved.qCount) setQCount(saved.qCount);
          if (saved.score) setScore(saved.score);
          if (saved.bestGuess) setBestGuess(saved.bestGuess);
          if (saved.startTime) { setStartTime(saved.startTime); startTimeRef.current = saved.startTime; }
          if (saved.won) setWon(saved.won);
          if (saved.winData) dailyWinData = saved.winData;
          if (saved.maxQ) setMaxQ(saved.maxQ);
          if (saved.bubble) setBubble(saved.bubble);
          if (saved.tone) setTone(saved.tone);
        }
      }
    } catch (_) { /* 손상된 데이터 무시 */ }

    // 2) 커스텀 게임 복원 (sessionStorage) — 일반 게임보다 우선
    try {
      const raw = sessionStorage.getItem(GAME_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setCustomWord(saved.customWord ?? null);
        setLog(saved.log?.length ? saved.log : []);
        setQCount(saved.qCount ?? 0);
        setScore(saved.score ?? 0);
        setBestGuess(saved.bestGuess ?? null);
        if (saved.startTime) { setStartTime(saved.startTime); startTimeRef.current = saved.startTime; }
        else { setStartTime(null); startTimeRef.current = null; }
        setWon(saved.won ?? false);
        if (saved.maxQ) setMaxQ(saved.maxQ);
        if (saved.bubble) setBubble(saved.bubble);
      }
    } catch (_) { /* 손상된 데이터 무시 */ }

    // 3) 누적 wins 복원 (sessionStorage) — 없으면 일반 정답으로 초기화
    try {
      const raw = sessionStorage.getItem(WINS_KEY);
      if (raw) {
        setWins(JSON.parse(raw));
      } else if (dailyWinData) {
        setWins([dailyWinData]);
      }
    } catch (_) { /* 손상된 데이터 무시 */ }

    loadedRef.current = true;
  }, []);

  // 일반 게임 저장
  useEffect(() => {
    if (!loadedRef.current || customWord) return;
    try {
      localStorage.setItem(GAME_KEY, JSON.stringify({
        date: todayKST(),
        log, qCount, score, bestGuess, startTime, won,
        winData: wins[0] ?? null,
        maxQ, bubble, tone,
      }));
    } catch (_) { /* 저장 실패 무시 */ }
  }, [log, qCount, score, bestGuess, startTime, won, wins, maxQ, bubble, tone, customWord]);

  // 커스텀 게임 저장
  useEffect(() => {
    if (!loadedRef.current || !customWord) return;
    try {
      sessionStorage.setItem(GAME_KEY, JSON.stringify({
        customWord, log, qCount, score, bestGuess, startTime, won, maxQ, bubble,
      }));
    } catch (_) { /* 저장 실패 무시 */ }
  }, [customWord, log, qCount, score, bestGuess, startTime, won, maxQ, bubble]);

  // wins 저장
  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      sessionStorage.setItem(WINS_KEY, JSON.stringify(wins));
    } catch (_) { /* 저장 실패 무시 */ }
  }, [wins]);

  function isMetaWord(text: string) {
    return META_WORDS.some((w) => text.trim().includes(w));
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
      body: JSON.stringify({ question, tone, ...(customWord ? { customWord } : {}) }),
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
      if (customWord) {
        // 커스텀 게임 정답 — 랭킹 없이 바로 승리
        setWon(true);
        setWins((prev) => [...prev, { word: customWord, qCount: nextCount, elapsedSec, rank: 0 }]);
      } else {
        // 일반 게임 정답 — 닉네임 입력 후 랭킹 등록
        setPendingWin({ qCount: nextCount, elapsedSec });
        setShowNickname(true);
      }
    }
  }

  function startNewCustomGame(word: string) {
    setCustomWord(word);
    setLog([]);
    setQCount(0);
    setScore(0);
    setBestGuess(null);
    setStartTime(null);
    startTimeRef.current = null;
    setWon(false);
    setMaxQ(BASE_Q);
    setBubble(TURTLE_WELCOME);
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
    setWins((prev) => [...prev, {
      word: wordData.word ?? "???",
      qCount: pendingWin.qCount,
      elapsedSec: pendingWin.elapsedSec,
      rank: solveData.rank ?? 1,
    }]);
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

      {/* 안내 */}
      <div className="mx-auto w-full max-w-xs rounded-xl bg-zinc-50 px-4 py-3 text-xs text-zinc-700 space-y-1.5">
        <p>💬 질문으로 단어를 추측해봐. 거북이가 예/아니오로 답해줘.</p>
        <p>🎯 단어를 알아냈으면 물음표 없이 그냥 입력하면 돼. 기본 질문 횟수는 20개.</p>
        <button
          onClick={() => setShowGuideDetail((v) => !v)}
          className="text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          {showGuideDetail ? "▲ 접기" : "▼ 자세히"}
        </button>
        {showGuideDetail && (
          <div className="space-y-1 pt-0.5">
            <p className="text-zinc-500">· 유사도 100점 또는 정확히 일치하면 정답으로 인식해.</p>
            <p className="text-zinc-500">· 물음표(?)나 질문 어미(야?, 이야?, 나요? 등)로 끝나면 질문으로 간주해서 횟수가 차감돼.</p>
            <p className="text-zinc-500">· 정답을 말할 땐 단어만 단독으로 입력해야 정답으로 인식해.</p>
          </div>
        )}
      </div>

      {/* 중단: 스탯 + 누적 정답 카드 + 최근 질문 */}
      <div className="flex flex-1 flex-col items-center gap-4 px-6 overflow-hidden">
        <StatsBar qCount={qCount} maxQ={maxQ} startTime={startTime} score={score} />
        {customWord && (
          <div className="w-full max-w-xs rounded-xl bg-violet-50 border border-violet-200 px-4 py-2.5 text-xs text-violet-700 space-y-0.5">
            <p className="font-medium">개인 설정 단어로 진행 중이야.</p>
            <p className="text-violet-500">⚠️ 다른 사람과 정답이 다를 수 있어.</p>
          </div>
        )}
        {wins.map((w, i) => (
          <WinScreen
            key={i}
            word={w.word}
            qCount={w.qCount}
            elapsedSec={w.elapsedSec}
            rank={w.rank}
            onTryNewWord={i === wins.length - 1 && won ? startNewCustomGame : undefined}
          />
        ))}
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

      {/* 하단: 추가 질문 버튼 + 입력창 + 거북이 + 근접 단어 리스트 */}
      <div className="flex flex-col items-center gap-4">
        {!won && qCount >= maxQ && (
          // TODO: 광고 시청 후 질문 추가 기능 연동
          <button
            onClick={() => setMaxQ((prev) => prev + BONUS_Q)}
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-medium text-white hover:bg-amber-300 transition-colors"
          >
            질문 {BONUS_Q}회 추가
          </button>
        )}
        <InputBar onSubmit={handleQuestion} disabled={isThinking || won || qCount >= maxQ} />
        <TurtleChat bubble={bubble} isThinking={isThinking} />
        <GuessList log={log} />
        <div className="mx-auto w-full max-w-xs space-y-2 pt-2">
          <div className="rounded-xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 space-y-1">
            <p>· 유사도 100점 또는 정확히 일치하면 정답으로 인식해.</p>
            <p>· 물음표(?)나 질문 어미(야?, 이야?, 나요? 등)로 끝나면 질문으로 간주해서 횟수가 차감돼.</p>
            <p>· 정답을 말할 땐 단어만 단독으로 입력해야 정답으로 인식해.</p>
            <p>· '새로운 정답으로 시도하기'는 개인 설정 단어로 진행되며, 다른 사람과 정답이 달라.</p>
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
      </div>
    </main>
  );
}
