/**
 * Shared filter chips — the same visual pattern previously repeated in
 * Tools and Inspiration. "all" acts as the reset value, matching the
 * existing convention where filters default to "all".
 */

interface FilterChipsProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
  ariaLabel?: string;
}

export function FilterChips({
  options,
  value,
  onChange,
  allLabel = "todas",
  ariaLabel = "Filtrar por categoría",
}: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0"
    >
      <button
        onClick={() => onChange("all")}
        aria-pressed={value === "all"}
        className={`shrink-0 rounded-sm border px-3 py-1.5 font-mono text-[11px] transition-colors ${
          value === "all"
            ? "border-foreground/50 text-foreground"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`shrink-0 rounded-sm border px-3 py-1.5 font-mono text-[11px] transition-colors ${
            value === option
              ? "border-foreground/50 text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
