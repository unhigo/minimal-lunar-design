import { useMemo } from "react";
import {
  MONTHS,
  daysInMonth,
  lunarGeometry,
  moonPath,
  moonPhase,
  type LunarState,
} from "@/lib/lunar";

/**
 * Full moon-calendar SVG, matching the standalone export string exactly so
 * what you see is what you download.
 */
export function MoonCalendarSvg({
  state,
  svgRef,
}: {
  state: LunarState;
  svgRef?: React.Ref<SVGSVGElement>;
}) {
  const g = useMemo(() => lunarGeometry(state), [state]);
  const months = MONTHS[state.lang];
  const today = useMemo(() => new Date(), []);
  const ty = today.getFullYear();
  const tm = today.getMonth() + 1;
  const td = today.getDate();

  const radMax =
    state.layout === "radial" ? state.radialRadius + g.r * 2 + 50 : 0;

  return (
    <svg
      ref={svgRef}
      viewBox={g.viewBox}
      style={{
        width: "100%",
        height: "100%",
        fontFamily: state.fontFamily,
        filter:
          state.filter !== "none" ||
          state.brightness !== 100 ||
          state.contrast !== 100
            ? `${state.filter !== "none" ? `${state.filter} ` : ""}brightness(${state.brightness}%) contrast(${state.contrast}%)`
            : undefined,
        transform: `scale(${state.zoom})`,
        transformOrigin: "center center",
      }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={state.glow / 10} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={state.glow / 5} result="blur1" />
          <feGaussianBlur stdDeviation={state.glow / 20} result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern
          id="grid-pat"
          x="0"
          y="0"
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 50 0 L 0 0 0 50"
            fill="none"
            stroke={state.textColor}
            strokeWidth="0.5"
            strokeOpacity="0.15"
          />
        </pattern>
      </defs>

      {state.layout !== "radial" ? (
        <>
          <rect
            x={-(g.layoutPadding + 50)}
            y={-(g.layoutPadding + 50)}
            width={964 + 2 * g.layoutPadding + 100}
            height={g.H + 2 * g.layoutPadding + 100}
            fill={state.bgColor}
          />
          {state.bgImage && (
            <image
              href={state.bgImage}
              x={-(g.layoutPadding + 50)}
              y={-(g.layoutPadding + 50)}
              width={964 + 2 * g.layoutPadding + 100}
              height={g.H + 2 * g.layoutPadding + 100}
              preserveAspectRatio="xMidYMid slice"
              opacity={0.5}
            />
          )}
        </>
        ) : (
          <rect
            x={482 - radMax}
            y={g.H / 2 - radMax}
            width={radMax * 2}
            height={radMax * 2}
            fill={state.bgColor}
          />
        )}

      <g
        style={{
          fontSize: state.textSize,
          textTransform: "uppercase",
          fill: state.textColor,
          fontWeight: state.fontWeight,
        }}
      >
        {state.showMonthNames &&
          state.layout !== "radial" &&
          months.map((m, i) => (
            <text
              key={m}
              x="20"
              y={g.rowH * (i + 1)}
              dy="0.32em"
              fontSize={`${state.monthNameSize}px`}
            >
              {m}
            </text>
          ))}
        {state.showMonthNumbers &&
          state.layout !== "radial" &&
          months.map((_, i) => (
            <text
              key={i}
              x="5"
              y={g.rowH * (i + 1)}
              dy="0.32em"
              fontSize={`${state.monthNumberSize}px`}
            >
              {i + 1}
            </text>
          ))}
        {state.layout === "radial" &&
          state.showMonthNames &&
          months.map((m, i) => {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const rad = state.radialRadius + g.r * 2.5;
            const tx = 482 + rad * Math.cos(angle);
            const tyy = g.H / 2 + rad * Math.sin(angle);
            return (
              <text
                key={m}
                x={tx}
                y={tyy}
                textAnchor="middle"
                dy="0.32em"
                fontSize={`${state.monthNameSize}px`}
              >
                {m}
              </text>
            );
          })}
      </g>

      <g
        textAnchor="middle"
        style={{
          fontSize: `${state.dayNumberSize}px`,
          fill: state.textColor,
          opacity: 0.7,
          fontWeight: state.fontWeight,
        }}
      >
        {state.showDayNumbers &&
          state.layout !== "radial" &&
          Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <text
              key={d}
              x={g.labelW + (d - 0.5) * g.dayW}
              y={g.rowH * 0.5}
              dy="0.32em"
            >
              {d}
            </text>
          ))}
      </g>

      <g textAnchor="middle">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const dim = daysInMonth(state.year, m);
          return Array.from({ length: dim }, (_, i) => i + 1).map((d) => {
            const phase = moonPhase(state.year, m, d);
            const doy =
              (Date.UTC(state.year, m - 1, d) - Date.UTC(state.year, 0, 1)) /
              86_400_000;
            const angle =
              (doy / 365) * state.rotations * 2 * Math.PI - Math.PI / 2;
            const radius = state.layout === "radial" ? state.radialRadius : 0;
            const cx =
              state.layout === "radial"
                ? 482 + radius * Math.cos(angle)
                : g.labelW + (d - 0.5) * g.dayW;
            const cy =
              state.layout === "radial"
                ? g.H / 2 + radius * Math.sin(angle)
                : g.rowH * m;
            const isToday = state.year === ty && m === tm && d === td;
            const glowFilter =
              state.glow > 0
                ? state.moonStyle === "neon"
                  ? "url(#neon-glow)"
                  : "url(#glow)"
                : undefined;

            return (
              <g
                key={`${m}-${d}`}
                transform={`translate(${cx.toFixed(2)},${cy.toFixed(2)})`}
              >
                <circle
                  r={g.r}
                  fill={state.moonDark}
                  fillOpacity={state.moonDarkOpacity / 100}
                  stroke={state.moonStyle === "line" ? state.moonLit : "none"}
                  strokeWidth={state.moonStyle === "line" ? 1 : 0}
                  filter={glowFilter}
                />
                {isToday && (
                  <circle
                    r={g.r + 2}
                    fill="none"
                    stroke={state.accentColor}
                    strokeWidth="1.5"
                  />
                )}
                <path
                  fill={
                    ["solid", "textured", "mystic", "neon"].includes(
                      state.moonStyle,
                    )
                      ? state.moonLit
                      : "none"
                  }
                  stroke={
                    ["line", "neon"].includes(state.moonStyle)
                      ? state.moonLit
                      : "none"
                  }
                  strokeWidth={1}
                  fillOpacity={
                    ["solid", "textured", "mystic"].includes(state.moonStyle)
                      ? state.moonLitOpacity / 100
                      : 1
                  }
                  d={moonPath(phase, g.r, state.hemisphere)}
                  filter={
                    state.moonStyle === "neon" && state.glow > 0
                      ? "url(#neon-glow)"
                      : undefined
                  }
                />
                {state.moonStyle === "textured" &&
                  Array.from({ length: 3 }).map((_, idx) => (
                    <circle
                      key={idx}
                      r={g.r / (4 + idx)}
                      cx={(Math.sin(d * idx) * g.r * 0.5).toFixed(1)}
                      cy={(Math.cos(d * idx) * g.r * 0.3).toFixed(1)}
                      fill={state.moonDark}
                      opacity="0.3"
                    />
                  ))}
                {state.moonStyle === "mystic" && (
                  <circle
                    r={g.r + 1.5}
                    fill="none"
                    stroke={state.moonLit}
                    strokeWidth="0.5"
                    strokeDasharray="1,1"
                  />
                )}
                <circle
                  r={g.r}
                  fill="none"
                  strokeWidth="0.4"
                  stroke={state.textColor}
                  strokeOpacity="0.2"
                />
                {state.earthshine > 0 && (
                  <path
                    fill={state.moonLit}
                    fillOpacity={state.earthshine / 100}
                    d={moonPath(phase, g.r, state.hemisphere)}
                  />
                )}
              </g>
            );
          });
        })}
      </g>

      {state.grid && state.layout !== "radial" && (
        <rect
          x={-g.layoutPadding}
          y={-g.layoutPadding}
          width={964 + 2 * g.layoutPadding}
          height={g.H + 2 * g.layoutPadding}
          fill="url(#grid-pat)"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
