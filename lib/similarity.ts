import Groq from "groq-sdk";
import { SIMILARITY_PROMPT } from "./prompts";

const client = new Groq();

export async function calcSimilarity(
  word: string,
  guess: string
): Promise<number> {
  const trimmed = guess.trim();
  if (!trimmed) return 0;

  // 완전 일치
  if (trimmed === word) return 100;

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 20,
    messages: [{ role: "user", content: SIMILARITY_PROMPT(word, trimmed) }],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const match = text.match(/SCORE:\s*(\d+)/);
  if (!match) return 0;

  return Math.min(100, Math.max(0, parseInt(match[1], 10)));
}
