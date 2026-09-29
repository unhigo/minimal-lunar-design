/**
 * ReviewStep — the editorial submission sheet for step 07.
 * Not a field dump: grouped rows with real values + per-section Edit actions.
 */

import { Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LICENSES,
  PRICING_MODELS,
  SENDER_ROLES,
  SUBMIT_CATEGORIES,
} from "@/lib/submit-schema";
import type { FormState, StepId } from "@/lib/submit-steps";

interface ReviewBlock {
  id: StepId;
  title: string;
  rows: { label: string; value: string; state: "ok" | "count" | "empty" }[];
}

function rowsFor(form: FormState): ReviewBlock[] {
  const cat = SUBMIT_CATEGORIES.find((c) => c.id === form.category)?.label;
  const price = PRICING_MODELS.find((p) => p.id === form.pricing)?.label;
  const lic = LICENSES.find((l) => l.id === form.license)?.label;
  const role = SENDER_ROLES.find((r) => r.id === form.senderRole)?.label;
  const feats = form.features.map((f) => f.trim()).filter(Boolean);
  const links = form.authorLinks.map((l) => l.trim()).filter(Boolean);

  return [
    {
      id: "identity",
      title: "IDENTITY",
      rows: [
        { label: "Tool name", value: form.title.trim(), state: form.title.trim() ? "ok" : "empty" },
        { label: "Website", value: form.url.trim(), state: form.url.trim() ? "ok" : "empty" },
        { label: "Tagline", value: form.tagline.trim(), state: form.tagline.trim() ? "ok" : "empty" },
      ],
    },
    {
      id: "classification",
      title: "CLASSIFICATION",
      rows: [
        { label: "Category", value: cat ?? "", state: cat ? "ok" : "empty" },
        {
          label: "Platforms",
          value: form.platforms.length ? form.platforms.join(", ") : "",
          state: form.platforms.length ? "count" : "empty",
        },
        {
          label: "Tags",
          value: `${form.tags.length}`,
          state: form.tags.length ? "count" : "empty",
        },
      ],
    },
    {
      id: "details",
      title: "DETAILS",
      rows: [
        {
          label: "Description",
          value: form.description.trim() ? `${form.description.trim().length} chars` : "",
          state: form.description.trim().length >= 30 ? "ok" : "empty",
        },
        {
          label: "Features",
          value: `${feats.length}`,
          state: feats.length >= 3 ? "count" : "empty",
        },
      ],
    },
    {
      id: "media",
      title: "MEDIA",
      rows: [
        { label: "Logo", value: form.logoUrl ? "uploaded" : "", state: form.logoUrl ? "ok" : "empty" },
        {
          label: "Screenshots",
          value: `${form.gallery.length}`,
          state: form.gallery.length ? "count" : "empty",
        },
        { label: "Cover", value: form.thumbUrl ? "uploaded" : "", state: form.thumbUrl ? "ok" : "empty" },
        { label: "Video", value: form.videoUrl.trim() || "", state: form.videoUrl.trim() ? "ok" : "empty" },
      ],
    },
    {
      id: "pricing",
      title: "PRICING",
      rows: [
        { label: "Model", value: price ?? "", state: price ? "ok" : "empty" },
        { label: "License", value: lic ?? "", state: lic ? "ok" : "empty" },
        {
          label: "Community deal",
          value: form.discountEnabled ? `−${form.discountPercent || "?"}% · ${form.discountCode || "?"}` : "",
          state: form.discountEnabled ? "ok" : "empty",
        },
      ],
    },
    {
      id: "creator",
      title: "CREATOR",
      rows: [
        { label: "Author", value: form.authorHandle.trim(), state: form.authorHandle.trim() ? "ok" : "empty" },
        { label: "Links", value: links.length ? `${links.length}` : "", state: links.length ? "count" : "empty" },
        { label: "Contact", value: form.contactEmail.trim(), state: form.contactEmail.trim() ? "ok" : "empty" },
      ],
    },
  ];
}

export function ReviewStep({
  form,
  onEdit,
}: {
  form: FormState;
  onEdit: (step: StepId) => void;
}) {
  return (
    <div className="space-y-px border border-border/60 bg-border/60">
      {rowsFor(form).map((block) => (
        <section
          key={block.id}
          aria-label={block.title}
          className="bg-background p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {block.title}
            </h3>
            <button
              type="button"
              onClick={() => onEdit(block.id)}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
          <dl className="mt-3 space-y-1.5">
            {block.rows.map((r) => (
              <div
                key={r.label}
                className="flex items-baseline justify-between gap-4 text-[13px]"
              >
                <dt className="shrink-0 text-muted-foreground">{r.label}</dt>
                <dd
                  className={cn(
                    "min-w-0 truncate text-right",
                    r.state === "empty" && "font-mono text-[11px] text-muted-foreground/50",
                    r.state === "count" && "font-mono text-[12px]",
                  )}
                  title={r.value || undefined}
                >
                  {r.value ? (
                    r.state === "ok" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="truncate">{r.value}</span>
                        <Check aria-hidden className="size-3 shrink-0 text-foreground" />
                      </span>
                    ) : (
                      r.value
                    )
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
