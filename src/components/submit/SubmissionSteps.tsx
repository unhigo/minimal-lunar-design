/**
 * Progress rail + sticky navigation for the /submit workflow.
 * Pure presentational pieces driven by the step manifest + completion data.
 */

import { Check } from "lucide-react";
import { Loader2, ArrowLeft, ArrowRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS, type StepId } from "@/lib/submit-steps";

export type NavState = "idle" | "submitting" | "success" | "error";

/** Progress: STEP 02 / 07 + a thin completion bar. */
export function SubmissionProgress({
  current,
  progressPct,
}: {
  current: StepId;
  progressPct: number;
}) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div aria-live="polite" aria-atomic="true">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Step {STEPS[idx].n} / 07
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">{STEPS[idx].label}</p>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPct)}
        aria-label="Progreso del envío"
        className="mt-2 h-px w-full bg-border/70"
      >
        <div
          className="h-px bg-foreground transition-[width] duration-150 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Vertical step list: completed (✓) / current (accent) / available / locked.
 * Locked = an earlier step still has missing required fields.
 */
export function SubmissionStepList({
  current,
  completed,
  missing,
  onSelect,
}: {
  current: StepId;
  completed: Record<StepId, boolean>;
  missing: Record<StepId, number>;
  onSelect: (id: StepId) => void;
}) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Pasos del envío" className="space-y-0.5">
      {STEPS.map((s, i) => {
        const isCurrent = s.id === current;
        const isDone = completed[s.id] && !isCurrent;
        const isLocked = i > currentIdx && missing[STEPS[i - 1].id] > 0;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            disabled={isLocked}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left font-mono text-[11px] transition-colors",
              isCurrent && "text-foreground",
              !isCurrent && !isLocked && "text-muted-foreground hover:text-foreground",
              isLocked && "cursor-not-allowed text-muted-foreground/40",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "w-5 text-right",
                isCurrent && "text-[#FF0033]",
              )}
            >
              {isDone ? <Check className="inline size-3" /> : s.n}
            </span>
            <span className="flex-1">{s.label}</span>
            {!isDone && missing[s.id] > 0 && !isCurrent && (
              <span className="text-[10px] text-muted-foreground/70">
                {missing[s.id]}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/** Sticky footer nav: Back / Continue — or Submit proposal on the last step. */
export function FormNavigation({
  isFirst,
  isLast,
  submitting,
  onBack,
  onNext,
  onSubmit,
}: {
  isFirst: boolean;
  isLast: boolean;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst || submitting}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-sm border border-border px-4 text-[13px] transition-colors hover:border-foreground/40",
          (isFirst || submitting) && "pointer-events-none opacity-40",
        )}
      >
        <ArrowLeft className="size-3.5" /> Back
      </button>

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="size-3.5" />
              Submit proposal
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={submitting}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Continue <ArrowRight className="size-3.5" />
        </button>
      )}
    </div>
  );
}
