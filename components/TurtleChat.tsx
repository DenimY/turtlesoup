"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  bubble: string;
  isThinking: boolean;
};

export default function TurtleChat({ bubble, isThinking }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 말풍선 */}
      <div className="relative min-h-[56px] min-w-[120px] max-w-[280px]">
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 shadow-sm">
          <p
            className={`text-center text-lg font-medium tracking-wide text-zinc-800 transition-opacity duration-300 ${
              isThinking ? "opacity-40" : "opacity-100"
            }`}
          >
            {isThinking ? "음..." : bubble}
          </p>
        </div>
        {/* 말풍선 꼬리 */}
        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 border-x-[10px] border-t-[10px] border-x-transparent border-t-white" />
        <div className="absolute bottom-[-12px] left-1/2 -translate-x-1/2 border-x-[11px] border-t-[11px] border-x-transparent border-t-zinc-200" style={{ zIndex: -1 }} />
      </div>

      {/* 거북이 */}
      {imgError ? (
        <div className="flex h-36 w-36 items-center justify-center select-none text-8xl">
          🐢
        </div>
      ) : (
        <div className="relative h-36 w-36 select-none">
          <Image
            src="/turtle.png"
            alt="거북이"
            fill
            className="object-contain drop-shadow-md"
            priority
            onError={() => setImgError(true)}
          />
        </div>
      )}
    </div>
  );
}
