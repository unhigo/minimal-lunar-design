/**
 * Step screens 01–03: Identity (URL autofill), Classification, Details.
 */

import { Check, Globe, Loader2, Plus, Tag as TagIcon, X } from "lucide-react";
import { useState } from "react";
import {
  ECOSYSTEMS,
  PLATFORMS,
  SUBMIT_CATEGORIES,
} from "@/lib/submit-schema";
import type { FormState } from "@/lib/submit-steps";
import { Chip, OptionCard, TextAreaField, TextField } from "./submit-fields";
import { UploadField } from "./UploadField";

/** Common props every step screen receives from the page. */
export interface StepProps {
  form: FormState;
  errors: Record<string, string>;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

// ---------------------------------------------------------------------------
// 01 — IDENTITY
// ---------------------------------------------------------------------------

export type AutofillState = "idle" | "fetching" | "detected" | "partial" | "failed";

export function IdentityStep({
  form,
  errors,
  set,
  autofillState,
  detected,
  onDetect,
  logoBusy,
  onLogoFile,
  onRemoveLogo,
}: StepProps & {
  autofillState: AutofillState;
  detected: { title: boolean; description: boolean; imageUrl: boolean };
  onDetect: () => void;
  logoBusy: boolean;
  onLogoFile: (f: File) => void;
  onRemoveLogo: () => void;
}) {
  const canDetect = /^https?:\/\/[^\s]+$/i.test(form.url.trim());

  return (
    <div className="space-y-6">
      <TextField
        label="Tool name"
        required
        value={form.title}
        onChange={(v) => set("title", v)}
        placeholder="p. ej. Nyxhora Grid"
        maxLength={80}
        autoComplete="organization"
        error={errors.title}
      />

      <TextField
        label="Website URL"
        required
        type="url"
        inputMode="url"
        value={form.url}
        onChange={(v) => set("url", v)}
        placeholder="https://…"
        error={errors.url}
      />

      {/* Fill automatically — runs the real server action; never blocks */}
      <div className="flex flex-col gap-3 rounded-sm border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] font-medium">Fill automatically</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
            Lee título, descripción e imagen de la web. Todo queda editable.
          </p>
          <p
            aria-live="polite"
            className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em]"
          >
            {autofillState === "fetching" && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Fetching metadata…
              </span>
            )}
            {autofillState === "detected" && (
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <Check className="size-3" /> Metadata detected
              </span>
            )}
            {autofillState === "partial" && (
              <span className="text-muted-foreground">
                Metadata detected (partial) —{" "}
                {[
                  !detected.title && "title",
                  !detected.description && "description",
                  !detected.imageUrl && "image",
                ]
                  .filter(Boolean)
                  .join(", ")}{" "}
                not found
              </span>
            )}
            {autofillState === "failed" && (
              <span className="text-muted-foreground">
                We couldn't automatically read this website. You can continue
                manually.
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onDetect}
          disabled={!canDetect || autofillState === "fetching"}
          className="btn-outline h-9 shrink-0 px-4 text-[12px] disabled:opacity-40"
        >
          {autofillState === "fetching" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Globe className="size-3.5" />
          )}
          Fill automatically
        </button>
      </div>

