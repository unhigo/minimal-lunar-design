/**
 * beUI AnimatedBadge — status pill with live pulse (OpenUI integration).
 *
 * Status colors map to semantic tokens; `pulse` marks live/in-progress
 * states with the brand signal color. Reduced-motion: the pulse animation
 * is removed, color feedback stays.
 */
import { cn } from "@/lib/utils";

export type BeBadgeStatus =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "loading";

const STATUS_CLS: Record<BeBadgeStatus, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-primary/30 bg-primary/10 text-primary",
  success: "border-primary/30 bg-primary/15 text-primary",
  warning: "border-destructive/30 bg-destructive/10 text-destructive",
  danger: "border-destructive/40 bg-destructive/15 text-destructive",
  loading: "border-border bg-muted text-foreground",
};

const STATUS_DOT: Record<BeBadgeStatus, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-primary",
  success: "bg-primary",
  warning: "bg-destructive",
  danger: "bg-destructive",
  loading: "bg-muted-foreground",
};

export function AnimatedBadge({
  status = "neutral",
  pulse = false,
  className,
  children,
}: {
  status?: BeBadgeStatus;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
        STATUS_CLS[status],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-1.5 shrink-0 rounded-full",
          STATUS_DOT[status],
          (pulse || status === "loading") && "motion-safe:animate-pulse",
        )}
      />
      {children}
    </span>
  );
}
