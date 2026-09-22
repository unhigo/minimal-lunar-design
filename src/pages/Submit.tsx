import { BRAND } from "@/lib/brand";
import {
  badgesFor,
  loadDraft,
  saveDraft,
  clearDraft,
  ECOSYSTEMS,
  LICENSES,
  PLATFORMS,
  PRICING_MODELS,
  SENDER_ROLES,
  SUBMIT_CATEGORIES,
  submitSchema,
  type SubmitPayload,
} from "@/lib/submit-schema";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation } from "convex/react";
import { useAction } from "convex/react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  ImagePlus,
  Loader2,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/hooks/use-page-meta";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

/**
 * Submit — the directory intake wizard.
 *
 * Six steps: identity → classification → media → pricing → description →
 * author & moderation. Everything is validated with Zod per step; the payload
 * is sent to Convex where it always lands as `status: "pending"`. A draft is
 * persisted in localStorage so a reload never loses work.
 */

const STEPS = [
  { n: 1, label: "Identidad" },
  { n: 2, label: "Clasificación" },
  { n: 3, label: "Multimedia" },
  { n: 4, label: "Precios" },
  { n: 5, label: "Descripción" },
  { n: 6, label: "Autoría" },
] as const;

type FormState = {
  title: string;
  url: string;
  logoStorageId: string | null;
  logoUrl: string | null;
  tagline: string;
  category: string;
  platforms: string[];
  ecosystems: string[];
  tags: string[];
  gallery: { storageId: string; url: string; caption?: string }[];
  thumbStorageId: string | null;
  thumbUrl: string | null;
  videoUrl: string;
  pricing: string;
  pricingDetails: string;
  license: string;
  discountEnabled: boolean;
  discountCode: string;
  discountPercent: string;
  description: string;
  features: string[];
  senderRole: string;
  authorHandle: string;
  authorLinks: string[];
  contactEmail: string;
  scheduledDate: string; // yyyy-mm-dd (optional)
};

const EMPTY: FormState = {
  title: "",
  url: "",
  logoStorageId: null,
  logoUrl: null,
  tagline: "",
  category: "",
  platforms: [],
  ecosystems: [],
  tags: [],
  gallery: [],
  thumbStorageId: null,
  thumbUrl: null,
  videoUrl: "",
  pricing: "free",
  pricingDetails: "",
  license: "commercial-attribution",
  discountEnabled: false,
  discountCode: "",
  discountPercent: "",
  description: "",
  features: ["", "", ""],
  senderRole: "creator",
  authorHandle: "",
  authorLinks: [""],
  contactEmail: "",
  scheduledDate: "",
};

/** Fields validated per step — only the ones the step owns. */
function stepFields(step: number): (keyof FormState)[] {
  switch (step) {
    case 1:
      return ["title", "url", "tagline"];
    case 2:
      return ["category"];
    case 3:
      return ["gallery", "videoUrl"];
    case 4:
      return ["pricing", "license", "discountCode", "discountPercent"];
    case 5:
      return ["description", "features"];
    case 6:
      return ["senderRole", "authorHandle", "authorLinks", "contactEmail"];
    default:
      return [];
  }
}

