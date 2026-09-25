/**
 * MOONØ.LAB logo system — brand guidelines §12–§14.
 *
 * PRIMARY  <Logo />       MOONØ.LAB wordmark + signal dot (institutional)
 * WORDMARK <Logo variant="wordmark" />  MOONØ (navigation, interfaces)
 * MONOGRAM <Logo variant="monogram" />  MØ (badges, small spaces)
 * SYMBOL   <OSymbol />    Ø alone (favicon, avatars, status, watermarks)
 *
 * The Ø is geometric and stays geometric: circle + axis, no moon crescents,
 * no stars, no 3D. It must read without the name.
 */
import { cn } from "@/lib/utils";

/** The Ø symbol alone — O (orbit/object) + / (axis/trajectory). */
export function OSymbol({
  className,
  strokeWidth = 2.5,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="MOONØ.LAB"
      className={cn("shrink-0", className)}
      fill="none"
    >
      {/* O — orbit / object / observation */}
      <circle cx="24" cy="24" r="15.5" stroke="currentColor" strokeWidth={strokeWidth} />
      {/* / — axis / trajectory / measurement, clipped to the O bounds */}
      <g clipPath="url(#osymbol-clip)">
        <line
          x1="32"
          y1="2"
          x2="16"
          y2="46"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      </g>
      <defs>
        <clipPath id="osymbol-clip">
          <circle cx="24" cy="24" r="17.75" />
        </clipPath>
      </defs>
    </svg>
  );
}

export type LogoVariant = "primary" | "wordmark" | "monogram";

export function Logo({
  variant = "primary",
  className,
  signalDot = true,
}: {
  variant?: LogoVariant;
  className?: string;
  /** Show the #FF0033 signal dot (brand mark detail). */
  signalDot?: boolean;
}) {
  if (variant === "monogram") {
    return (
      <span
        className={cn(
          "inline-flex items-baseline font-medium uppercase leading-none tracking-tight",
          className,
        )}
      >
        M
        <OSymbol className="inline-block size-[0.92em] translate-y-[0.06em]" strokeWidth={3.4} />
        {signalDot && <SignalDot className="ml-[0.08em] size-[0.16em]" />}
      </span>
    );
  }

  const text = variant === "wordmark" ? "MOONØ" : "MOONØ.LAB";
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-medium uppercase leading-none tracking-[0.06em]",
        className,
      )}
    >
      <span>{text.slice(0, 4)}</span>
      <OSymbol className="inline-block size-[0.92em] translate-y-[0.06em]" strokeWidth={3.2} />
      {variant === "primary" && (
        <>
          <span>.LAB</span>
          {signalDot && <SignalDot className="ml-[0.14em] size-[0.16em]" />}
        </>
      )}
    </span>
  );
}

/** The signal dot — #FF0033 is a signal, never decoration. */
export function SignalDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 rounded-full bg-[#FF0033]", className)}
    />
  );
}

/**
 * The Ø inside its orbital structure (§20 visual motif): symbol + orbit ring +
 * crosshair ticks + technical node. Used for hero/stage moments.
 */
export function OrbitMark({
  className,
  children,
}: {
  className?: string;
  /** Optional live content rendered at the center (e.g. the LiquidOrb). */
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative flex aspect-square items-center justify-center", className)}>
      {/* Orbit ring */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full text-muted-foreground/50"
        fill="none"
      >
        <circle cx="50" cy="50" r="49" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 3" />
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.3" />
        {/* Axis ticks — N/E/S/W */}
        <line x1="50" y1="1" x2="50" y2="7" stroke="currentColor" strokeWidth="0.6" />
        <line x1="50" y1="93" x2="50" y2="99" stroke="currentColor" strokeWidth="0.6" />
        <line x1="1" y1="50" x2="7" y2="50" stroke="currentColor" strokeWidth="0.6" />
        <line x1="93" y1="50" x2="99" y2="50" stroke="currentColor" strokeWidth="0.6" />
      </svg>
      {children}
    </div>
  );
}
