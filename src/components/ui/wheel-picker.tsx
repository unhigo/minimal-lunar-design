/**
 * WheelPicker — iOS-style drum picker, MOONØ.LAB edition (§21).
 *
 * A 3D cylinder of monospace notches on native CSS scroll-snap: touch uses
 * real momentum scroll, wheel and keyboard adjust value by value, and the
 * selection window is framed by hairlines with a red signal dot. Fully
 * reduced-motion safe (no JS animation; the browser handles snapping) and
 * keyboard accessible (listbox pattern with vertical arrows + Home/End).
 *
 * Compose multiple <WheelPicker> side by side for date/time pickers:
 *
 *   <WheelPicker values={DAYS} value={day} onChange={setDay} ariaLabel="Día" />
 *
 * Implementation notes:
 * · The drum's 3D tilt is pure CSS (`rotateX` per notch, settled state) —
 *   no per-frame JS during the drag; the browser drives the motion.
 * · Wheel input is a native non-passive listener (React's onWheel is passive
 *   and could not preventDefault), mapped to one notch per gesture burst.
 * · The centered notch commits on scroll-idle (140ms) or `scrollend` where
 *   supported, so touch momentum lands on the nearest value.
 */
import { cn } from "@/lib/utils";
import * as React from "react";

const ITEM_H = 36; // px per notch — the drum's pitch
const VISIBLE = 5; // notches shown in the window (odd number)
const CYLINDER_R = 4; // 3D drum radius in notches — larger reads flatter
const COMMIT_IDLE_MS = 140; // scroll-idle window before committing a notch

export interface WheelPickerProps<T extends string | number> {
  /** All selectable values, in drum order. */
  values: readonly T[];
  /** Current value — must exist in `values`. */
  value: T;
  onChange: (value: T) => void;
  /** Accessible name (listbox label). */
  ariaLabel: string;
  /** Formats a value for display (defaults to String). */
  format?: (value: T) => string;
  /** Fixed drum width (Tailwind class). Defaults to auto. */
  className?: string;
  disabled?: boolean;
}

