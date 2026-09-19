/**
 * Nyxhora Embed Code Generator — pure logic (no React, no DOM).
 *
 * Everything here is deterministic and unit-testable: URL normalization,
 * option clamping/escaping and the four code generators (HTML, React/Next.js,
 * AMP, Web Component). The page (EmbedGenerator.tsx) only wires state.
 */

export const EMBED_FORMATS = ["html", "react", "amp", "webcomponent"] as const;
export type EmbedFormat = (typeof EMBED_FORMATS)[number];

export const EMBED_FORMAT_LABELS: Record<EmbedFormat, string> = {
  html: "HTML estándar",
  react: "React / Next.js",
  amp: "AMP",
  webcomponent: "Web Component",
};

export interface EmbedOptions {
  /** Origin URL to embed (normalized with `normalizeEmbedUrl`). */
  url: string;
  /** Accessibility title announced by screen readers. */
  title: string;
  /** Intrinsic width in px (max-width of the responsive wrapper). */
  width: number;
  /** Intrinsic height in px (fixed-size preset). */
  height: number;
  /** 16:9 responsive wrapper instead of fixed dimensions. */
  responsive: boolean;
  /** Defer loading until the frame approaches the viewport. */
  lazy: boolean;
  /** Allow inner scrolling of the embedded document. */
  scrolling: boolean;
  /** Draw a hairline border around the frame. */
  border: boolean;
  format: EmbedFormat;
}

export const EMBED_URL_MAX = 2048;
export const EMBED_TITLE_MAX = 120;
export const EMBED_DIM_MIN = 100;
export const EMBED_DIM_MAX = 4000;
/** Hairline color used inside the generated snippets (zinc-700). */
export const EMBED_BORDER_COLOR = "#3f3f46";

