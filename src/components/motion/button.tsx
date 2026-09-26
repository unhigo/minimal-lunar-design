/**
 * beUI Button — spring-pressed action button (OpenUI integration).
 *
 * Semantic controls + shadcn tokens: inherits the host theme. Motion per
 * beui Motion Guides — SPRING_PRESS feedback on press, gated behind
 * reduced-motion (the scale change is removed, opacity stays).
 */
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Press feedback token — fast, weighted, immediate (100–160ms feel). */
const SPRING_PRESS = { type: "spring", stiffness: 500, damping: 30, mass: 0.6 } as const;

export type BeButtonVariant = "primary" | "secondary" | "ghost" | "outline";

const VARIANT_CLS: Record<BeButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",
  ghost:
    "bg-transparent text-foreground hover:bg-muted border border-transparent",
  outline:
    "bg-transparent text-foreground border border-border hover:bg-muted",
};

export function Button({
  variant = "primary",
  ripple = false,
  className,
  onClick,
  children,
  type = "button",
  disabled,
}: {
  variant?: BeButtonVariant;
  /** Extra press ripple — decorative, disabled under reduced motion. */
  ripple?: boolean;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={SPRING_PRESS}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-sm px-4 text-[13px] font-medium transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40",
        VARIANT_CLS[variant],
        className,
      )}
    >
      {children}
      {ripple && !reduce && (
        <span
          aria-hidden
          className="signal-dot ml-0.5 motion-safe:animate-pulse"
        />
      )}
    </motion.button>
  );
}