export function WheelPicker<T extends string | number>({
  values,
  value,
  onChange,
  ariaLabel,
  format,
  className,
  disabled = false,
}: WheelPickerProps<T>) {
  const listRef = React.useRef<HTMLUListElement>(null);
  const programmaticUntil = React.useRef(0);
  const idleTimer = React.useRef<number | null>(null);

  const index = Math.max(0, values.indexOf(value));
  const fmt = format ?? ((v: T) => String(v));
  const pad = Math.floor(VISIBLE / 2);
  const lastIndex = values.length - 1;

  // External value changes scroll the drum to the selected notch (instant,
  // guarded so the programmatic scroll never commits a value itself).
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const top = index * ITEM_H;
    if (Math.abs(list.scrollTop - top) > 1) {
      programmaticUntil.current = Date.now() + 250;
      list.scrollTo({ top });
    }
  }, [index, value]);

  /** Commit the notch currently centered in the selection window. */
  const commitFromScroll = React.useCallback(() => {
    const list = listRef.current;
    if (!list || disabled) return;
    if (Date.now() < programmaticUntil.current) return;
    const i = Math.min(Math.max(Math.round(list.scrollTop / ITEM_H), 0), lastIndex);
    const next = values[i];
    if (next !== undefined && next !== value) onChange(next);
  }, [values, lastIndex, onChange, value, disabled]);

  // Scroll-idle commit (works everywhere; `scrollend` is not in Safari yet).
  const handleScroll = React.useCallback(() => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(commitFromScroll, COMMIT_IDLE_MS);
  }, [commitFromScroll]);

  React.useEffect(() => {
    return () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    };
  }, []);

  // Native wheel handler — non-passive so one notch per burst is guaranteed.
  React.useEffect(() => {
    const list = listRef.current;
    if (!list || disabled) return;
    const onWheel = (e: WheelEvent) => {
      const dy = e.deltaY;
      if (dy === 0) return;
      e.preventDefault();
      const dir = dy > 0 ? 1 : -1;
      const nextIndex = Math.min(Math.max(index + dir, 0), lastIndex);
      if (nextIndex !== index) onChange(values[nextIndex]);
    };
    list.addEventListener("wheel", onWheel, { passive: false });
    return () => list.removeEventListener("wheel", onWheel);
  }, [index, lastIndex, values, onChange, disabled]);

  /** Listbox keyboard model: arrows move one notch, Home/End jump to bounds. */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const moves: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      PageUp: -VISIBLE,
      PageDown: VISIBLE,
    };
    if (e.key in moves) {
      e.preventDefault();
      const nextIndex = Math.min(Math.max(index + moves[e.key], 0), lastIndex);
      if (nextIndex !== index) onChange(values[nextIndex]);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(values[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(values[lastIndex]);
    }
  };

  return (
    <div
      className={cn(
        "relative select-none",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
      style={{ height: ITEM_H * VISIBLE }}
      data-wheel-picker
    >
      {/* 3D stage — perspective turns the notch column into a drum. */}
      <div
        className="absolute inset-0"
        style={{ perspective: `${ITEM_H * CYLINDER_R * 4}px` }}
      >
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          aria-orientation="vertical"
          tabIndex={disabled ? -1 : 0}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onBlur={commitFromScroll}
          className={cn(
            "h-full snap-y snap-mandatory overflow-y-auto outline-none",
            "focus-visible:ring-1 focus-visible:ring-ring/50",
          )}
          style={{
            scrollbarWidth: "none",
            maskImage:
              "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
          }}
        >
          {/* Snap spacers so first/last notches can center in the window. */}
          <li aria-hidden className="snap-none" style={{ height: ITEM_H * pad }} />
          {values.map((v, i) => {
            const selected = v === value;
            const offset = i - index;
            const angle =
              (Math.asin(Math.min(Math.max(-offset / CYLINDER_R, -1), 1)) * 180) /
              Math.PI;
            return (
              <li
                key={`${v}`}
                role="option"
                aria-selected={selected}
                onClick={() => onChange(v)}
                className={cn(
                  "flex snap-center cursor-pointer items-center justify-center font-mono text-[13px] tabular-nums transition-colors duration-150",
                  selected
                    ? "text-foreground"
                    : "text-muted-foreground/70 hover:text-muted-foreground",
                )}
                style={{
                  height: ITEM_H,
                  transform: `rotateX(${angle}deg)`,
                  opacity: Math.abs(offset) > pad ? 0.3 : 1,
                }}
              >
                {fmt(v)}
              </li>
            );
          })}
          <li aria-hidden className="snap-none" style={{ height: ITEM_H * pad }} />
        </ul>
      </div>

      {/* Selection window — hairlines + signal dot (§15/§16). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2"
      >
        <div className="h-[36px] border-y border-border/70 bg-muted/10" />
        <span className="signal-dot absolute -left-1 top-1/2 -translate-y-1/2" />
        <span className="signal-dot absolute -right-1 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}

/** Convenience: an hour drum (00–23). */
export function WheelHour({
  value,
  onChange,
  className,
  ariaLabel = "Hora",
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  return (
    <WheelPicker
      values={hours}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      format={(h) => String(h).padStart(2, "0")}
      className={className}
    />
  );
}

/** Convenience: a minute drum (00–59, step configurable). */
export function WheelMinute({
  value,
  onChange,
  step = 5,
  className,
  ariaLabel = "Minutos",
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const minutes = React.useMemo(
    () => Array.from({ length: Math.floor(60 / step) }, (_, i) => i * step),
    [step],
  );
  return (
    <WheelPicker
      values={minutes}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      format={(m) => String(m).padStart(2, "0")}
      className={className}
    />
  );
}

/** Convenience: a year drum spanning `from`–`to`. */
export function WheelYear({
  value,
  onChange,
  from = 2020,
  to = 2040,
  className,
  ariaLabel = "Año",
}: {
  value: number;
  onChange: (v: number) => void;
  from?: number;
  to?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const years = React.useMemo(
    () => Array.from({ length: to - from + 1 }, (_, i) => from + i),
    [from, to],
  );
  return (
    <WheelPicker
      values={years}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      className={className}
    />
  );
}

/** Convenience: day drum for a given year/month (handles month lengths). */
export function WheelDay({
  value,
  onChange,
  year,
  month,
  className,
  ariaLabel = "Día",
}: {
  value: number;
  onChange: (v: number) => void;
  year: number;
  /** 1–12 */
  month: number;
  className?: string;
  ariaLabel?: string;
}) {
  const days = React.useMemo(() => {
    const count = new Date(year, month, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [year, month]);
  const clamped = Math.min(value, days.length);
  React.useEffect(() => {
    if (clamped !== value) onChange(clamped);
  }, [clamped, value, onChange]);
  return (
    <WheelPicker
      values={days}
      value={clamped}
      onChange={onChange}
      ariaLabel={ariaLabel}
      className={className}
    />
  );
}

/** Convenience: month drum with localized short names. */
export function WheelMonth({
  value,
  onChange,
  locale = "es-ES",
  className,
  ariaLabel = "Mes",
}: {
  /** 1–12 */
  value: number;
  onChange: (v: number) => void;
  locale?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const months = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const label = new Intl.DateTimeFormat(locale, { month: "short" })
          .format(new Date(2024, i, 1))
          .replace(/\.$/, "");
        return { v: i + 1, label };
      }),
    [locale],
  );
  return (
    <WheelPicker
      values={months.map((m) => m.v)}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      format={(v) => months.find((m) => m.v === v)?.label ?? String(v)}
      className={className}
    />
  );
}
