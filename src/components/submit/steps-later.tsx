/**
 * Step screens 04–06: Media, Pricing & License, Creator.
 */

import { Plus, X } from "lucide-react";
import {
  LICENSES,
  PRICING_MODELS,
  SENDER_ROLES,
} from "@/lib/submit-schema";
import type { FormState } from "@/lib/submit-steps";
import { OptionCard, TextField } from "./submit-fields";
import type { StepProps } from "./steps-basics";
import { AddShotTile, UploadField } from "./UploadField";
import {
  WheelDay,
  WheelMonth,
  WheelYear,
} from "@/components/ui/wheel-picker";

// ---------------------------------------------------------------------------
// 04 — MEDIA
// ---------------------------------------------------------------------------

export function MediaStep({
  logoBusy,
  shotsBusy,
  thumbBusy,
  logoUrl,
  gallery,
  thumbUrl,
  onLogoFile,
  onRemoveLogo,
  onShots,
  onRemoveShot,
  onThumbFile,
  onRemoveThumb,
  videoUrl,
  onVideoUrlChange,
  videoError,
}: {
  logoBusy: boolean;
  shotsBusy: boolean;
  thumbBusy: boolean;
  logoUrl: string | null;
  gallery: FormState["gallery"];
  thumbUrl: string | null;
  onLogoFile: (f: File) => void;
  onRemoveLogo: () => void;
  onShots: (files: File[]) => void;
  onRemoveShot: (storageId: string) => void;
  onThumbFile: (f: File) => void;
  onRemoveThumb: () => void;
  videoUrl: string;
  onVideoUrlChange: (v: string) => void;
  videoError?: string;
}) {
  return (
    <div className="space-y-8">
      <section aria-label="Logo" className="space-y-2">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Logo
        </h3>
        <UploadField
          label="Subir logotipo"
          accept="image/png,image/svg+xml,image/webp"
          busy={logoBusy}
          previewUrl={logoUrl}
          onFile={onLogoFile}
          onRemove={onRemoveLogo}
          hint="SVG / PNG / WEBP · máx. 8 MB"
        />
      </section>

      <section aria-label="Screenshots" className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Screenshots
          </h3>
          <span className="font-mono text-[10px] text-muted-foreground">
            {gallery.length}/4
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {gallery.map((g) => (
            <div key={g.storageId} className="group relative">
              <img
                src={g.url}
                alt="Captura de la herramienta"
                className="aspect-[4/3] w-full rounded-sm border border-border object-cover"
              />
              <button
                type="button"
                aria-label="Quitar captura"
                onClick={() => onRemoveShot(g.storageId)}
                className="absolute right-1.5 top-1.5 rounded-sm bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {gallery.length < 4 && (
            <AddShotTile
              label="Add screenshot"
              accept="image/png,image/jpeg,image/webp,image/gif"
              busy={shotsBusy}
              onFiles={onShots}
            />
          )}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground/70">
          PNG / JPG / WEBP
        </p>
      </section>

      <section aria-label="Cover" className="space-y-2">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Cover / Thumbnail
        </h3>
        <UploadField
          label="Subir portada"
          accept="image/png,image/jpeg,image/webp"
          busy={thumbBusy}
          previewUrl={thumbUrl}
          onFile={onThumbFile}
          onRemove={onRemoveThumb}
          aspect="wide"
          hint="Horizontal, 16:9"
        />
        <p className="text-[12px] text-muted-foreground">
          Used as the primary visual in the directory.
        </p>
      </section>

      <section aria-label="Demo video" className="space-y-2">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Demo video
        </h3>
        <TextField
          label="Video URL"
          value={videoUrl}
          onChange={onVideoUrlChange}
          placeholder="https://youtube.com/watch?v=…"
          hint="Loom / YouTube / Vimeo"
          error={videoError}
        />
        <p className="text-[12px] text-muted-foreground">
          Solo se acepta el enlace; el vídeo nunca se descarga.
        </p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 05 — PRICING
// ---------------------------------------------------------------------------

export function PricingStep({ form, errors, set }: StepProps) {
  const priceNote =
    form.pricing === "free"
      ? "Gratis / Open Source: no hace falta indicar precio."
      : "Ej. «Desde $12/mes» o «Plan free disponible».";

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Pricing model <span aria-hidden className="text-foreground">*</span>
        </legend>
        <div
          role="radiogroup"
          aria-label="Modelo de precios"
          className="mt-2 grid gap-2 sm:grid-cols-2"
        >
          {PRICING_MODELS.map((p) => (
            <OptionCard
              key={p.id}
              label={p.label}
              on={form.pricing === p.id}
              onClick={() => set("pricing", p.id)}
            />
          ))}
        </div>
      </fieldset>

      <TextField
        label="Price range / note"
        value={form.pricingDetails}
        onChange={(v) => set("pricingDetails", v)}
        maxLength={80}
        hint={`${form.pricingDetails.length}/80`}
        error={errors.pricingDetails}
      />
      <p className="-mt-3 text-[12px] text-muted-foreground">{priceNote}</p>

      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          License <span aria-hidden className="text-foreground">*</span>
        </legend>
        <div role="radiogroup" aria-label="Licencia" className="mt-2 grid gap-2">
          {LICENSES.map((l) => (
            <OptionCard
              key={l.id}
              label={l.label}
              on={form.license === l.id}
              onClick={() => set("license", l.id)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-sm border border-border/70 p-4">
        <legend className="px-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Community discount
        </legend>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-[13px] font-medium">
              Community discount available
            </span>
            <span className="mt-0.5 block text-[12px] text-muted-foreground">
              Se mostrará como insignia en la ficha del recurso.
            </span>
          </span>
          <input
            type="checkbox"
            checked={form.discountEnabled}
            onChange={(e) => set("discountEnabled", e.target.checked)}
            className="size-4 accent-[color:var(--foreground)]"
          />
        </label>
        {form.discountEnabled && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <TextField
              label="Código de cupón"
              value={form.discountCode}
              onChange={(v) => set("discountCode", v.toUpperCase())}
              placeholder="LAB10"
              maxLength={40}
              monospace
              error={errors.discount}
            />
            <TextField
              label="Descuento (%)"
              value={form.discountPercent}
              onChange={(v) =>
                set("discountPercent", v.replace(/[^0-9]/g, "").slice(0, 3))
              }
              placeholder="10"
              inputMode="numeric"
              monospace
              error={errors.discount}
            />
          </div>
        )}
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 06 — CREATOR
// ---------------------------------------------------------------------------

/** Date drum trio — same wheel picker the previous submit page used. */
export function ScheduleWheel({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [y, m, d] = value ? value.split("-").map(Number) : [0, 0, 0];
  const now = new Date();
  const years = Array.from(
    { length: now.getFullYear() - 2024 + 3 },
    (_, i) => 2024 + i,
  );
  const has = Boolean(value);
  const year = y || now.getFullYear();
  const month = m || now.getMonth() + 1;
  const day = d || now.getDate();

  const commit = (ny: number, nm: number, nd: number) => {
    const dim = new Date(ny, nm, 0).getDate();
    const dd = Math.min(nd, dim);
    onChange(
      `${ny}-${String(nm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`,
    );
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex items-end gap-2 rounded-sm border border-border bg-transparent px-2 py-1">
        <WheelDay
          value={day}
          onChange={(nd) => commit(year, month, nd)}
          year={year}
          month={month}
          ariaLabel="Día"
        />
        <span
          aria-hidden
          className="pb-3.5 font-mono text-[12px] text-muted-foreground"
        >
          /
        </span>
        <WheelMonth
          value={month}
          onChange={(nm) => commit(year, nm, day)}
          ariaLabel="Mes"
        />
        <span
          aria-hidden
          className="pb-3.5 font-mono text-[12px] text-muted-foreground"
        >
          /
        </span>
        <WheelYear
          value={year}
          onChange={(ny) => commit(ny, month, day)}
          from={2024}
          to={years[years.length - 1]}
          ariaLabel="Año"
        />
      </div>
      {has && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Quitar fecha programada"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function CreatorStep({ form, errors, set }: StepProps) {
  const addLink = () => {
    if (form.authorLinks.filter((l) => l.trim()).length >= 4) return;
    set("authorLinks", [...form.authorLinks, ""]);
  };

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Submitter role <span aria-hidden className="text-foreground">*</span>
        </legend>
        <div
          role="radiogroup"
          aria-label="Rol del remitente"
          className="mt-2 grid gap-2 sm:grid-cols-2"
        >
          {SENDER_ROLES.map((r) => (
            <OptionCard
              key={r.id}
              label={r.label}
              on={form.senderRole === r.id}
              onClick={() => set("senderRole", r.id)}
            />
          ))}
        </div>
      </fieldset>

      <TextField
        label="Creator / author name"
        required
        value={form.authorHandle}
        onChange={(v) => set("authorHandle", v)}
        placeholder="@estudio"
        maxLength={60}
        error={errors.authorHandle}
      />

      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Author links
          <span className="ml-2 font-mono text-[10px] normal-case text-muted-foreground/70">
            web, portfolio o redes · máx. 4
          </span>
        </legend>
        <div className="mt-2 space-y-2">
          {form.authorLinks.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={l}
                onChange={(e) =>
                  set(
                    "authorLinks",
                    form.authorLinks.map((x, j) => (j === i ? e.target.value : x)),
                  )
                }
                type="url"
                inputMode="url"
                aria-label={`Enlace de autor ${i + 1}`}
                placeholder="https://… (opcional)"
                className="h-11 w-full rounded-sm border border-border bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
              />
              {form.authorLinks.length > 1 && (
                <button
                  type="button"
                  aria-label={`Quitar enlace ${i + 1}`}
                  onClick={() =>
                    set(
                      "authorLinks",
                      form.authorLinks.filter((_, j) => j !== i),
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
        {form.authorLinks.filter((l) => l.trim()).length < 4 && (
          <button
            type="button"
            className="btn-outline mt-2 h-9 px-4 text-[12px]"
            onClick={addLink}
          >
            <Plus className="size-3" /> Add link
          </button>
        )}
        {errors.authorLinks && (
          <p role="alert" className="mt-2 text-[12px] text-destructive">
            {errors.authorLinks}
          </p>
        )}
      </fieldset>

      <TextField
        label="Contact email"
        required
        type="email"
        inputMode="email"
        autoComplete="email"
        value={form.contactEmail}
        onChange={(v) => set("contactEmail", v)}
        placeholder="tu@correo.com"
        error={errors.contactEmail}
      />
      <p className="-mt-3 text-[12px] text-muted-foreground">
        Privado — solo lo ve el equipo de moderación.
      </p>

      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Preferred contact / launch schedule
        </p>
        <p className="text-[12px] text-muted-foreground">
          Programa el lanzamiento (opcional). «—» desactiva la programación.
        </p>
        <ScheduleWheel
          value={form.scheduledDate}
          onChange={(v) => set("scheduledDate", v)}
        />
        {errors.scheduledDate && (
          <p role="alert" className="text-[12px] text-destructive">
            {errors.scheduledDate}
          </p>
        )}
      </div>
    </div>
  );
}
