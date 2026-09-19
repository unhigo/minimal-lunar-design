import { type ReactNode } from "react";
import { useGsapReveal } from "@/hooks/use-gsap";

/**
 * Editorial section shell: the canonical vertical rhythm (section-pad) plus
 * GSAP reveal-up for [data-reveal] children. A slim mono index label sits
 * above the heading, numbered like the strategies list.
 */
export function EditorialSection({
  index,
  kicker,
  title,
  action,
  children,
  className = "",
  border = false,
}: {
  /** Section number, e.g. "02" — rendered with a hairline rule. */
  index?: string;
  kicker: string;
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  border?: boolean;
}) {
  const ref = useGsapReveal<HTMLElement>(0.09);

  return (
    <section
      ref={ref}
      className={`mx-auto w-full max-w-6xl px-5 section-pad ${border ? "border-t border-border/60" : ""} ${className}`}
    >
      <div
        data-reveal
        className="flex items-end justify-between gap-4 border-t border-foreground/20 pt-5"
      >
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            {index ? `${index} — ` : ""}
            {kicker}
          </p>
          <h2 className="h2-editorial mt-3 max-w-xl">{title}</h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
