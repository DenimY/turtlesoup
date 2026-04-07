import Anthropic from "@anthropic-ai/sdk";
import { SIMILARITY_PROMPT } from "./prompts";

const client = new Anthropic();

export async function calcSimilarity(
  word: string,
  guess: string
): Promise<number> {
  const trimmed = guess.trim();
  if (!trimmed) return 0;

  // 완전 일치
  if (trimmed === word) return 100;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 20,
    messages: [{ role: "user", content: SIMILARITY_PROMPT(word, trimmed) }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const match = text.match(/SCORE:\s*(\d+)/);
  if (!match) return 0;

  return Math.min(100, Math.max(0, parseInt(match[1], 10)));
}
