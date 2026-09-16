"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

type InsightResult =
  | { ok: true; text: string }
  | { ok: false; reason: "missing-key" | "api-error" | "empty" | "network" };

/**
 * One-line poetic lunar insight for the selected year/hemisphere.
 * Reads the Gemini API key from the environment — never from the client.
 */
export const lunarInsight = action({
  args: {
    year: v.number(),
    hemisphere: v.string(),
    lang: v.string(),
  },
  handler: async (_ctx, { year, hemisphere, lang }): Promise<InsightResult> => {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) return { ok: false, reason: "missing-key" };

    const hemisphereName = hemisphere === "S" ? "Southern" : "Northern";
    const langName = lang === "ES" ? "Spanish" : "English";
    const prompt = [
      `Write exactly one short sentence (max 28 words) of quiet, poetic astronomical inspiration`,
      `about the lunar cycles of ${year} for a viewer in the ${hemisphereName} hemisphere.`,
      `Respond in ${langName}. No quotes, no preamble, no emoji.`,
    ].join(" ");

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 120 },
          }),
        },
      );
      if (!res.ok) return { ok: false, reason: "api-error" };
      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) return { ok: false, reason: "empty" };
      return { ok: true, text };
    } catch {
      return { ok: false, reason: "network" };
    }
  },
});
