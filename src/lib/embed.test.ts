import { describe, expect, it } from "vitest";
import {
  buildAmpEmbed,
  buildEmbedCode,
  buildHtmlEmbed,
  buildReactEmbed,
  buildWebComponentEmbed,
  clampDimension,
  EMBED_BORDER_COLOR,
  EMBED_DIM_MAX,
  EMBED_DIM_MIN,
  escapeAttr,
  escapeBraces,
  normalizeEmbedUrl,
  type EmbedOptions,
} from "./embed";

const base: EmbedOptions = {
  url: "https://example.com/embedded",
  title: "Demo embed",
  width: 800,
  height: 450,
  responsive: true,
  lazy: true,
  scrolling: true,
  border: true,
  format: "html",
};

describe("normalizeEmbedUrl", () => {
  it("accepts absolute https URLs", () => {
    expect(normalizeEmbedUrl("https://example.com/a?b=1")).toBe(
      "https://example.com/a?b=1",
    );
  });

  it("adds https:// when the scheme is missing", () => {
    expect(normalizeEmbedUrl("  example.com/video ")).toBe("https://example.com/video");
  });

  it("keeps http URLs as-is", () => {
    expect(normalizeEmbedUrl("http://example.com")).toBe("http://example.com/");
  });

  it("rejects javascript:, data: and vbscript: schemes", () => {
    expect(normalizeEmbedUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeEmbedUrl("data:text/html,<script>")).toBeNull();
    expect(normalizeEmbedUrl("vbscript:x")).toBeNull();
  });

  it("rejects empty input, hostless values and oversized strings", () => {
    expect(normalizeEmbedUrl("")).toBeNull();
    expect(normalizeEmbedUrl("https://  ")).toBeNull();
    expect(normalizeEmbedUrl("https://a")).toBeNull();
    expect(normalizeEmbedUrl(`https://a.com/${"x".repeat(2100)}`)).toBeNull();
  });
});

describe("clampDimension and escaping", () => {
  it("clamps dimensions to the safe range and rounds", () => {
    expect(clampDimension(0)).toBe(EMBED_DIM_MIN);
    expect(clampDimension(99.4)).toBe(EMBED_DIM_MIN);
    expect(clampDimension(9999)).toBe(EMBED_DIM_MAX);
    expect(clampDimension(560.6)).toBe(561);
    expect(clampDimension(Number.NaN)).toBe(560);
  });

  it("escapes attribute-dangerous characters and angle brackets", () => {
    expect(escapeAttr('a"b<c&d>e')).toBe("a&quot;b&lt;c&amp;d&gt;e");
    expect(escapeBraces("<script>")).toBe("&lt;script&gt;");
  });
});

describe("buildHtmlEmbed", () => {
  it("uses a 16:9 responsive wrapper with padding-top 56.25%", () => {
    const code = buildHtmlEmbed(base);
    expect(code).toContain("padding-top:56.25%");
    expect(code).toContain('src="https://example.com/embedded"');
    expect(code).toContain('title="Demo embed"');
    expect(code).toContain('loading="lazy"');
  });

  it("emits fixed dimensions when responsive is off and omits lazy loading", () => {
    const code = buildHtmlEmbed({
      ...base,
      responsive: false,
      lazy: false,
      border: false,
    });
    expect(code).toContain('width="800"');
    expect(code).toContain('height="450"');
    expect(code).not.toContain("loading=");
    expect(code).not.toContain(EMBED_BORDER_COLOR);
  });

  it("escapes quotes in URLs and titles", () => {
    const code = buildHtmlEmbed({ ...base, title: 'He said "hi"' });
    expect(code).toContain("He said &quot;hi&quot;");
  });
});

describe("buildReactEmbed", () => {
  it("renders a Next.js component with numeric maxWidth in responsive mode", () => {
    const code = buildReactEmbed(base);
    expect(code).toContain("export function Embed()");
    expect(code).toContain("maxWidth: 800,");
    expect(code).toContain('loading="lazy"');
  });

  it("renders width/height props in fixed mode", () => {
    const code = buildReactEmbed({ ...base, responsive: false });
    expect(code).toContain("width={800}");
    expect(code).toContain("height={450}");
  });
});

describe("buildAmpEmbed", () => {
  it("switches layout between responsive and fixed", () => {
    expect(buildAmpEmbed(base)).toContain('layout="responsive"');
    expect(buildAmpEmbed({ ...base, responsive: false })).toContain(
      'layout="fixed"',
    );
  });

  it("always lazy-loads (AMP best practice) and notes scrolling", () => {
    const code = buildAmpEmbed(base);
    expect(code).toContain("loading=\"lazy\"");
    expect(code).toContain("scroll");
  });
});

describe("buildWebComponentEmbed", () => {
  it("defines <nyxhora-embed> and instantiates it with attributes", () => {
    const code = buildWebComponentEmbed(base);
    expect(code).toContain('customElements.define("nyxhora-embed"');
    expect(code).toContain("<nyxhora-embed");
    expect(code).toContain('src="https://example.com/embedded"');
    expect(code).toContain("responsive");
  });

  it("omits the responsive attribute in fixed mode", () => {
    const code = buildWebComponentEmbed({ ...base, responsive: false });
    expect(code).not.toMatch(/^\s*responsive$/m);
    expect(code).toContain('width="800"');
  });
});

describe("buildEmbedCode dispatch", () => {
  it("routes each format to its generator", () => {
    expect(buildEmbedCode({ ...base, format: "html" })).toBe(buildHtmlEmbed(base));
    expect(buildEmbedCode({ ...base, format: "react" })).toBe(buildReactEmbed(base));
    expect(buildEmbedCode({ ...base, format: "amp" })).toBe(buildAmpEmbed(base));
    expect(buildEmbedCode({ ...base, format: "webcomponent" })).toBe(
      buildWebComponentEmbed(base),
    );
  });

  it("falls back to a safe title when the input is blank", () => {
    const code = buildEmbedCode({ ...base, title: "   " });
    expect(code).toContain("Contenido incrustado");
  });
});
