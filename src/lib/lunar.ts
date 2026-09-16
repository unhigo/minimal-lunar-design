/**
 * Lunar math, types and minimal monochrome palettes.
 * Pure helpers — no React here.
 */

export type Hemisphere = "N" | "S";
export type Lang = "ES" | "EN";
export type LayoutId = "default" | "radial" | "compact" | "poster";
export type MoonStyleId = "solid" | "line" | "neon" | "textured" | "mystic";

export interface LunarState {
  year: number;
  hemisphere: Hemisphere;
  lang: Lang;
  layout: LayoutId;
  moonSize: number;
  moonStyle: MoonStyleId;
  moonLit: string;
  moonDark: string;
  moonLitOpacity: number;
  moonDarkOpacity: number;
  bgColor: string;
  textColor: string;
  accentColor: string;
  showMonthNames: boolean;
  showMonthNumbers: boolean;
  showDayNumbers: boolean;
  showStars: boolean;
  glow: number;
  earthshine: number;
  radialRadius: number;
  rotations: number;
  fontFamily: string;
  fontWeight: string;
  textSize: number;
  monthNameSize: number;
  monthNumberSize: number;
  dayNumberSize: number;
  zoom: number;
  padding: number;
  exportResolution: keyof typeof RESOLUTIONS;
  filter: string;
  brightness: number;
  contrast: number;
  grid: boolean;
  bgImage: string | null;
}

export const RESOLUTIONS = {
  HD: 1280,
  "2K": 2048,
  "4K": 3840,
  "8K": 7680,
} as const;

export const MONTHS: Record<Lang, string[]> = {
  ES: [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ],
  EN: [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ],
};

export const PALETTES = [
  {
    name: "Noir",
    config: {
      bgColor: "#09090b",
      moonLit: "#fafafa",
      moonDark: "#1c1c1f",
      textColor: "#71717a",
      accentColor: "#a1a1aa",
    },
  },
  {
    name: "Paper",
    config: {
      bgColor: "#f4f4f2",
      moonLit: "#18181b",
      moonDark: "#ddddd9",
      textColor: "#6b6b70",
      accentColor: "#18181b",
    },
  },
  {
    name: "Ink",
    config: {
      bgColor: "#101014",
      moonLit: "#e4e4e7",
      moonDark: "#26262b",
      textColor: "#5b5b64",
      accentColor: "#d4d4d8",
    },
  },
  {
    name: "Graphite",
    config: {
      bgColor: "#141414",
      moonLit: "#d4d4d4",
      moonDark: "#232323",
      textColor: "#8a8a8a",
      accentColor: "#737373",
    },
  },
  {
    name: "Salt",
    config: {
      bgColor: "#fbfbfa",
      moonLit: "#0a0a0a",
      moonDark: "#e3e3e0",
      textColor: "#747472",
      accentColor: "#3f3f3f",
    },
  },
  {
    name: "Ember",
    config: {
      bgColor: "#0c0b0a",
      moonLit: "#f5f0e8",
      moonDark: "#22201d",
      textColor: "#8a857c",
      accentColor: "#c9bfae",
    },
  },
] as const satisfies ReadonlyArray<{
  name: string;
  config: Pick<
    LunarState,
    "bgColor" | "moonLit" | "moonDark" | "textColor" | "accentColor"
  >;
}>;

export const FILTERS = [
  { name: "None", value: "none" },
  { name: "B&W", value: "grayscale(100%)" },
  { name: "Sepia", value: "sepia(100%)" },
  { name: "Invert", value: "invert(100%)" },
  { name: "Saturate", value: "saturate(200%)" },
  { name: "Warm", value: "hue-rotate(30deg)" },
  { name: "Cool", value: "hue-rotate(-30deg)" },
] as const;

export const FONT_STACKS = [
  "Inter, sans-serif",
  "'Space Grotesk', sans-serif",
  "'JetBrains Mono', monospace",
  "Lora, serif",
] as const;

export const DEFAULT_LUNAR_STATE: LunarState = {
  year: new Date().getFullYear(),
  hemisphere: "N",
  lang: "ES",
  layout: "default",
  moonSize: 12,
  moonStyle: "solid",
  moonLit: "#fafafa",
  moonDark: "#1c1c1f",
  moonLitOpacity: 100,
  moonDarkOpacity: 100,
  bgColor: "#09090b",
  textColor: "#71717a",
  accentColor: "#a1a1aa",
  showMonthNames: true,
  showMonthNumbers: true,
  showDayNumbers: true,
  showStars: true,
  glow: 15,
  earthshine: 0,
  radialRadius: 220,
  rotations: 1,
  fontFamily: "Inter, sans-serif",
  fontWeight: "400",
  textSize: 12,
  monthNameSize: 12,
  monthNumberSize: 10,
  dayNumberSize: 10,
  zoom: 1,
  padding: 40,
  exportResolution: "HD",
  filter: "none",
  brightness: 100,
  contrast: 100,
  grid: false,
  bgImage: null,
};

