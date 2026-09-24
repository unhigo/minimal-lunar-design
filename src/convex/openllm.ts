"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * OpenLLM gateway client — MOONØ.LAB's unified AI entry point.
 *
 * OpenLLM (https://www.openllm.sh) exposes an OpenAI-compatible surface.
 * For API-key credentials (`sk-llm-…`) requests go through the hosted
 * gateway at https://www.openllm.sh/v1 — no local daemon required. The key
 * is read from the environment, never bundled into the client.
 *
 * Aliases (`lite`, `plus`, `ultra`, …) resolve against the account's fallback
 * chain; concrete `provider/model` IDs pin one model (see
 * https://docs.openllm.sh/fallback-chains).
 *
 * Claude through OpenLLM:
 * - API path: pin a concrete Claude ID (`anthropic/claude-…`) via the
 *   `model` arg or the `OPENLLM_MODEL` env var — same OpenAI-compatible
 *   endpoint, gateway routes the hop to the Anthropic provider.
 * - Verify the exact IDs available to the account with the `listModels`
 *   action (GET /v1/models is account-specific).
 * - Terminal usage (outside this app): `openllm claude` launches Claude
 *   Code through OpenLLM; requires the CLI/daemon installed on that machine
 *   (Devices & keys → Add a device), not in this repository.
 */

export const DEFAULT_BASE_URL = "https://www.openllm.sh/v1";
const DEFAULT_MODEL = "plus";

/**
 * Common Claude concrete IDs to pin via the `model` arg or `OPENLLM_MODEL`.
 * Suggestions only — the authoritative account-specific catalog comes from
 * the `listModels` action (GET /v1/models).
 */
export const CLAUDE_MODEL_SUGGESTIONS = [
  "anthropic/claude-sonnet-4-5",
  "anthropic/claude-opus-4-1",
  "anthropic/claude-haiku-4-5",
] as const;

const TIMEOUT_MS = 30_000;

/** Env var the user must set in the Keys/API keys panel. */
export const OPENLLM_KEY_ENV = "OPENLLM_API_KEY";

export const chatMessages = v.array(
  v.object({
    role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
    content: v.string(),
  }),
);

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenLlmResult =
  | { ok: true; text: string; model: string }
  | {
      ok: false;
      reason: "missing-key" | "api-error" | "empty" | "network" | "timeout";
      detail?: string;
    };

function resolveKey(): string | undefined {
  return process.env.OPENLLM_API_KEY ?? process.env.OPENLLM_API_KEY_LOCAL;
}

function resolveBaseUrl(): string {
  const raw = process.env.OPENLLM_BASE_URL?.trim();
  if (!raw) return DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, "");
}

/** Low-level POST to the gateway with timeout + status handling. Shared by
 *  every request in this module. */
async function gatewayPost(
  path: string,
  body: unknown,
): Promise<
  | { ok: true; data: unknown; status: number }
  | { ok: false; reason: "api-error" | "network" | "timeout"; status?: number; detail?: string }
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${resolveBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolveKey() ?? ""}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail: string | undefined;
      try {
        detail = (await res.text()).slice(0, 300);
      } catch {
        // body unreadable — leave detail undefined
      }
      return { ok: false, reason: "api-error", status: res.status, detail };
    }
    const data: unknown = await res.json();
    return { ok: true, data, status: res.status };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "network", detail: err instanceof Error ? err.message : undefined };
  } finally {
    clearTimeout(timer);
  }
}

/** Extract the assistant text from an OpenAI-compatible completion payload. */
export function extractCompletionText(data: unknown): string | null {
  const d = data as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = d.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    const text = content.trim();
    return text.length > 0 ? text : null;
  }
  // Some gateways return content as an array of typed parts.
  if (Array.isArray(content)) {
    const joined = content
      .map((part) =>
        part && typeof part === "object" && "text" in part
          ? String((part as { text?: unknown }).text ?? "")
          : "",
      )
      .join("")
      .trim();
    return joined.length > 0 ? joined : null;
  }
  return null;
}

export interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Shared chat-completion core, callable from other Convex modules (ai.ts)
 * without crossing the action API boundary. Returns the raw gateway payload
 * on success so callers can extract model metadata themselves.
 */
export async function chatCompletion(args: ChatOptions): Promise<
  | { ok: true; data: unknown; text: string }
  | { ok: false; reason: "missing-key" | "api-error" | "empty" | "network" | "timeout"; detail?: string }
> {
  const apiKey = resolveKey();
  if (!apiKey) return { ok: false, reason: "missing-key" };

  const response = await gatewayPost("/chat/completions", {
    model: args.model ?? process.env.OPENLLM_MODEL ?? DEFAULT_MODEL,
    messages: args.messages,
    ...(args.temperature !== undefined ? { temperature: args.temperature } : {}),
    ...(args.maxOutputTokens !== undefined ? { max_tokens: args.maxOutputTokens } : {}),
  });

  if (!response.ok) {
    return { ok: false, reason: response.reason, detail: response.detail };
  }

  const text = extractCompletionText(response.data);
  if (!text) return { ok: false, reason: "empty" };

  return { ok: true, data: response.data, text };
}

/** Chat completion through the OpenLLM gateway. */
export const chat = action({
  args: {
    messages: chatMessages,
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxOutputTokens: v.optional(v.number()),
  },
  handler: async (_ctx, args): Promise<OpenLlmResult> => {
    const result = await chatCompletion(args);
    if (!result.ok) {
      return { ok: false, reason: result.reason, detail: result.detail };
    }

    const model =
      (result.data as { model?: string } | null)?.model ??
      args.model ??
      DEFAULT_MODEL;
    return { ok: true, text: result.text, model };
  },
});

/** List models/aliases available to the account (debug + settings UI). */
export const listModels = action({
  args: {},
  handler: async (_ctx): Promise<OpenLlmResult> => {
    const apiKey = resolveKey();
    if (!apiKey) return { ok: false, reason: "missing-key" };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${resolveBaseUrl()}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      if (!res.ok) {
        return { ok: false, reason: "api-error", detail: `status ${res.status}` };
      }
      const data = (await res.json()) as { data?: Array<{ id?: string }> };
      const ids = (data.data ?? [])
        .map((m) => m.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      if (ids.length === 0) return { ok: false, reason: "empty" };
      return { ok: true, text: ids.join("\n"), model: String(ids.length) };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { ok: false, reason: "timeout" };
      }
      return { ok: false, reason: "network" };
    } finally {
      clearTimeout(timer);
    }
  },
});
