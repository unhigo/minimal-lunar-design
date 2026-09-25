/**
 * Submit — single-page intake form for the directory.
 *
 * Seven sections (01 Identidad → 07 Revisión) are stacked on ONE page with
 * no wizard jumps: the user scrolls through them, guided by a sticky index.
 * All sections are validated together on submit; each field shows inline
 * Spanish error messages. Draft persistence keeps work across reloads.
 */

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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { Link } from "react-router";
import {
  Check,
  Globe,
  ImagePlus,
  Loader2,
  Send,
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

/** Merge a persisted draft: tolerate schema drift from older drafts. */
function hydrateDraft(): FormState {
  const d = loadDraft<Partial<FormState>>();
  if (!d) return EMPTY;
  return {
    ...EMPTY,
    ...d,
    platforms: Array.isArray(d.platforms) ? d.platforms : [],
    ecosystems: Array.isArray(d.ecosystems) ? d.ecosystems : [],
    tags: Array.isArray(d.tags) ? d.tags : [],
    gallery: Array.isArray(d.gallery) ? d.gallery : [],
    features:
      Array.isArray(d.features) && d.features.length >= 3
        ? d.features
        : ["", "", ""],
    authorLinks: Array.isArray(d.authorLinks) && d.authorLinks.length
      ? d.authorLinks
      : [""],
  };
}

/** Sections shown in the sticky index; ids anchor-scroll on click. */
const SECTIONS = [
  { id: "identidad", n: "01", label: "Identidad" },
  { id: "clasificacion", n: "02", label: "Clasificación" },
  { id: "multimedia", n: "03", label: "Multimedia" },
  { id: "pricing", n: "04", label: "Precios" },
  { id: "descripcion", n: "05", label: "Descripción" },
  { id: "autoria", n: "06", label: "Autoría" },
  { id: "revision", n: "07", label: "Revisión" },
] as const;

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

  const [form, setForm] = useState<FormState>(hydrateDraft);
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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ------------------------------------------------------------------
  // Auto-fill via OpenGraph (server action — no CORS issues)
  // ------------------------------------------------------------------
  const autoFill = async () => {
    if (!form.url.trim()) {
      toast.error("Escribe primero la URL del recurso (sección 01).");
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
        description: "Revisa título, eslogan y descripción antes de enviar.",
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
  // Validation — whole form, mapped to per-field Spanish messages
  // ------------------------------------------------------------------
  const FIELD_SECTION: Record<string, string> = {
    title: "identidad",
    url: "identidad",
    tagline: "identidad",
    category: "clasificacion",
    platforms: "clasificacion",
    ecosystems: "clasificacion",
    tags: "clasificacion",
    gallery: "multimedia",
    videoUrl: "multimedia",
    pricing: "pricing",
    license: "pricing",
    discountCode: "pricing",
    discountPercent: "pricing",
    description: "descripcion",
    features: "descripcion",
    senderRole: "autoria",
    authorHandle: "autoria",
    authorLinks: "autoria",
    contactEmail: "autoria",
  };

  const FIELD_LABEL: Record<string, string> = {
    title: "Nombre del recurso",
    url: "URL de destino",
    tagline: "Tagline",
    category: "Categoría principal",
    description: "Descripción detallada",
    features: "Características clave",
    contactEmail: "Email de contacto",
    authorHandle: "Nombre o handle del autor",
  };

  const buildPayload = () => ({
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
    ...(form.scheduledDate ? { scheduledDate: new Date(form.scheduledDate).getTime() } : {}),
  });

  const finalize = async () => {
    const parsed = submitSchema.safeParse(buildPayload());
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (!next[key]) {
          next[key] = FIELD_LABEL[key]
            ? `${FIELD_LABEL[key]}: ${issue.message}`
            : issue.message;
        }
      }
      setErrors(next);
      const firstKey = String(parsed.error.issues[0].path[0] ?? "");
      const section = FIELD_SECTION[firstKey];
      if (section) scrollToSection(section);
      toast.error("Revisa los campos marcados antes de enviar.");
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

  // Live preview badges
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
          form.discountEnabled && form.discountPercent && !Number.isNaN(Number(form.discountPercent))
            ? Number(form.discountPercent)
            : undefined,
        videoUrl: form.videoUrl || undefined,
      }),
    [form],
  );

  // Completion counters per section (drives the index checkmarks).
  const sectionDone: Record<string, boolean> = useMemo(() => {
    const check = {
      identidad: Boolean(form.title.trim() && form.url.trim() && form.tagline.trim()),
      clasificacion: Boolean(form.category),
      multimedia: true, // optional section
      pricing: Boolean(form.pricing && form.license),
      descripcion: Boolean(
        form.description.trim().length >= 30 &&
          form.features.filter((f) => f.trim()).length >= 3,
      ),
      autoria: Boolean(form.authorHandle.trim() && form.contactEmail.trim()),
      revision: false,
    };
    return check;
  }, [form]);

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
                setErrors({});
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Contribuir
        </p>
        <h1 className="mt-3 h1-editorial tracking-tight">Enviar una propuesta</h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Todo envío pasa por revisión antes de entrar al directorio. El
          formulario se guarda solo:{" "}
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

        <div className="mt-10 grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
          {/* Sticky section index (desktop) */}
          <aside className="hidden lg:block">
            <nav
              aria-label="Secciones del formulario"
              className="sticky top-20 space-y-0.5"
            >
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left font-mono text-[11px] transition-colors",
                    errors && Object.keys(errors).length > 0
                      ? "text-muted-foreground hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{s.n}</span>
                  <span className="flex-1">{s.label}</span>
                  {sectionDone[s.id] && <Check className="size-3 text-foreground" />}
                </button>
              ))}
            </nav>
          </aside>

          {/* Sections */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void finalize();
            }}
            noValidate
            className="space-y-10"
          >
            {/* 01 — Identidad */}
            <Section id="identidad" n="01" title="Información básica">
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
            </Section>

            {/* 02 — Clasificación */}
            <Section id="clasificacion" n="02" title="Categoría y ecosistema">
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
                      <span
                        aria-hidden
                        className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                      >
                        {c.glyph}
                      </span>
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
            </Section>

            {/* 03 — Multimedia */}
            <Section id="multimedia" n="03" title="Demostración visual">
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

              <Field label="Vídeo demostrativo" hint="URL de Loom, YouTube o Vimeo" error={errors.videoUrl}>
                <input
                  value={form.videoUrl}
                  onChange={(e) => set("videoUrl", e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  className={inputCls(!!errors.videoUrl)}
                />
              </Field>
            </Section>

            {/* 04 — Precios */}
            <Section id="pricing" n="04" title="Modelo y licencia">
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
                    <Field label="Código de cupón" error={errors.discountCode}>
                      <input
                        value={form.discountCode}
                        onChange={(e) =>
                          set("discountCode", e.target.value.toUpperCase())
                        }
                        placeholder="LAB10"
                        maxLength={40}
                        className={inputCls(!!errors.discountCode, "font-mono uppercase")}
                      />
                    </Field>
                    <Field label="Descuento (%)" error={errors.discountPercent}>
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
                        className={inputCls(!!errors.discountPercent, "font-mono")}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </Section>

            {/* 05 — Descripción */}
            <Section id="descripcion" n="05" title="Detalle y características">
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
            </Section>

            {/* 06 — Autoría */}
            <Section id="autoria" n="06" title="Creador y contacto">
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

              <Field label="Enlaces de autor" hint="Web, portfolio o redes" error={errors.authorLinks}>
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
                      placeholder="https://… (opcional)"
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
            </Section>

            {/* 07 — Revisión */}
            <Section id="revision" n="07" title="Revisión y envío">
              <div className="grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
                <SummaryRow label="Nombre" value={form.title || "—"} />
                <SummaryRow label="URL" value={form.url || "—"} mono />
                <SummaryRow
                  label="Categoría"
                  value={
                    SUBMIT_CATEGORIES.find((c) => c.id === form.category)?.label ?? "—"
                  }
                />
                <SummaryRow
                  label="Precios"
                  value={
                    `${PRICING_MODELS.find((p) => p.id === form.pricing)?.label ?? "—"}` +
                    (form.pricingDetails ? ` · ${form.pricingDetails}` : "")
                  }
                />
                <SummaryRow
                  label="Licencia"
                  value={LICENSES.find((l) => l.id === form.license)?.label ?? "—"}
                />
                <SummaryRow
                  label="Autor"
                  value={`${form.authorHandle || "—"} · ${
                    SENDER_ROLES.find((r) => r.id === form.senderRole)?.id === "creator"
                      ? "creador"
                      : "curador"
                  }`}
                />
              </div>

              {previewBadges.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Insignias:
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

              {Object.keys(errors).length > 0 && (
                <div className="rounded-sm border border-destructive/50 p-4">
                  <p className="text-[13px] font-medium text-destructive">
                    Faltan datos por corregir
                  </p>
                  <ul className="mt-2 space-y-1">
                    {Object.entries(errors).map(([key, msg]) => (
                      <li key={key} className="text-[12px] text-muted-foreground">
                        <button
                          type="button"
                          className="underline underline-offset-2 hover:text-foreground"
                          onClick={() => scrollToSection(FIELD_SECTION[key] ?? "identidad")}
                        >
                          {FIELD_LABEL[key] ?? key}
                        </button>
                        {": "}
                        {msg.replace(`${FIELD_LABEL[key]}: `, "")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-solid w-full justify-center disabled:opacity-50 sm:w-auto"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Enviar propuesta
              </button>
              <p className="text-[12px] text-muted-foreground">
                ¿Es un recurso descargable que quieres vender ya? Usa{" "}
                <Link
                  to="/upload"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  la subida directa
                </Link>
                .
              </p>
            </Section>
          </form>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Local primitives
// ---------------------------------------------------------------------------

function Section({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-6" aria-label={`Sección ${n}: ${title}`}>
      <header className="flex items-baseline gap-3 border-b border-border/60 pb-3">
        <span className="font-mono text-[11px] text-muted-foreground">{n}</span>
        <h2 className="text-lg font-light tracking-tight">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-background p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 truncate text-sm",
          mono && "font-mono text-[12px] break-all",
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

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