/** Moon phase as a 0–1 fraction (0 = new moon, 0.5 = full moon). */
export function moonPhase(year: number, month: number, day: number): number {
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const target = Date.UTC(year, month - 1, day, 12, 0, 0);
  const diffDays = (target - knownNewMoon) / 86_400_000;
  const cycle = 29.53058867;
  let phase = (diffDays % cycle) / cycle;
  if (phase < 0) phase += 1;
  return phase;
}

/** SVG path of the lit portion of the moon disc for a given phase. */
export function moonPath(
  phase: number,
  r: number,
  hemisphere: Hemisphere,
): string {
  let p = phase;
  if (hemisphere === "S") p = 1 - p;
  const N = 64;
  const tx = Math.cos(2 * Math.PI * p);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    const a = (Math.PI * i) / N - Math.PI / 2;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  for (let i = N; i >= 0; i--) {
    const a = (Math.PI * i) / N - Math.PI / 2;
    pts.push([r * tx * Math.cos(a), r * Math.sin(a)]);
  }
  if (pts.length === 0) return "";
  return (
    pts
      .map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0].toFixed(4)},${pt[1].toFixed(4)}`)
      .join("") + "Z"
  );
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export interface MoonGeometry {
  rowH: number;
  r: number;
  labelW: number;
  dayW: number;
  H: number;
  layoutPadding: number;
  viewBox: string;
}

/** Compute all layout geometry for the calendar SVG. */
export function lunarGeometry(state: LunarState): MoonGeometry {
  const rBase = Number(state.moonSize);
  let rowH = 480 / 13;
  let moonSizeMultiplier = 1;
  let layoutPadding = Number(state.padding);

  if (state.layout === "compact") {
    rowH = 350 / 13;
    moonSizeMultiplier = 0.7;
    layoutPadding = Math.min(layoutPadding, 10);
  } else if (state.layout === "poster") {
    rowH = 600 / 13;
    moonSizeMultiplier = 1.4;
    layoutPadding = 50;
  } else if (state.layout === "radial") {
    layoutPadding = Math.max(layoutPadding, 100);
  }

  const r = rBase * moonSizeMultiplier;
  const labelW = state.showMonthNames ? 105 : 20;
  const dayW = (964 - labelW) / 31;
  const H = rowH * 13;

  const vbW = 964 + 2 * layoutPadding + 100;
  const vbH = H + 2 * layoutPadding + 100;
  let viewBox = `-${layoutPadding + 50} -${layoutPadding + 50} ${vbW} ${vbH}`;

  if (state.layout === "radial") {
    const radMax = state.radialRadius + r * 2 + 50;
    viewBox = `${482 - radMax} ${H / 2 - radMax} ${radMax * 2} ${radMax * 2}`;
  }

  return { rowH, r, labelW, dayW, H, layoutPadding, viewBox };
}

/**
 * Render-to-string version of the moon calendar. Used for PNG/JPG/WebP export
 * where a standalone SVG string must be rasterised without React/DOM refs.
 */
export function lunarSvgString(state: LunarState): string {
  const { rowH, r, labelW, dayW, H, layoutPadding, viewBox } =
    lunarGeometry(state);
  const months = MONTHS[state.lang];
  const today = new Date();
  const ty = today.getFullYear();
  const tm = today.getMonth() + 1;
  const td = today.getDate();

  const escape = (s: string) =>
    s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  const bgParts: string[] = [];
  if (state.layout !== "radial") {
    const vbW = 964 + 2 * layoutPadding + 100;
    const vbH = H + 2 * layoutPadding + 100;
    bgParts.push(
      `<rect x="${-(layoutPadding + 50)}" y="${-(layoutPadding + 50)}" width="${vbW}" height="${vbH}" fill="${state.bgColor}"/>`,
    );
    if (state.bgImage) {
      bgParts.push(
        `<image href="${escape(state.bgImage)}" x="${-(layoutPadding + 50)}" y="${-(layoutPadding + 50)}" width="${vbW}" height="${vbH}" preserveAspectRatio="xMidYMid slice" opacity="0.5"/>`,
      );
    }
  } else {
    const radMax = state.radialRadius + r * 2 + 50;
    bgParts.push(
      `<rect x="${482 - radMax}" y="${H / 2 - radMax}" width="${radMax * 2}" height="${radMax * 2}" fill="${state.bgColor}"/>`,
    );
  }

  let labels = "";
  if (state.showMonthNames && state.layout !== "radial") {
    months.forEach((m, i) => {
      labels += `<text x="20" y="${rowH * (i + 1)}" dy="0.32em" font-size="${state.monthNameSize}">${m}</text>`;
    });
  }
  if (state.showMonthNumbers && state.layout !== "radial") {
    months.forEach((_, i) => {
      labels += `<text x="5" y="${rowH * (i + 1)}" dy="0.32em" font-size="${state.monthNumberSize}">${i + 1}</text>`;
    });
  }
  if (state.layout === "radial" && state.showMonthNames) {
    months.forEach((m, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const rad = state.radialRadius + r * 2.5;
      const tx = 482 + rad * Math.cos(angle);
      const tyy = H / 2 + rad * Math.sin(angle);
      labels += `<text x="${tx.toFixed(2)}" y="${tyy.toFixed(2)}" text-anchor="middle" dy="0.32em" font-size="${state.monthNameSize}">${m}</text>`;
    });
  }

  let dayAxis = "";
  if (state.showDayNumbers && state.layout !== "radial") {
    for (let d = 1; d <= 31; d++) {
      dayAxis += `<text x="${(labelW + (d - 0.5) * dayW).toFixed(2)}" y="${(rowH * 0.5).toFixed(2)}" dy="0.32em">${d}</text>`;
    }
  }

  let moons = "";
  for (let m = 1; m <= 12; m++) {
    const dim = daysInMonth(state.year, m);
    for (let d = 1; d <= dim; d++) {
      const phase = moonPhase(state.year, m, d);
      const doy =
        (Date.UTC(state.year, m - 1, d) - Date.UTC(state.year, 0, 1)) /
        86_400_000;
      const angle = (doy / 365) * state.rotations * 2 * Math.PI - Math.PI / 2;
      const radius = state.layout === "radial" ? state.radialRadius : 0;
      const cx =
        state.layout === "radial"
          ? 482 + radius * Math.cos(angle)
          : labelW + (d - 0.5) * dayW;
      const cy =
        state.layout === "radial" ? H / 2 + radius * Math.sin(angle) : rowH * m;
      const isToday = state.year === ty && m === tm && d === td;
      const litFill =
        state.moonStyle === "line" ? "none" : state.moonLit;
      const litFillOpacity =
        state.moonStyle === "line"
          ? 1
          : state.moonStyle === "neon"
            ? 1
            : state.moonLitOpacity / 100;
      const litStroke =
        state.moonStyle === "line" || state.moonStyle === "neon"
          ? state.moonLit
          : "none";
      const dPath = moonPath(phase, r, state.hemisphere);

      let inner = `<circle r="${r}" fill="${state.moonDark}" fill-opacity="${state.moonDarkOpacity / 100}" stroke="${state.moonStyle === "line" ? state.moonLit : "none"}" stroke-width="${state.moonStyle === "line" ? 1 : 0}"/>`;
      if (isToday) {
        inner += `<circle r="${r + 2}" fill="none" stroke="${state.accentColor}" stroke-width="1.5"/>`;
      }
      inner += `<path fill="${litFill}" fill-opacity="${litFillOpacity}" stroke="${litStroke}" stroke-width="1" d="${dPath}"/>`;
      if (state.moonStyle === "textured") {
        for (let idx = 0; idx < 3; idx++) {
          inner += `<circle r="${(r / (4 + idx)).toFixed(2)}" cx="${(Math.sin(d * idx) * r * 0.5).toFixed(1)}" cy="${(Math.cos(d * idx) * r * 0.3).toFixed(1)}" fill="${state.moonDark}" opacity="0.3"/>`;
        }
      }
      if (state.moonStyle === "mystic") {
        inner += `<circle r="${r + 1.5}" fill="none" stroke="${state.moonLit}" stroke-width="0.5" stroke-dasharray="1,1"/>`;
      }
      inner += `<circle r="${r}" fill="none" stroke-width="0.4" stroke="${state.textColor}" stroke-opacity="0.2"/>`;
      if (state.earthshine > 0) {
        inner += `<path fill="${state.moonLit}" fill-opacity="${state.earthshine / 100}" d="${dPath}"/>`;
      }
      moons += `<g transform="translate(${cx.toFixed(2)},${cy.toFixed(2)})">${inner}</g>`;
    }
  }

  let gridRect = "";
  if (state.grid && state.layout !== "radial") {
    gridRect = `<rect x="${-layoutPadding}" y="${-layoutPadding}" width="${964 + 2 * layoutPadding}" height="${H + 2 * layoutPadding}" fill="url(#grid-pat)"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" font-family="${escape(state.fontFamily)}" font-weight="${state.fontWeight}" preserveAspectRatio="xMidYMid meet"><defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${state.glow / 10}" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter><filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${state.glow / 5}" result="blur1"/><feGaussianBlur stdDeviation="${state.glow / 20}" result="blur2"/><feMerge><feMergeNode in="blur1"/><feMergeNode in="blur2"/><feMergeNode in="SourceGraphic"/></feMerge></filter><pattern id="grid-pat" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="${state.textColor}" stroke-width="0.5" stroke-opacity="0.15"/></pattern></defs>${bgParts.join("")}<g fill="${state.textColor}" text-transform="uppercase">${labels}</g><g text-anchor="middle" fill="${state.textColor}" font-size="${state.dayNumberSize}" opacity="0.7">${dayAxis}</g><g text-anchor="middle">${moons}</g>${gridRect}</svg>`;
}
