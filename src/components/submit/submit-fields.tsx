/**
 * Shared primitives for the /submit workflow fields.
 * All inputs carry label/id/name, hint, error + aria-invalid wiring.
 */

import { useId } from "react";
import { cn } from "@/lib/utils";

export function FieldShell({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  describedBy,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  describedBy?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          {label}
          {required && <span aria-hidden className="ml-1 text-foreground">*</span>}
        </label>
        {hint && (
          <span className="font-mono text-[10px] text-muted-foreground" aria-hidden>
            {hint}
          </span>
        )}
      </div>
      {children}
      {error && (
        <p id={describedBy} role="alert" className="text-[12px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Compose helper: generates ids + wires aria-describedby / aria-invalid. */
export function useFieldIds(error?: string) {
  const base = useId();
  const inputId = `sf-${base}`;
  const errId = error ? `sf-${base}-err` : undefined;
  return { inputId, errId };
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  required,
  type = "text",
  maxLength,
  autoComplete,
  inputMode,
  className,
  monospace = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "email" | "url";
  className?: string;
  monospace?: boolean;
}) {
  const { inputId, errId } = useFieldIds(error);
  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      required={required}
      describedBy={errId}
    >
      <input
        id={inputId}
        name={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={errId}
        className={cn(
          "h-11 w-full rounded-sm border bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground",
          error ? "border-destructive" : "border-border focus:border-foreground/40",
          monospace && "font-mono",
          className,
        )}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  required,
  rows = 7,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
}) {
  const { inputId, errId } = useFieldIds(error);
  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      required={required}
      describedBy={errId}
    >
      <textarea
        id={inputId}
        name={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={errId}
        className={cn(
          "min-h-32 w-full resize-y rounded-sm border bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground",
          error ? "border-destructive" : "border-border focus:border-foreground/40",
        )}
      />
    </FieldShell>
  );
}

/** Selectable chip used for platforms / ecosystems / tags. */
export function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[12px] transition-colors",
        on
          ? "border-foreground/60 bg-muted/40 text-foreground"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Single-choice card used for categories / pricing / licenses / roles. */
export function OptionCard({
  on,
  onClick,
  glyph,
  label,
  description,
}: {
  on: boolean;
  onClick: () => void;
  glyph?: string;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-sm border p-3 text-left text-[13px] transition-colors",
        on
          ? "border-foreground/60 bg-muted/40"
          : "border-border hover:border-foreground/30",
      )}
    >
      {glyph && (
        <span
          aria-hidden
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          {glyph}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}
