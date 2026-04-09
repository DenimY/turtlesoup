"use client";

type Props = {
  bubble: string;
  isThinking: boolean;
};

export default function TurtleChat({ bubble, isThinking }: Props) {
  return (
    <div className="flex items-center gap-4">
      {/* 거북이 (좌측) */}
      <img
        src="/turtle.png"
        alt="거북이"
        width={256}
        height={256}
        className="shrink-0 select-none object-contain drop-shadow-md"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).replaceWith(
            Object.assign(document.createElement("div"), {
              textContent: "🐢",
              className: "shrink-0 flex items-center justify-center text-[160px] select-none",
            })
          );
        }}
      />

      {/* 말풍선 (우측) */}
      <div className="relative min-h-[48px] min-w-[80px] max-w-[240px]">
        {/* 말풍선 꼬리 (좌측 방향) */}
        <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 border-y-[8px] border-r-[10px] border-y-transparent border-r-white" />
        <div
          className="absolute left-[-12px] top-1/2 -translate-y-1/2 border-y-[9px] border-r-[11px] border-y-transparent border-r-zinc-200"
          style={{ zIndex: -1 }}
        />
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <p
            className={`text-base font-medium tracking-wide text-zinc-800 transition-opacity duration-300 ${
              isThinking ? "opacity-40" : "opacity-100"
            }`}
          >
            {isThinking ? "음..." : bubble}
          </p>
        </div>
      </div>
    </div>
  );
}
