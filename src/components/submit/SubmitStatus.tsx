/**
 * Submission end states — success (real backend reference) and error
 * (data preserved, retry offered). Both are full-screen and quiet.
 */

import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import { OSymbol } from "@/components/brand/Logo";

export function SuccessState({
  reference,
  submittingAnother,
}: {
  reference: string;
  submittingAnother: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-24 text-center">
      <OSymbol className="size-10 text-foreground" strokeWidth={2} />
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        Submission received
      </p>
      <h1 className="mt-4 h1-editorial tracking-tight">
        Your tool has been submitted for review.
      </h1>

      <dl className="mt-10 grid w-full grid-cols-2 gap-px border border-border/60 bg-border/60 text-left">
        <div className="bg-background p-4">
          <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Reference
          </dt>
          <dd className="mt-1.5 font-mono text-[13px]">{reference}</dd>
        </div>
        <div className="bg-background p-4">
          <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Status
          </dt>
          <dd className="mt-1.5 font-mono text-[13px]">pending review</dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link to="/tools" className="btn-solid">
          Back to directory
        </Link>
        <button type="button" className="btn-outline" onClick={submittingAnother}>
          Submit another tool
        </button>
      </div>
    </main>
  );
}

export function ErrorState({
  onRetry,
  submitting,
}: {
  onRetry: () => void;
  submitting: boolean;
}) {
  return (
    <div
      role="alert"
      className="rounded-sm border border-destructive/50 p-6 text-center"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-destructive">
        Submission error
      </p>
      <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed">
        No se pudo enviar la propuesta. Tu información no se ha perdido: revisa
        los datos e inténtalo de nuevo.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={submitting}
        className="btn-solid mt-5 disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          "Retry"
        )}
      </button>
    </div>
  );
}
