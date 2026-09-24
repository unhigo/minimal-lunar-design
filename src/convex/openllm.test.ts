import { describe, expect, it, vi, afterEach } from "vitest";
import {
  extractCompletionText,
  DEFAULT_BASE_URL,
  CLAUDE_MODEL_SUGGESTIONS,
  chatCompletion,
} from "./openllm";

describe("extractCompletionText", () => {
  it("returns the assistant message trimmed", () => {
    const data = {
      choices: [{ message: { role: "assistant", content: "  Hola lunar.  " } }],
    };
    expect(extractCompletionText(data)).toBe("Hola lunar.");
  });

  it("returns null on missing choices/message/content", () => {
    expect(extractCompletionText({})).toBeNull();
    expect(extractCompletionText({ choices: [] })).toBeNull();
    expect(extractCompletionText({ choices: [{ message: {} }] })).toBeNull();
  });

  it("returns null for empty-string content", () => {
    expect(extractCompletionText({ choices: [{ message: { content: "   " } }] })).toBeNull();
  });

  it("joins array-of-parts content (some gateways return typed parts)", () => {
    const data = {
      choices: [
        {
          message: {
            content: [
              { type: "text", text: "Primera " },
              { type: "text", text: "parte" },
            ],
          },
        },
      ],
    };
    expect(extractCompletionText(data)).toBe("Primera parte");
  });

  it("ignores non-string junk parts inside array content", () => {
    const data = {
      choices: [{ message: { content: [{}, null, { text: 42 }] } }],
    };
    expect(extractCompletionText(data)).toBe("42");
  });
});

describe("URL normalization", () => {
  it("exposes the hosted gateway as default base URL", () => {
    // resolveBaseUrl strips trailing slashes from OPENLLM_BASE_URL; the
    // default must be the clean hosted-gateway root.
    expect(DEFAULT_BASE_URL).toBe("https://www.openllm.sh/v1");
  });
});

describe("Claude routing through the gateway", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENLLM_API_KEY;
    delete process.env.OPENLLM_MODEL;
  });

  function stubGateway(payload: unknown) {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("pins a concrete Claude model and posts to the OpenAI-compatible endpoint", async () => {
    process.env.OPENLLM_API_KEY = "sk-llm-test";
    const fetchMock = stubGateway({
      choices: [{ message: { role: "assistant", content: "Hola desde Claude." } }],
      model: "anthropic/claude-sonnet-4-5",
    });

    const result = await chatCompletion({
      messages: [{ role: "user", content: "Hola" }],
      model: CLAUDE_MODEL_SUGGESTIONS[0],
      temperature: 0.5,
      maxOutputTokens: 100,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toBe("Hola desde Claude.");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${DEFAULT_BASE_URL}/chat/completions`);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-llm-test");

    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("anthropic/claude-sonnet-4-5");
    expect(body.temperature).toBe(0.5);
    expect(body.max_tokens).toBe(100);
    expect(body.messages).toEqual([{ role: "user", content: "Hola" }]);
  });

  it("returns missing-key without calling the gateway when no key is set", async () => {
    const fetchMock = stubGateway({});
    const result = await chatCompletion({
      messages: [{ role: "user", content: "x" }],
    });
    expect(result).toMatchObject({ ok: false, reason: "missing-key" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps HTTP failures to api-error with truncated detail", async () => {
    process.env.OPENLLM_API_KEY = "sk-llm-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: "model not available for this account" }),
            { status: 404 },
          ),
      ),
    );

    const result = await chatCompletion({
      messages: [{ role: "user", content: "x" }],
      model: "anthropic/claude-opus-4-1",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("api-error");
    expect(result.detail).toContain("model not available");
  });

  it("falls back to OPENLLM_MODEL when no model arg is given", async () => {
    process.env.OPENLLM_API_KEY = "sk-llm-test";
    process.env.OPENLLM_MODEL = "anthropic/claude-haiku-4-5";
    const fetchMock = stubGateway({
      choices: [{ message: { content: "ok" } }],
    });

    await chatCompletion({ messages: [{ role: "user", content: "x" }] });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body)).model).toBe("anthropic/claude-haiku-4-5");
  });
});
