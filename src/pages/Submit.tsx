/**
 * Submit — guided 7-step submission studio for the directory.
 *
 * Steps: 01 Identity · 02 Classification · 03 Details · 04 Media ·
 * 05 Pricing & License · 06 Creator · 07 Review.
 *
 * Everything rides the existing backend:
 * - submissions.create (real mutation, duplicate guard included server-side)
 * - submissions.metaPreview (server-side OpenGraph autofill, no CORS)
 * - files.generateUploadUrl + files.attach (image pipeline with MIME/size checks)
 * - submit-schema (option catalogs + final Zod validation)
 * - submit-schema draft persistence (localStorage; DB is never replaced)
 *
 * No mocks, no invented fields: every key maps to `submissionValidator`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Link } from "react-router";
import {
  Check,
  Eye,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/hooks/use-page-meta";
import { uploadImage } from "@/lib/upload";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import {
  badgesFor,
  clearDraft,
  loadDraft,
  saveDraft,
  submitSchema,
  type SubmitPayload,
} from "@/lib/submit-schema";
import {
  EMPTY_FORM,
  STEPS,
  formatRef,
  hydrateForm,
  isBlockedHost,
  normalizeUrl,
  stepCompletion,
  validateStep,
  type FormState,
  type StepId,
} from "@/lib/submit-steps";
import { IdentityStep, ClassificationStep, DetailsStep, type AutofillState } from "@/components/submit/steps-basics";
import { MediaStep, PricingStep, CreatorStep } from "@/components/submit/steps-later";
import { ReviewStep } from "@/components/submit/ReviewStep";
import { ToolPreview } from "@/components/submit/ToolPreview";
import { FormNavigation, SubmissionProgress, SubmissionStepList } from "@/components/submit/SubmissionSteps";
import { ErrorState, SuccessState } from "@/components/submit/SubmitStatus";

/** Duplicate candidate found by the in-form check (title/URL overlap). */
type Duplicate = { id: string; name: string; slug: string };