      <TextField
        label="Tagline"
        required
        value={form.tagline}
        onChange={(v) => set("tagline", v)}
        placeholder="Qué es, en una frase."
        maxLength={100}
        hint={`${form.tagline.length}/100`}
        error={errors.tagline}
      />

      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Logo
        </p>
        <UploadField
          label="Subir logotipo"
          accept="image/png,image/svg+xml,image/webp"
          busy={logoBusy}
          previewUrl={form.logoUrl}
          onFile={onLogoFile}
          onRemove={onRemoveLogo}
          hint="SVG / PNG / WEBP · máx. 8 MB"
        />
        <p className="text-[11px] text-muted-foreground">
          Cuadrado, se muestra junto al nombre en el directorio.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 02 — CLASSIFICATION
// ---------------------------------------------------------------------------

export function ClassificationStep({ form, errors, set }: StepProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || form.tags.includes(t) || form.tags.length >= 8) return;
    set("tags", [...form.tags, t]);
    setTagInput("");
  };

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Main category <span aria-hidden className="text-foreground">*</span>
        </legend>
        <div
          role="radiogroup"
          aria-label="Categoría principal"
          className="mt-2 grid gap-2 sm:grid-cols-2"
        >
          {SUBMIT_CATEGORIES.map((c) => (
            <OptionCard
              key={c.id}
              glyph={c.glyph}
              label={c.label}
              on={form.category === c.id}
              onClick={() => set("category", c.id)}
            />
          ))}
        </div>
        {errors.category && (
          <p role="alert" className="mt-2 text-[12px] text-destructive">
            {errors.category}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Platforms{" "}
          <span className="font-mono text-[10px] normal-case text-muted-foreground/70">
            · multi
          </span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <Chip
              key={p}
              on={form.platforms.includes(p)}
              onClick={() =>
                set(
                  "platforms",
                  form.platforms.includes(p)
                    ? form.platforms.filter((x) => x !== p)
                    : [...form.platforms, p],
                )
              }
            >
              {form.platforms.includes(p) && <Check className="size-3" />}
              {p}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Compatible with
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ECOSYSTEMS.map((e) => (
            <Chip
              key={e}
              on={form.ecosystems.includes(e)}
              onClick={() =>
                set(
                  "ecosystems",
                  form.ecosystems.includes(e)
                    ? form.ecosystems.filter((x) => x !== e)
                    : [...form.ecosystems, e],
                )
              }
            >
              {form.ecosystems.includes(e) && <Check className="size-3" />}
              {e}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Tags{" "}
          <span className="font-mono text-[10px] normal-case text-muted-foreground/70">
            · máx. 8 · Enter o +
          </span>
        </legend>
        <div className="mt-2 flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            maxLength={24}
            aria-label="Nueva etiqueta"
            placeholder="tipografía, tokens, 3d…"
            className="h-11 w-full rounded-sm border border-border bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
          />
          <button
            type="button"
            onClick={addTag}
            aria-label="Añadir etiqueta"
            className="btn-outline h-11 shrink-0 px-4"
          >
            <TagIcon className="size-3.5" /> +
          </button>
        </div>
        {form.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {form.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 font-mono text-[11px]"
              >
                #{t}
                <button
                  type="button"
                  aria-label={`Quitar ${t}`}
                  onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.tags && (
          <p role="alert" className="mt-2 text-[12px] text-destructive">
            {errors.tags}
          </p>
        )}
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 03 — DETAILS
// ---------------------------------------------------------------------------

export function DetailsStep({ form, errors, set }: StepProps) {
  return (
    <div className="space-y-6">
      <TextAreaField
        label="Full description"
        required
        value={form.description}
        onChange={(v) => set("description", v)}
        placeholder="Qué hace, para quién es y qué lo hace útil…"
        hint={`${form.description.length}/4000`}
        rows={8}
        maxLength={4000}
        error={errors.description}
      />
      <p className="-mt-3 text-[12px] text-muted-foreground">
        Explain what the tool does, who it is for and what makes it useful.
      </p>

      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Key features <span aria-hidden className="text-foreground">*</span>
          <span className="ml-2 font-mono text-[10px] normal-case text-muted-foreground/70">
            3–5
          </span>
        </legend>
        <div className="mt-2 space-y-2">
          {form.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                aria-hidden
                className="w-6 shrink-0 font-mono text-[10px] text-muted-foreground"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <input
                value={f}
                onChange={(e) =>
                  set(
                    "features",
                    form.features.map((x, j) => (j === i ? e.target.value : x)),
                  )
                }
                maxLength={120}
                aria-label={`Característica ${i + 1}`}
                placeholder="Qué puede hacer el usuario con ello"
                className="h-11 w-full rounded-sm border border-border bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
              />
              {form.features.length > 3 && (
                <button
                  type="button"
                  aria-label={`Quitar característica ${i + 1}`}
                  onClick={() =>
                    set(
                      "features",
                      form.features.filter((_, j) => j !== i),
                    )
                  }
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {form.features.length < 5 && (
          <button
            type="button"
            className="btn-outline mt-2 h-9 px-4 text-[12px]"
            onClick={() => set("features", [...form.features, ""])}
          >
            <Plus className="size-3" /> Add feature
          </button>
        )}
        {errors.features && (
          <p role="alert" className="mt-2 text-[12px] text-destructive">
            {errors.features}
          </p>
        )}
      </fieldset>
    </div>
  );
}
