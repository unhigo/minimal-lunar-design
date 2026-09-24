"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { chatCompletion } from "./openllm";

type InsightResult =
  | { ok: true; text: string; model?: string }
  | { ok: false; reason: "missing-key" | "api-error" | "empty" | "network" | "timeout" };

/**
 * One-line poetic lunar insight for the selected year/hemisphere.
 *
 * Primary path: OpenLLM gateway (`OPENLLM_API_KEY` env var, alias fallback
 * chains apply). If the gateway is not configured, fall back to the previous
 * direct Gemini integration (`GEMINI_API_KEY`) so the feature degrades
 * gracefully instead of breaking. A real gateway error is surfaced as-is
 * rather than silently double-spend on Gemini.
 */
export const lunarInsight = action({
  args: {
    year: v.number(),
    hemisphere: v.string(),
    lang: v.string(),
  },
  handler: async (_ctx, { year, hemisphere, lang }): Promise<InsightResult> => {
    const hemisphereName = hemisphere === "S" ? "Southern" : "Northern";
    const langName = lang === "ES" ? "Spanish" : "English";
    const prompt = [
      `Write exactly one short sentence (max 28 words) of quiet, poetic astronomical inspiration`,
      `about the lunar cycles of ${year} for a viewer in the ${hemisphereName} hemisphere.`,
      `Respond in ${langName}. No quotes, no preamble, no emoji.`,
    ].join(" ");

    // ── Primary: OpenLLM gateway ──────────────────────────────────────────
    const viaOpenllm = await chatCompletion({
      messages: [
        {
          role: "system",
          content:
            "You are the editorial voice of MOONØ.LAB, a lunar exploration lab. Answer with the exact format requested, nothing else.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      maxOutputTokens: 120,
    });

    if (viaOpenllm.ok) {
      const model =
        (viaOpenllm.data as { model?: string } | null)?.model ?? undefined;
      return { ok: true, text: viaOpenllm.text, model };
    }
    if (viaOpenllm.reason === "missing-key") {
      return geminiFallback(prompt);
    }
    return { ok: false, reason: viaOpenllm.reason };
  },
});

/** Previous direct-Gemini integration, kept as a graceful fallback. */
async function geminiFallback(prompt: string): Promise<InsightResult> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) return { ok: false, reason: "missing-key" };

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
}