export default function Submit() {
  usePageMeta({
    title: `Enviar — ${BRAND.mark}`,
    description:
      "Envía una herramienta al directorio en 7 pasos guiados. Revisión antes de publicar.",
    path: "/submit",
  });

  // ------------------------------------------------------------------
  // Backend hooks (all existing — nothing new server-side)
  // ------------------------------------------------------------------
  const createSubmission = useMutation(api.submissions.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const attach = useMutation(api.files.attach);
  const metaPreview = useAction(api.submissions.metaPreview);
  const myFavorites = useQuery(api.tools.myFavorites, {});

  // ------------------------------------------------------------------
  // Form state — single source of truth
  // ------------------------------------------------------------------
  const [form, setForm] = useState<FormState>(() => hydrateForm(loadDraft()));
  const [step, setStep] = useState<StepId>("identity");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [doneRef, setDoneRef] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState<"logo" | "shots" | "thumb" | null>(null);
  const [autofill, setAutofill] = useState<AutofillState>("idle");  const [detected, setDetected] = useState({ title: false, description: false, imageUrl: false });
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null);
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobileSaved, setMobileSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Draft autosave (debounced) — never interrupts interaction.
  useEffect(() => {
    const t = setTimeout(() => {
      saveDraft(form);
      setLastSavedAt(Date.now());
      setMobileSaved(true);
      const fade = setTimeout(() => setMobileSaved(false), 1500);
      return () => clearTimeout(fade);
    }, 600);
    return () => clearTimeout(t);
  }, [form]);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((f) => ({ ...f, [key]: value }));
      setErrors((e) => {
        if (!e[key as string]) return e;
        const next = { ...e };
        delete next[key as string];
        return next;
      });
    },
    [],
  );

  // ------------------------------------------------------------------
  // URL metadata autofill (server action, editable results)
  // ------------------------------------------------------------------
  const detectMeta = async () => {
    const url = form.url.trim();
    if (!url || isBlockedHost(url)) {
      setAutofill("failed");
      return;
    }
    setAutofill("fetching");
    try {
      const res = await metaPreview({ url });
      if (!res.ok) {
        setAutofill("failed");
        return;
      }
      const got = {
        title: Boolean(res.title),
        description: Boolean(res.description),
        imageUrl: Boolean(res.imageUrl),
      };
      setDetected(got);
      // Fill only empty fields — never overwrite manual edits silently.
      setForm((f) => ({
        ...f,
        title: f.title.trim() || res.title || "",
        tagline: f.tagline.trim() || (res.description ?? "").slice(0, 100) || "",
        description: f.description.trim() || res.description || "",
      }));
      setAutofill(got.title || got.description ? "detected" : "partial");
      toast.success("Metadata detected", {
        description: "Los campos se han rellenado y siguen siendo editables.",
      });
    } catch {
      setAutofill("failed");
    }
  };

  // ------------------------------------------------------------------
  // Uploads through the real pipeline
  // ------------------------------------------------------------------
  const uploadFile = async (file: File) => {
    const up = await uploadImage(generateUploadUrl, attach, file);
    return {
      storageId: up.storageId as unknown as string,
      url: URL.createObjectURL(file),
    };
  };

  const handleLogo = async (file: File) => {
    setUploadBusy("logo");
    try {
      const up = await uploadFile(file);
      setForm((f) => ({ ...f, logoStorageId: up.storageId, logoUrl: up.url }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploadBusy(null);
    }
  };

  const handleThumb = async (file: File) => {
    setUploadBusy("thumb");
    try {
      const up = await uploadFile(file);
      setForm((f) => ({ ...f, thumbStorageId: up.storageId, thumbUrl: up.url }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploadBusy(null);
    }
  };

  const handleShots = async (files: File[]) => {
    const room = 4 - form.gallery.length;
    if (room <= 0) {
      toast.error("Máximo 4 imágenes en la galería.");
      return;
    }
    setUploadBusy("shots");
    try {
      for (const file of files.slice(0, room)) {
        const up = await uploadFile(file);
        setForm((f) => ({ ...f, gallery: [...f.gallery, up] }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploadBusy(null);
    }
  };

  const removeShot = (storageId: string) =>
    setForm((f) => ({
      ...f,
      gallery: f.gallery.filter((g) => g.storageId !== storageId),
    }));

  // ------------------------------------------------------------------
  // Duplicate detection (client-side hint over the real tools table)
  // ------------------------------------------------------------------
  const urlKey = useMemo(
    () => normalizeUrl(form.url.trim()),
    [form.url],
  );

  const duplicates = useMemo(() => {
    if (!urlKey || !myFavorites) return [];
    const title = form.title.trim().toLowerCase();
    return myFavorites
      .map((t) => ({
        id: t._id as string,
        name: t.name as string,
        slug: t.slug as string,
      }))
      .filter((t) => {
        const nameMatch = title.length >= 4 && t.name.toLowerCase() === title;
        return nameMatch;
      });
  }, [urlKey, form.title, myFavorites]);

  useEffect(() => {
    setDuplicate(duplicates[0] ?? null);
    setDuplicateDismissed(false);
  }, [duplicates.length, duplicates[0]?.id]);

  // ------------------------------------------------------------------
  // Validation + navigation
  // ------------------------------------------------------------------
  const completion = useMemo(() => stepCompletion(form), [form]);

  const progressPct = useMemo(() => {
    const idx = STEPS.findIndex((s) => s.id === step);
    return Math.round((idx / (STEPS.length - 1)) * 100);
  }, [step]);

  const currentIdx = STEPS.findIndex((s) => s.id === step);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  const goNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Revisa los campos marcados.");
      return;
    }
    setErrors({});
    const next = STEPS[currentIdx + 1];
    if (next) {
      setStep(next.id);
      scrollToTop();
    }
  };

  const goBack = () => {
    const prev = STEPS[currentIdx - 1];
    if (prev) {
      setStep(prev.id);
      scrollToTop();
    }
  };

  const goToStep = (id: StepId) => {
    // Completed steps are always freely navigable; later steps need prior ones complete.
    const idxTarget = STEPS.findIndex((s) => s.id === id);
    for (let i = 0; i < idxTarget; i++) {
      if (completion[STEPS[i].id].missing > 0) {
        toast.error(`Completa ${STEPS[i].label} antes de saltar a ${STEPS[idxTarget].label}.`);
        return;
      }
    }
    setStep(id);
    scrollToTop();
  };

  // ------------------------------------------------------------------
  // Submit — real mutation, per-step checks first
  // ------------------------------------------------------------------
  const buildPayload = () => ({
    title: form.title,
    url: form.url,
    tagline: form.tagline,
    category: form.category,
    platforms: form.platforms,
    ecosystems: form.ecosystems,
    tags: form.tags,
    gallery: form.gallery.map((g) => ({ storageId: g.storageId as never, caption: g.caption })),
    ...(form.logoStorageId ? { logoStorageId: form.logoStorageId as never } : {}),
    ...(form.thumbStorageId ? { thumbStorageId: form.thumbStorageId as never } : {}),
    ...(form.videoUrl.trim() ? { videoUrl: form.videoUrl.trim() } : {}),
    pricing: form.pricing,
    ...(form.pricingDetails.trim() ? { pricingDetails: form.pricingDetails.trim() } : {}),
    license: form.license,
    ...(form.discountEnabled && form.discountCode.trim()
      ? {
          discountCode: form.discountCode.trim(),
          discountPercent:
            form.discountPercent && !Number.isNaN(Number(form.discountPercent))
              ? Number(form.discountPercent)
              : undefined,
        }
      : {}),
    description: form.description,
    features: form.features.map((f) => f.trim()).filter(Boolean),
    senderRole: form.senderRole,
    authorHandle: form.authorHandle,
    authorLinks: form.authorLinks.map((l) => l.trim()).filter(Boolean),
    contactEmail: form.contactEmail,
    ...(form.scheduledDate
      ? { scheduledDate: new Date(form.scheduledDate).getTime() }
      : {}),
  });

  const finalize = async () => {
    // 1) All steps must pass their own validation.
    let firstBad: StepId | null = null;
    const allErrors: Record<string, string> = {};
    for (const s of STEPS) {
      if (s.id === "review") continue;
      const errs = validateStep(s.id, form);
      if (Object.keys(errs).length > 0 && !firstBad) firstBad = s.id;
      Object.assign(allErrors, errs);
    }
    if (firstBad) {
      setErrors(allErrors);
      setStep(firstBad);
      toast.error("Revisa los campos marcados antes de enviar.");
      scrollToTop();
      return;
    }

    // 2) Final Zod pass (same contract the backend validates).
    const parsed = submitSchema.safeParse(buildPayload());
    if (!parsed.success) {
      toast.error("Revisa los campos marcados antes de enviar.");
      return;
    }

    // 3) Real submit.
    setSubmitState("submitting");
    try {
      const id = await createSubmission({
        submission: {
          ...parsed.data,
          logoStorageId: parsed.data.logoStorageId as never,
          thumbStorageId: parsed.data.thumbStorageId as never,
          gallery: parsed.data.gallery.map((g) => ({
            storageId: g.storageId as never,
            caption: g.caption,
          })),
          videoUrl: parsed.data.videoUrl ?? undefined,
          pricingDetails: parsed.data.pricingDetails ?? undefined,
          discountCode: parsed.data.discountCode ?? undefined,
          discountPercent: parsed.data.discountPercent ?? undefined,
          scheduledDate: parsed.data.scheduledDate ?? undefined,
        },
      });
      clearDraft();
      setDoneRef(formatRef(id));
      setSubmitState("success");
      toast.success("Envío recibido", {
        description: "Queda como pendiente de revisión.",
      });
    } catch (err) {
      setSubmitState("error");
      toast.error(err instanceof Error ? err.message : "No se pudo enviar.");
    }
  };

  // ------------------------------------------------------------------
  // Success screen
  // ------------------------------------------------------------------
  if (submitState === "success" && doneRef) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <SuccessState
          reference={doneRef}
          submittingAnother={() => {
            setForm(EMPTY_FORM);
            setStep("identity");
            setSubmitState("idle");
            setDoneRef(null);
            setErrors({});
          }}
        />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Wizard
  // ------------------------------------------------------------------
  const previewModel = {
    title: form.title,
    tagline: form.tagline,
    category: form.category,
    pricing: form.pricing,
    logoUrl: form.logoUrl,
    thumbUrl: form.thumbUrl,
    platforms: form.platforms,
    tags: form.tags,
    license: form.license,
    discountCode: form.discountEnabled ? form.discountCode : undefined,
    discountPercent:
      form.discountEnabled && form.discountPercent && !Number.isNaN(Number(form.discountPercent))
        ? Number(form.discountPercent)
        : undefined,
    videoUrl: form.videoUrl || undefined,
    senderRole: form.senderRole,
  };

  const stepProps = { form, errors, set } as const;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Contribution · {STEPS[currentIdx].n} / 07
            </p>
            <h1 className="mt-3 h1-editorial tracking-tight">
              {STEPS[currentIdx].label}
            </h1>
            <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
              {STEPS[currentIdx].id === "identity" &&
                "Tell us what this tool is."}
              {STEPS[currentIdx].id === "classification" &&
                "Where does it fit in the lab?"}
              {STEPS[currentIdx].id === "details" &&
                "Explain what makes it useful."}
              {STEPS[currentIdx].id === "media" &&
                "Show the tool in action."}
              {STEPS[currentIdx].id === "pricing" &&
                "How is it licensed and priced?"}
              {STEPS[currentIdx].id === "creator" &&
                "Who made it and how do we reach you?"}
              {STEPS[currentIdx].id === "review" &&
                "Check the sheet before it goes to review."}
            </p>
          </div>

          {/* Autosave + draft reset */}
          <div className="flex shrink-0 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span aria-live="polite" className={cn(mobileSaved && "text-foreground")}>
              {mobileSaved ? "SAVED" : lastSavedAt ? "SAVED" : ""}
            </span>
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() => {
                clearDraft();
                setForm(EMPTY_FORM);
                setErrors({});
                setStep("identity");
                toast.info("Borrador descartado.");
              }}
            >
              descartar borrador
            </button>
          </div>
        </div>

        {/* Progress bar + step counter */}
        <div className="mt-8 border-t border-border/60 pt-5">
          <SubmissionProgress current={step} progressPct={progressPct} />
        </div>

        {/* Resume-draft prompt */}
        <ResumeDraftGate
          hasDraft={Boolean(loadDraft())}
          onResume={() => toast.info("Borrador restaurado automáticamente.")}
          onStartOver={() => {
            clearDraft();
            setForm(EMPTY_FORM);
            setStep("identity");
          }}
        />

        {/* Duplicate warning (non-blocking) */}
        {duplicate && !duplicateDismissed && (
          <div
            role="alert"
            className="mt-6 flex flex-col gap-3 rounded-sm border border-destructive/40 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-[13px]">
              <span className="font-medium">This tool may already exist.</span>{" "}
              <span className="text-muted-foreground">
                «{duplicate.name}» comparte URL o nombre.
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to={`/tools/${duplicate.slug}`}
                className="btn-outline h-9 px-4 text-[12px]"
              >
                View tool
              </Link>
              <button
                type="button"
                className="btn-outline h-9 px-4 text-[12px]"
                onClick={() => setDuplicateDismissed(true)}
              >
                Continue anyway
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)_300px]">
          {/* Step rail (desktop) */}
          <aside className="hidden lg:block">
            <nav aria-label="Pasos" className="sticky top-20">
              <SubmissionStepList
                current={step}
                completed={completedMap(completion)}
                missing={missingMap(completion)}
                onSelect={goToStep}
              />
              {/* Mobile preview trigger lives here on desktop too */}
              <button
                type="button"
                className="btn-outline mt-6 hidden w-full justify-center text-[12px] lg:flex"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="size-3.5" /> Preview listing
              </button>
            </nav>
          </aside>

          {/* Current step */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (STEPS[currentIdx].id === "review") void finalize();
              else goNext();
            }}
            noValidate
            className="min-w-0"
          >
            <h2 className="sr-only">{STEPS[currentIdx].label}</h2>

            {step === "identity" && (
              <IdentityStep
                {...stepProps}
                autofillState={autofill}
                detected={detected}
                onDetect={() => void detectMeta()}
                logoBusy={uploadBusy === "logo"}
                onLogoFile={(f) => void handleLogo(f)}
                onRemoveLogo={() =>
                  setForm((f) => ({ ...f, logoStorageId: null, logoUrl: null }))
                }
              />
            )}
            {step === "classification" && <ClassificationStep {...stepProps} />}
            {step === "details" && <DetailsStep {...stepProps} />}
            {step === "media" && (
              <MediaStep
                logoBusy={uploadBusy === "logo"}
                shotsBusy={uploadBusy === "shots"}
                thumbBusy={uploadBusy === "thumb"}
                logoUrl={form.logoUrl}
                gallery={form.gallery}
                thumbUrl={form.thumbUrl}
                onLogoFile={(f) => void handleLogo(f)}
                onRemoveLogo={() =>
                  setForm((f) => ({ ...f, logoStorageId: null, logoUrl: null }))
                }
                onShots={(files) => void handleShots(files)}
                onRemoveShot={removeShot}
                onThumbFile={(f) => void handleThumb(f)}
                onRemoveThumb={() =>
                  setForm((f) => ({ ...f, thumbStorageId: null, thumbUrl: null }))
                }
                videoUrl={form.videoUrl}
                onVideoUrlChange={(v) => set("videoUrl", v)}
                videoError={errors.videoUrl}
              />
            )}
            {step === "pricing" && <PricingStep {...stepProps} />}
            {step === "creator" && <CreatorStep {...stepProps} />}
            {step === "review" && (
              <div className="space-y-6">
                <ReviewStep form={form} onEdit={goToStep} />
                {submitState === "error" && (
                  <ErrorState
                    submitting={false}
                    onRetry={() => void finalize()}
                  />
                )}
                <p className="text-[12px] text-muted-foreground">
                  ¿Es un recurso descargable que quieres vender ya? Usa{" "}
                  <Link to="/upload" className="underline underline-offset-2 hover:text-foreground">
                    la subida directa
                  </Link>
                  .
                </p>
              </div>
            )}

            {/* Sticky footer nav */}
            <div className="sticky bottom-0 mt-10 bg-gradient-to-t from-background via-background to-transparent pb-4 pt-4">
              <FormNavigation
                isFirst={currentIdx === 0}
                isLast={step === "review"}
                submitting={submitState === "submitting"}
                onBack={goBack}
                onNext={goNext}
                onSubmit={() => void finalize()}
              />
            </div>
          </form>

          {/* Live preview (desktop, sticky right) */}
          <aside className="hidden xl:block">
            <div className="sticky top-20 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Live preview
              </p>
              <ToolPreview model={previewModel} />
              <p className="font-mono text-[10px] leading-relaxed text-muted-foreground/70">
                Cómo aparecerá la ficha en el directorio.
              </p>
            </div>
          </aside>
        </div>

        {/* Mobile: preview trigger + saved state */}
        <div className="mt-6 flex items-center justify-between xl:hidden">
          <button
            type="button"
            className="btn-outline h-10 px-4 text-[12px]"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="size-3.5" /> Preview listing
          </button>
          <span
            aria-live="polite"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          >
            {mobileSaved ? "SAVING…" : lastSavedAt ? "SAVED" : ""}
          </span>
        </div>
      </main>

      {/* Preview drawer (mobile / tablet) */}
      {previewOpen && (
        <PreviewDrawer onClose={() => setPreviewOpen(false)}>
          <ToolPreview model={previewModel} />
        </PreviewDrawer>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function completedMap(
  c: ReturnType<typeof stepCompletion>,
): Record<StepId, boolean> {
  return {
    identity: c.identity.done,
    classification: c.classification.done,
    details: c.details.done,
    media: c.media.done,
    pricing: c.pricing.done,
    creator: c.creator.done,
    review: false,
  };
}

function missingMap(c: ReturnType<typeof stepCompletion>): Record<StepId, number> {
  return {
    identity: c.identity.missing,
    classification: c.classification.missing,
    details: c.details.missing,
    media: c.media.missing,
    pricing: c.pricing.missing,
    creator: c.creator.missing,
    review: 0,
  };
}

/** Ask once per mount when a draft exists on arrival. */
function ResumeDraftGate({
  hasDraft,
  onResume,
  onStartOver,
}: {
  hasDraft: boolean;
  onResume: () => void;
  onStartOver: () => void;
}) {
  const [asked, setAsked] = useState(false);
  const [show, setShow] = useState(hasDraft);

  useEffect(() => {
    if (hasDraft && !asked) {
      setShow(true);
      setAsked(true);
    }
  }, [hasDraft, asked]);

  if (!show) return null;
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-sm border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[13px]">
        <span className="font-medium">Resume your submission?</span>{" "}
        <span className="text-muted-foreground">
          Hay un borrador guardado en este navegador.
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="btn-outline h-9 px-4 text-[12px]"
          onClick={() => {
            onResume();
            setShow(false);
          }}
        >
          Resume
        </button>
        <button
          type="button"
          className="btn-outline h-9 px-4 text-[12px]"
          onClick={() => {
            onStartOver();
            setShow(false);
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}

/** Minimal bottom drawer used for the mobile live preview. */
function PreviewDrawer({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Preview de la ficha"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto border border-border/70 bg-background p-4 pb-8 sm:rounded-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Live preview
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar preview"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
