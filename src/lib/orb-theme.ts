/**
 * Theme bridge for the LiquidOrb shader.
 *
 * The orb must feel native to MOONØ.LAB: it reads the app's CSS custom
 * properties (light/dark aware, via getComputedStyle on the document root)
 * and converts them into the linear RGB triplet the fragment shader expects.
 */

export interface OrbPalette {
  /** Base fluid color (≈ --foreground). */
  ink: [number, number, number];
  /** Accent fluid color (≈ --ring / brand red). */
  ember: [number, number, number];
  /** Background field color (≈ --background). */
  void_: [number, number, number];
  /** True when the document root has the `.dark` class. */
  dark: boolean;
}

function cssVar(name: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * oklch(...) is the token format used by the theme; WebGL needs sRGB 0..1.
 * Parse `oklch(L C H)` → RGB via OKLab → linear → sRGB. `light-dark()` or
 * plain hex fallbacks are handled too, so the orb survives token refactors.
 */
export function parseCssColor(input: string): [number, number, number] | null {
  const value = input.trim();
  if (!value) return null;

  // oklch(L C H) — L may be a percentage.
  const oklch = value.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.-]+)(?:deg)?\s*\)/i);
  if (oklch) {
    let l = parseFloat(oklch[1]);
    if (oklch[1].endsWith("%")) l /= 100;
    const c = parseFloat(oklch[2]);
    const h = (parseFloat(oklch[3]) * Math.PI) / 180;
    // OKLab polar form: a and b are chroma projected on the hue axes.
    const a = Math.cos(h) * c;
    const b = Math.sin(h) * c;
    return oklabToSrgb(l, a, b);
  }

  // Fallbacks: #rgb, #rrggbb, rgb(), rgba() — hsl() is rare in tokens.
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((ch) => ch + ch)
            .join("")
        : hex.slice(0, 6);
    if (full.length !== 6) return null;
    return [
      parseInt(full.slice(0, 2), 16) / 255,
      parseInt(full.slice(2, 4), 16) / 255,
      parseInt(full.slice(4, 6), 16) / 255,
    ];
  }

  const rgb = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgb) {
    return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  }

  return null;
}

function oklabToSrgb(
  L: number,
  a: number,
  b: number,
): [number, number, number] | null {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [srgbGamma(lr), srgbGamma(lg), srgbGamma(lb)];
}

function srgbGamma(x: number): number {
  const v = Math.min(Math.max(x, 0), 1);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

/** Read the active MOONØ.LAB palette for the shader. */
export function readOrbPalette(): OrbPalette {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const foreground = parseCssColor(cssVar("--foreground")) ?? [0.96, 0.96, 0.96];
  const background = parseCssColor(cssVar("--background")) ?? [0.13, 0.13, 0.13];
  // Brand ember: --ring (red in dark) → destructive → hardcoded MOONØ red.
  const ember =
    parseCssColor(cssVar("--ring")) ??
    parseCssColor(cssVar("--destructive")) ??
    [1, 0, 0.2];

  return {
    ink: foreground,
    ember,
    void_: background,
    dark,
  };
}
