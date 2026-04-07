import { GoogleGenAI } from "@google/genai";
import { SIMILARITY_PROMPT } from "./prompts";

export async function calcSimilarity(
  word: string,
  guess: string
): Promise<number> {
  const trimmed = guess.trim();
  if (!trimmed) return 0;

  if (trimmed === word) return 100;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: SIMILARITY_PROMPT(word, trimmed),
    config: {
      systemInstruction: "You are a strict word similarity scorer. Reply only with 'SCORE: <number>'.",
      maxOutputTokens: 10,
    },
  });

  const text = response.text ?? "";
  const match = text.match(/SCORE:\s*(\d+)/);
  if (!match) return 0;

  return Math.min(100, Math.max(0, parseInt(match[1], 10)));
}