export default function Submit() {
  usePageMeta({
    title: `Enviar — ${BRAND.mark}`,
    description:
      "Envía una herramienta, recurso o proyecto al directorio. Revisión antes de publicar.",
    path: "/submit",
  });

  const createSubmission = useMutation(api.submissions.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const attach = useMutation(api.files.attach);
  const metaPreview = useAction(api.submissions.metaPreview);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => loadDraft<FormState>() ?? EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [autoFilling, setAutoFilling] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Persist the draft (debounced) so reloads never lose work.
  useEffect(() => {
    const t = setTimeout(() => saveDraft(form), 400);
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
  // Auto-fill via OpenGraph (server action — no CORS issues)
  // ------------------------------------------------------------------
  const autoFill = async () => {
    if (!form.url.trim()) {
      toast.error("Escribe primero la URL del recurso.");
      return;
    }
    setAutoFilling(true);
    try {
      const res = await metaPreview({ url: form.url.trim() });
      if (!res.ok) {
        toast.error("No se pudieron leer los metadatos de esa URL.");
        return;
      }
      setForm((f) => ({
        ...f,
        title: f.title || res.title || "",
        tagline: f.tagline || (res.description ?? "").slice(0, 100) || "",
        description: f.description || res.description || "",
      }));
      toast.success("Metadatos aplicados", {
        description: "Revisa título, eslogan y descripción antes de continuar.",
      });
    } finally {
      setAutoFilling(false);
    }
  };

  // ------------------------------------------------------------------
  // Image uploads (logo / thumbnail / gallery) via the shared pipeline
  // ------------------------------------------------------------------
  const uploadFile = async (
    file: File,
  ): Promise<{ storageId: string; url: string } | null> => {
    setUploading(file.name);
    try {
      const up = await uploadImage(generateUploadUrl, attach, file);
      const url = URL.createObjectURL(file);
      return { storageId: up.storageId as unknown as string, url };
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo subir la imagen.",
      );
      return null;
    } finally {
      setUploading(null);
    }
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const up = await uploadFile(file);
    if (up) setForm((f) => ({ ...f, logoStorageId: up.storageId, logoUrl: up.url }));
  };

  const handleThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const up = await uploadFile(file);
    if (up) setForm((f) => ({ ...f, thumbStorageId: up.storageId, thumbUrl: up.url }));
  };

  const handleGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const room = 4 - form.gallery.length;
    if (room <= 0) {
      toast.error("Máximo 4 imágenes en la galería.");
      return;
    }
    for (const file of files.slice(0, room)) {
      const up = await uploadFile(file);
      if (up) setForm((f) => ({ ...f, gallery: [...f.gallery, up] }));
    }
  };

  const removeGallery = (storageId: string) =>
    setForm((f) => ({
      ...f,
      gallery: f.gallery.filter((g) => g.storageId !== storageId),
    }));

  // ------------------------------------------------------------------
  // Tags (free input)
  // ------------------------------------------------------------------
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (form.tags.includes(t)) return setTagInput("");
    if (form.tags.length >= 8) {
      toast.error("Máximo 8 etiquetas.");
      return;
    }
    setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  // ------------------------------------------------------------------
  // Step validation — Zod slices
  // ------------------------------------------------------------------
  const validateStep = (target: number): boolean => {
    const fields = stepFields(target);
    if (fields.length === 0) return true;
    const partial = submitSchema.partial(
      Object.fromEntries(fields.map((f) => [f, true])) as never,
    );
    const shaped: Record<string, unknown> = {};
    for (const f of fields) shaped[f as string] = form[f];
    const res = partial.safeParse(shaped);
    if (res.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    for (const issue of res.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  };

  // Submit everything to Convex.
  const finalize = async () => {
    if (!validateStep(6)) return;
    const candidate = {
      title: form.title,
      url: form.url,
      tagline: form.tagline,
      category: form.category,
      platforms: form.platforms,
      ecosystems: form.ecosystems,
      tags: form.tags,
      gallery: form.gallery.map((g) => ({
        storageId: g.storageId as never,
        caption: g.caption,
      })),
      ...(form.logoStorageId ? { logoStorageId: form.logoStorageId as never } : {}),
      ...(form.thumbStorageId ? { thumbStorageId: form.thumbStorageId as never } : {}),
      ...(form.videoUrl.trim() ? { videoUrl: form.videoUrl.trim() } : {}),
      pricing: form.pricing,
      ...(form.pricingDetails.trim() ? { pricingDetails: form.pricingDetails.trim() } : {}),
      license: form.license,
      ...(form.discountEnabled && form.discountCode.trim()
        ? {
            discountCode: form.discountCode.trim(),
            discountPercent: Number(form.discountPercent) || undefined,
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
    };
    const parsed = submitSchema.safeParse(candidate);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(`${first.path.join(".")}: ${first.message}`);
      return;
    }
    setBusy(true);
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
      setDone(id);
      toast.success("Envío recibido", {
        description: "Queda como pendiente de revisión.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(6, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // ------------------------------------------------------------------
  // Live preview badges
  // ------------------------------------------------------------------
  const previewBadges = useMemo(
    () =>
      badgesFor({
        category: form.category || "web-apps",
        pricing: (form.pricing || "free") as SubmitPayload["pricing"],
        license: (form.license || "personal") as SubmitPayload["license"],
        senderRole: (form.senderRole || "curator") as SubmitPayload["senderRole"],
        platforms: form.platforms as SubmitPayload["platforms"],
        discountCode: form.discountEnabled ? form.discountCode : undefined,
        discountPercent:
          form.discountEnabled && form.discountPercent
            ? Number(form.discountPercent)
            : undefined,
        videoUrl: form.videoUrl || undefined,
      }),
    [form],
  );

  // ------------------------------------------------------------------
  // Success screen
  // ------------------------------------------------------------------
  if (done) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-24 text-center">
          <span className="flex size-14 items-center justify-center rounded-full border border-foreground/30">
            <Check className="size-5" />
          </span>
          <h1 className="mt-6 h1-editorial">Envío recibido</h1>
          <p className="mt-3 max-w-md text-[15px] text-muted-foreground">
            Tu propuesta quedó registrada como{" "}
            <span className="font-mono text-[12px]">pending</span> y será
            revisada antes de publicarse en el directorio. Gracias por ayudar a
            expandir el laboratorio.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/discover" className="btn-solid">
              Seguir descubriendo
            </Link>
            <button
              className="btn-outline"
              onClick={() => {
                setDone(null);
                setForm(EMPTY);
                setStep(1);
              }}
            >
              Enviar otra propuesta
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Contribuir
        </p>
        <h1 className="mt-3 h1-editorial tracking-tight">Enviar una propuesta</h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Todo envío pasa por revisión antes de entrar al directorio. Puedes
          volver cuando quieras:{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => {
              clearDraft();
              setForm(EMPTY);
              setErrors({});
              toast.info("Borrador descartado.");
            }}
          >
            descartar borrador
          </button>
        </p>

        {/* Auto-fill banner */}
        <div className="mt-8 flex flex-col gap-3 rounded-sm border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[13px] font-medium">Rellenado automático por URL</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Extrae título, descripción e imagen de OpenGraph para ahorrar tiempo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void autoFill()}
            disabled={autoFilling}
            className="btn-outline h-9 shrink-0 px-4 text-[12px]"
          >
            {autoFilling ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Globe className="size-3.5" />
            )}
            Rellenar automáticamente
          </button>
        </div>

        {/* Step indicator */}
        <ol className="mt-8 flex items-center gap-1 overflow-x-auto pb-1 font-mono text-[10px] uppercase tracking-[0.14em]">
          {STEPS.map((s) => (
            <li key={s.n} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => s.n < step && setStep(s.n)}
                disabled={s.n > step}
                aria-current={step === s.n ? "step" : undefined}
                className={cn(
                  "rounded-sm px-2 py-1 transition-colors",
                  step === s.n
                    ? "bg-foreground text-background"
                    : s.n < step
                      ? "text-foreground hover:bg-muted"
                      : "text-muted-foreground/60",
                )}
              >
                {s.n < step ? "✓ " : ""}
                {s.label}
              </button>
              {s.n < 6 && <span className="text-muted-foreground/40">/</span>}
            </li>
          ))}
        </ol>

        {/* Panels */}
        <div className="mt-6 border border-border/70 p-5 sm:p-8">
          {step === 1 && (
            <section className="space-y-6" aria-label="Paso 1: identidad">
              <header>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  01 / Identidad
                </p>
                <h2 className="mt-2 text-xl font-light">Información básica</h2>
              </header>

              <Field label="Nombre del recurso" required error={errors.title}>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="p. ej. Nyxhora Grid"
                  maxLength={80}
                  className={inputCls(!!errors.title)}
                />
              </Field>

              <Field label="URL de destino" required error={errors.url} hint="https://…">
                <input
                  value={form.url}
                  onChange={(e) => set("url", e.target.value)}
                  type="url"
                  placeholder="https://…"
                  className={inputCls(!!errors.url)}
                />
              </Field>

              <Field label="Logotipo / icono (cuadrado)" hint="SVG o PNG · máx. 8 MB">
                {form.logoUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={form.logoUrl}
                      alt="Logotipo"
                      className="size-14 rounded-sm border border-border object-contain"
                    />
                    <button
                      type="button"
                      className="btn-outline h-8 px-3 text-[12px]"
                      onClick={() =>
                        setForm((f) => ({ ...f, logoStorageId: null, logoUrl: null }))
                      }
                    >
                      <Trash2 className="size-3" /> Quitar
                    </button>
                  </div>
                ) : (
                  <UploadTile
                    busy={uploading === "logo"}
                    onClick={() => logoInputRef.current?.click()}
                    accept="image/png,image/svg+xml,image/webp"
                    label="Subir logotipo"
                  />
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => void handleLogo(e)}
                />
              </Field>

              <Field
                label="Tagline (una línea)"
                required
                error={errors.tagline}
                hint={`${form.tagline.length}/100`}
              >
                <input
                  value={form.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  maxLength={100}
                  placeholder="Qué es, en una frase."
                  className={inputCls(!!errors.tagline)}
                />
              </Field>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-6" aria-label="Paso 2: clasificación">
              <header>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  02 / Clasificación
                </p>
                <h2 className="mt-2 text-xl font-light">Categoría y ecosistema</h2>
              </header>

              <Field label="Categoría principal" required error={errors.category}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SUBMIT_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => set("category", c.id)}
                      aria-pressed={form.category === c.id}
                      className={cn(
                        "flex items-center gap-2.5 rounded-sm border p-3 text-left transition-colors",
                        form.category === c.id
                          ? "border-foreground/60 bg-muted/40"
                          : "border-border hover:border-foreground/30",
                      )}
                    >
                      <span aria-hidden>{c.emoji}</span>
                      <span className="text-[13px]">{c.label}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Plataformas / entorno" hint="Selecciona todas las que apliquen">
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => {
                    const on = form.platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          set(
                            "platforms",
                            on
                              ? form.platforms.filter((x) => x !== p)
                              : [...form.platforms, p],
                          )
                        }
                        className={chipCls(on)}
                      >
                        {on && <Check className="size-3" />}
                        {p}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Ecosistema compatible">
                <div className="flex flex-wrap gap-2">
                  {ECOSYSTEMS.map((e) => {
                    const on = form.ecosystems.includes(e);
                    return (
                      <button
                        key={e}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          set(
                            "ecosystems",
                            on
                              ? form.ecosystems.filter((x) => x !== e)
                              : [...form.ecosystems, e],
                          )
                        }
                        className={chipCls(on)}
                      >
                        {on && <Check className="size-3" />}
                        {e}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Etiquetas libres" hint="Máx. 8 · Enter para añadir">
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="tipografía, tokens, 3d…"
                    className={inputCls(false)}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn-outline h-11 shrink-0 px-4"
                  >
                    <TagIcon className="size-3.5" /> Añadir
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
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-6" aria-label="Paso 3: multimedia">
              <header>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  03 / Multimedia
                </p>
                <h2 className="mt-2 text-xl font-light">Demostración visual</h2>
              </header>

              <Field label="Galería de capturas" hint={`${form.gallery.length}/4`}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {form.gallery.map((g) => (
                    <div key={g.storageId} className="group relative">
                      <img
                        src={g.url}
                        alt={g.caption ?? "Captura"}
                        className="aspect-[4/3] w-full rounded-sm border border-border object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Quitar imagen"
                        onClick={() => removeGallery(g.storageId)}
                        className="absolute right-1.5 top-1.5 rounded-sm bg-background/90 p-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {form.gallery.length < 4 && (
                    <UploadTile
                      busy={uploading === "gallery"}
                      onClick={() => galleryInputRef.current?.click()}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      label="Añadir captura"
                      tileClassName="aspect-[4/3]"
                    />
                  )}
                </div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleGallery(e)}
                />
              </Field>

              <Field
                label="Miniatura / portada"
                hint="Horizontal, se usa en la tarjeta del directorio"
              >
                {form.thumbUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={form.thumbUrl}
                      alt="Miniatura"
                      className="h-20 w-36 rounded-sm border border-border object-cover"
                    />
                    <button
                      type="button"
                      className="btn-outline h-8 px-3 text-[12px]"
                      onClick={() =>
                        setForm((f) => ({ ...f, thumbStorageId: null, thumbUrl: null }))
                      }
                    >
                      <Trash2 className="size-3" /> Quitar
                    </button>
                  </div>
                ) : (
                  <UploadTile
                    busy={uploading === "thumb"}
                    onClick={() => thumbInputRef.current?.click()}
                    accept="image/png,image/jpeg,image/webp"
                    label="Subir miniatura"
                  />
                )}
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void handleThumb(e)}
                />
              </Field>

              <Field label="Vídeo demostrativo" hint="URL de Loom, YouTube o Vimeo">
                <input
                  value={form.videoUrl}
                  onChange={(e) => set("videoUrl", e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  className={inputCls(false)}
                />
              </Field>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-6" aria-label="Paso 4: precios">
              <header>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  04 / Pricing
                </p>
                <h2 className="mt-2 text-xl font-light">Modelo y licencia</h2>
              </header>

              <Field label="Modelo de precios" required>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PRICING_MODELS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => set("pricing", p.id)}
                      aria-pressed={form.pricing === p.id}
                      className={cn(
                        "rounded-sm border p-3 text-left text-[13px] transition-colors",
                        form.pricing === p.id
                          ? "border-foreground/60 bg-muted/40"
                          : "border-border hover:border-foreground/30",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label="Rango de precios / nota"
                hint='Ej. "Desde $12/mes" o "Plan free disponible"'
              >
                <input
                  value={form.pricingDetails}
                  onChange={(e) => set("pricingDetails", e.target.value)}
                  maxLength={80}
                  className={inputCls(false)}
                />
              </Field>

              <Field label="Tipo de licencia" required>
                <div className="grid gap-2">
                  {LICENSES.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => set("license", l.id)}
                      aria-pressed={form.license === l.id}
                      className={cn(
                        "rounded-sm border p-3 text-left text-[13px] transition-colors",
                        form.license === l.id
                          ? "border-foreground/60 bg-muted/40"
                          : "border-border hover:border-foreground/30",
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="rounded-sm border border-border/70 p-4">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <span>
                    <span className="block text-[13px] font-medium">
                      Descuento exclusivo para la comunidad
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted-foreground">
                      Se mostrará como badge en la ficha del recurso.
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
                    <Field label="Código de cupón">
                      <input
                        value={form.discountCode}
                        onChange={(e) =>
                          set("discountCode", e.target.value.toUpperCase())
                        }
                        placeholder="LAB10"
                        maxLength={40}
                        className={inputCls(false, "font-mono uppercase")}
                      />
                    </Field>
                    <Field label="Descuento (%)">
                      <input
                        value={form.discountPercent}
                        onChange={(e) =>
                          set(
                            "discountPercent",
                            e.target.value.replace(/[^0-9]/g, "").slice(0, 3),
                          )
                        }
                        placeholder="10"
                        inputMode="numeric"
                        className={inputCls(false, "font-mono")}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="space-y-6" aria-label="Paso 5: descripción">
              <header>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  05 / Descripción
                </p>
                <h2 className="mt-2 text-xl font-light">Detalle y características</h2>
              </header>

              <Field
                label="Descripción detallada"
                required
                error={errors.description}
                hint={`${form.description.length}/4000 · Markdown plano permitido`}
              >
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={8}
                  maxLength={4000}
                  placeholder="Qué hace, para quién es, qué lo hace distinto…"
                  className={cn(
                    inputCls(!!errors.description),
                    "min-h-40 resize-y leading-relaxed",
                  )}
                />
              </Field>

              <Field
                label="Características clave"
                required
                error={errors.features}
                hint="Entre 3 y 5 puntos"
              >
                <div className="space-y-2">
                  {form.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 shrink-0 font-mono text-[10px] text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <input
                        value={f}
                        onChange={(e) =>
                          set(
                            "features",
                            form.features.map((x, j) =>
                              j === i ? e.target.value : x,
                            ),
                          )
                        }
                        maxLength={120}
                        placeholder="Qué puede hacer el usuario con ello"
                        className={inputCls(false)}
                      />
                      {form.features.length > 3 && (
                        <button
                          type="button"
                          aria-label="Quitar punto"
                          onClick={() =>
                            set(
                              "features",
                              form.features.filter((_, j) => j !== i),
                            )
                          }
                          className="shrink-0 text-muted-foreground hover:text-foreground"
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
                    + Añadir punto
                  </button>
                )}
              </Field>
            </section>
          )}

          {step === 6 && (
            <section className="space-y-6" aria-label="Paso 6: autoría">
              <header>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  06 / Autoría
                </p>
                <h2 className="mt-2 text-xl font-light">Creador y contacto</h2>
              </header>

              <Field label="Rol del remitente" required>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SENDER_ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => set("senderRole", r.id)}
                      aria-pressed={form.senderRole === r.id}
                      className={cn(
                        "rounded-sm border p-3 text-left text-[13px] transition-colors",
                        form.senderRole === r.id
                          ? "border-foreground/60 bg-muted/40"
                          : "border-border hover:border-foreground/30",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label="Nombre o handle del autor"
                required
                error={errors.authorHandle}
                hint="@usuario"
              >
                <input
                  value={form.authorHandle}
                  onChange={(e) => set("authorHandle", e.target.value)}
                  placeholder="@estudio"
                  maxLength={60}
                  className={inputCls(!!errors.authorHandle)}
                />
              </Field>

              <Field label="Enlaces de autor" hint="Web, portfolio o redes">
                {form.authorLinks.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={l}
                      onChange={(e) =>
                        set(
                          "authorLinks",
                          form.authorLinks.map((x, j) =>
                            j === i ? e.target.value : x,
                          ),
                        )
                      }
                      placeholder="https://…"
                      className={inputCls(false)}
                    />
                    {form.authorLinks.length > 1 && (
                      <button
                        type="button"
                        aria-label="Quitar enlace"
                        onClick={() =>
                          set(
                            "authorLinks",
                            form.authorLinks.filter((_, j) => j !== i),
                          )
                        }
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
                {form.authorLinks.length < 4 && (
                  <button
                    type="button"
                    className="btn-outline mt-2 h-9 px-4 text-[12px]"
                    onClick={() => set("authorLinks", [...form.authorLinks, ""])}
                  >
                    + Añadir enlace
                  </button>
                )}
              </Field>

              <Field
                label="Email de contacto"
                required
                error={errors.contactEmail}
                hint="Privado — solo lo ve el equipo de moderación"
              >
                <input
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  type="email"
                  placeholder="tu@correo.com"
                  className={inputCls(!!errors.contactEmail)}
                />
              </Field>

              <Field
                label="Programar lanzamiento"
                hint="Opcional — fecha futura de publicación"
              >
                <input
                  value={form.scheduledDate}
                  onChange={(e) => set("scheduledDate", e.target.value)}
                  type="date"
                  className={inputCls(false, "font-mono")}
                />
              </Field>
            </section>
          )}
        </div>

        {/* Live badge preview */}
        {previewBadges.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Insignias previstas:
            </span>
            {previewBadges.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                <span aria-hidden>{b.glyph}</span> {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-5">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="btn-outline disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowLeft className="size-4" /> Anterior
          </button>
          <span className="font-mono text-[11px] text-muted-foreground">
            {String(step).padStart(2, "0")} / 06
          </span>
          {step < 6 ? (
            <button type="button" onClick={goNext} className="btn-solid">
              Siguiente <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void finalize()}
              disabled={busy}
              className="btn-solid disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Enviar propuesta
            </button>
          )}
        </div>

        <p className="mt-4 text-[12px] text-muted-foreground">
          ¿Es un recurso descargable que quieres vender ya? Usa{" "}
          <Link
            to="/upload"
            className="underline underline-offset-2 hover:text-foreground"
          >
            la subida directa
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small local primitives
// ---------------------------------------------------------------------------

function inputCls(invalid: boolean, extra = "") {
  return cn(
    "h-11 w-full rounded-sm border bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground",
    invalid ? "border-destructive" : "border-border focus:border-foreground/40",
    extra,
  );
}

function chipCls(on: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[12px] transition-colors",
    on
      ? "border-foreground/60 bg-muted/40"
      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
          {required && <span className="ml-1 text-foreground">*</span>}
        </label>
        {hint && (
          <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}

function UploadTile({
  busy,
  onClick,
  label,
  accept,
  tileClassName,
}: {
  busy: boolean;
  onClick: () => void;
  label: string;
  accept: string;
  tileClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} (${accept})`}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed border-border/70 px-4 py-8 text-center transition-colors hover:border-foreground/40",
        tileClassName,
      )}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <ImagePlus className="size-4 text-muted-foreground" />
      )}
      <span className="text-[12px] text-muted-foreground">
        {busy ? "Subiendo…" : label}
      </span>
    </button>
  );
}
