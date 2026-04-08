export async function calcSimilarity(
  word: string,
  guess: string
): Promise<number> {
  const trimmed = guess.trim();
  if (!trimmed) return 0;
  if (trimmed === word) return 100;

  const url = process.env.SIMILARITY_SERVER_URL;
  const secret = process.env.SIMILARITY_API_SECRET;

  if (!url) {
    console.error("[similarity] SIMILARITY_SERVER_URL 환경변수 없음");
    return -1;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    console.log(`[similarity] 요청: word="${word}", guess="${trimmed}"`);
    const res = await fetch(`${url}/similarity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-api-secret": secret } : {}),
      },
      body: JSON.stringify({ word, guess: trimmed }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[similarity] HTTP 에러: ${res.status}`);
      return -1;
    }

    const data = await res.json();
    console.log(`[similarity] 결과: score=${data.score}`);
    return Math.min(100, Math.max(0, data.score ?? 0));
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[similarity] 타임아웃 (5s 초과)");
    } else {
      console.error("[similarity] 요청 실패:", err);
    }
    return -1;
  }
}
