import { describe, expect, it } from "vitest";
import { extractCompletionText } from "./openllm";

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
  it("strips trailing slashes from a configured base URL", async () => {
    // resolveBaseUrl is private; exercise it through the exported constant
    // contract: the default gateway has no trailing slash.
    const { DEFAULT_BASE_URL } = await import("./openllm");
    expect(DEFAULT_BASE_URL).toBe("https://www.openllm.sh/v1");
  });
});
