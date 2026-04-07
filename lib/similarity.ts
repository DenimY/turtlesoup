import Groq from "groq-sdk";
import { SIMILARITY_PROMPT } from "./prompts";

export async function calcSimilarity(
  word: string,
  guess: string
): Promise<number> {
  const trimmed = guess.trim();
  if (!trimmed) return 0;

  // 완전 일치
  if (trimmed === word) return 100;

  const client = new Groq();
  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 5,
    messages: [
      {
        role: "system",
        content: "You are a strict word comparison judge. Reply only YES or NO.",
      },
      { role: "user", content: SIMILARITY_PROMPT(word, trimmed) },
    ],
  });

  const text = (completion.choices[0]?.message?.content ?? "").toUpperCase().trim();
  return text.startsWith("YES") ? 100 : 0;
}