const URL_RE = /^(https?:\/\/)([^\s/$.?#].[^\s]*)$/i;
const DANGEROUS_SCHEME_RE = /^\s*(javascript|data|vbscript):/i;

/**
 * Extract a usable http(s) URL from raw user input: tolerates missing scheme
 * and surrounding whitespace, rejects dangerous schemes and hostless values.
 * Returns null when the input cannot be trusted as an embed origin.
 */
export function normalizeEmbedUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value || value.length > EMBED_URL_MAX || DANGEROUS_SCHEME_RE.test(value)) {
    return null;
  }
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  if (!URL_RE.test(candidate)) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Clamp + round a numeric dimension to the generator's safe range. */
export function clampDimension(value: number): number {
  if (!Number.isFinite(value)) return 560;
  return Math.min(EMBED_DIM_MAX, Math.max(EMBED_DIM_MIN, Math.round(value)));
}

/** Escape a value for safe use inside a double-quoted HTML attribute. */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escape angle brackets for JSX attribute literals (no entities needed). */
export function escapeBraces(value: string): string {
  return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ALLOW_ATTR =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

function resolved(o: EmbedOptions): { title: string; width: number; height: number } {
  return {
    title: o.title.trim() || "Contenido incrustado",
    width: clampDimension(o.width),
    height: clampDimension(o.height),
  };
}

function borderCss(on: boolean): string {
  return on ? `1px solid ${EMBED_BORDER_COLOR}` : "0";
}

/** Standard HTML: responsive 16:9 wrapper or fixed-size frame. */
export function buildHtmlEmbed(o: EmbedOptions): string {
  const { title, width, height } = resolved(o);
  const loading = o.lazy ? '\n    loading="lazy"' : "";
  const scrolling = ` scrolling="${o.scrolling ? "yes" : "no"}"`;

  if (o.responsive) {
    return [
      `<!-- Incrustación responsiva (16:9) -->`,
      `<div style="position:relative;width:100%;max-width:${width}px;padding-top:56.25%;border:${borderCss(o.border)};box-sizing:border-box;">`,
      `  <iframe`,
      `    src="${escapeAttr(o.url)}"`,
      `    title="${escapeAttr(title)}"`,
      `    style="position:absolute;inset:0;width:100%;height:100%;border:0;"`,
      `    allow="${ALLOW_ATTR}"`,
      `    allowfullscreen scrolling="${o.scrolling ? "yes" : "no"}"${loading}`,
      `  ></iframe>`,
      `</div>`,
    ].join("\n");
  }

  return [
    `<!-- Incrustación de tamaño fijo -->`,
    `<iframe`,
    `  src="${escapeAttr(o.url)}"`,
    `  title="${escapeAttr(title)}"`,
    `  width="${width}"`,
    `  height="${height}"`,
    `  style="max-width:100%;border:${borderCss(o.border)};"`,
    `  allow="${ALLOW_ATTR}"`,
    `  allowfullscreen${scrolling}${loading}`,
    `></iframe>`,
  ].join("\n");
}

/** React / Next.js component with inline styles (no external CSS needed). */
export function buildReactEmbed(o: EmbedOptions): string {
  const { title, width, height } = resolved(o);
  const t = escapeBraces(escapeAttr(title));
  const src = escapeBraces(escapeAttr(o.url));

  if (o.responsive) {
    return [
      `// Componente de incrustación responsiva (Next.js / React)`,
      `export function Embed() {`,
      `  return (`,
      `    <div`,
      `      style={{`,
      `        position: "relative",`,
      `        width: "100%",`,
      `        maxWidth: ${width},`,
      `        paddingTop: "56.25%",`,
      `        border: "${borderCss(o.border)}",`,
      `        boxSizing: "border-box",`,
      `      }}`,
      `    >`,
      `      <iframe`,
      `        src="${src}"`,
      `        title="${t}"`,
      `        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}`,
      `        allow="${ALLOW_ATTR}"`,
      `        allowFullScreen`,
      `        loading="${o.lazy ? "lazy" : "eager"}"`,
      `        scrolling="${o.scrolling ? "yes" : "no"}"`,
      `      />`,
      `    </div>`,
      `  );`,
      `}`,
    ].join("\n");
  }

  return [
    `// Componente de incrustación (Next.js / React)`,
    `export function Embed() {`,
    `  return (`,
    `    <iframe`,
    `      src="${src}"`,
    `      title="${t}"`,
    `      width={${width}}`,
    `      height={${height}}`,
    `      style={{ maxWidth: "100%", border: "${borderCss(o.border)}" }}`,
    `      allow="${ALLOW_ATTR}"`,
    `      allowFullScreen`,
    `      loading="${o.lazy ? "lazy" : "eager"}"`,
    `      scrolling="${o.scrolling ? "yes" : "no"}"`,
    `    />`,
    `  );`,
    `}`,
  ].join("\n");
}

/**
 * AMP (amp-iframe). AMP controls sizing through layout, so scrolling is left
 * to the embedded origin (noted in the snippet).
 */
export function buildAmpEmbed(o: EmbedOptions): string {
  const { title, width, height } = resolved(o);
  const t = escapeAttr(title);
  return [
    `<!-- Requiere el runtime AMP: <script async src="https://cdn.ampproject.org/v0.js"></script> -->`,
    `<!-- El scroll interno lo decide el origen incrustado; AMP no expone scrolling. -->`,
    `<amp-iframe`,
    `  src="${escapeAttr(o.url)}"`,
    `  title="${t}"`,
    `  width="${width}"`,
    `  height="${height}"`,
    `  layout="${o.responsive ? "responsive" : "fixed"}"`,
    `  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"`,
    `  frameborder="${o.border ? "1" : "0"}"`,
    `  allowfullscreen`,
    `  ${o.lazy ? 'data-amp-auto-lightbox-off="" loading="lazy"' : 'loading="lazy"'}>`,
    `</amp-iframe>`,
  ].join("\n");
}

/**
 * Web Component autónomo: define <nyxhora-embed> y lo instancia en el mismo
 * snippet, sin dependencias externas.
 */
export function buildWebComponentEmbed(o: EmbedOptions): string {
  const { title, width, height } = resolved(o);
  const t = escapeAttr(title);
  const flags = [
    o.responsive ? "responsive" : "",
    o.lazy ? 'loading="lazy"' : "",
    o.scrolling ? "" : 'scrolling="no"',
    o.border ? 'border="hairline"' : "",
  ]
    .filter(Boolean)
    .map((f) => `  ${f}`)
    .join("\n");

  return [
    `<!-- Web Component autónomo: define y usa <nyxhora-embed> -->`,
    `<script>`,
    `  customElements.define("nyxhora-embed", class extends HTMLElement {`,
    `    connectedCallback() {`,
    `      if (this.shadowRoot) return;`,
    `      var src = this.getAttribute("src") || "";`,
    `      var title = this.getAttribute("title") || "Contenido incrustado";`,
    `      var width = this.getAttribute("width") || "${width}";`,
    `      var height = this.getAttribute("height") || "${height}";`,
    `      var responsive = this.hasAttribute("responsive");`,
    `      var lazy = this.getAttribute("loading") === "lazy";`,
    `      var scrolling = this.getAttribute("scrolling") !== "no";`,
    `      var border = this.getAttribute("border") === "hairline";`,
    `      var frame =`,
    `        '<iframe src="' + src + '" title="' + title + '" allowfullscreen' +`,
    `        (lazy ? ' loading="lazy"' : '') +`,
    `        (scrolling ? '' : ' scrolling="no"') +`,
    `        ' style="position:absolute;inset:0;width:100%;height:100%;border:' +`,
    `        (border ? '1px solid ${EMBED_BORDER_COLOR}' : '0') + '">' +`,
    `        '</iframe>';`,
    `      this.attachShadow({ mode: "open" }).innerHTML = responsive`,
    `        ? '<div style="position:relative;width:100%;padding-top:56.25%">' + frame + '</div>'`,
    `        : '<div style="position:relative;width:' + width + 'px;height:' + height + 'px">' + frame + '</div>';`,
    `    }`,
    `  });`,
    `</script>`,
    `<nyxhora-embed`,
    `  src="${escapeAttr(o.url)}"`,
    `  title="${t}"`,
    `  width="${width}"`,
    `  height="${height}"`,
    flags,
    `></nyxhora-embed>`,
  ].join("\n");
}

/** Dispatch to the generator for the selected format. */
export function buildEmbedCode(o: EmbedOptions): string {
  switch (o.format) {
    case "react":
      return buildReactEmbed(o);
    case "amp":
      return buildAmpEmbed(o);
    case "webcomponent":
      return buildWebComponentEmbed(o);
    default:
      return buildHtmlEmbed(o);
  }
}
