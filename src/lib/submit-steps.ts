/**
 * Submit workflow — step manifest and per-step validation.
 *
 * Pure logic so it can be unit tested without React or Convex. Field names
 * map 1:1 to the real data contract: `submitSchema` (src/lib/submit-schema.ts)
 * and `submissionValidator` (src/convex/schema.ts). No new fields are invented.
 */

import {
  LICENSES,
  PLATFORMS,
  PRICING_MODELS,
  SENDER_ROLES,
  SUBMIT_CATEGORIES,
} from "./submit-schema";

/** The seven workflow steps, in navigation order. */
export const STEPS = [
  { id: "identity", n: "01", label: "Identity", es: "Identidad" },
  { id: "classification", n: "02", label: "Classification", es: "Clasificación" },
  { id: "details", n: "03", label: "Details", es: "Detalles" },
  { id: "media", n: "04", label: "Media", es: "Multimedia" },
  { id: "pricing", n: "05", label: "Pricing & License", es: "Precios y licencia" },
  { id: "creator", n: "06", label: "Creator", es: "Creador" },
  { id: "review", n: "07", label: "Review", es: "Revisión" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export function stepIndex(id: StepId): number {
  return STEPS.findIndex((s) => s.id === id);
}

/**
 * Normalize a URL for duplicate comparison: lowercase host, strip `www.`,
 * drop trailing slashes and a default port. Keeps path/query intact.
 */
export function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const port = u.port && u.port !== "80" && u.port !== "443" ? `:${u.port}` : "";
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.protocol}//${host}${port}${path}${u.search}`;
  } catch {
    return v.toLowerCase();
  }
}

/** Editable form state — one key per real backend field. */
export interface FormState {
  title: string;
  url: string;
  tagline: string;
  category: string;
  platforms: string[];
  ecosystems: string[];
  tags: string[];
  gallery: {
    storageId: string;
    url: string;
    caption?: string;
    cloudUrl?: string;
    cloudPublicId?: string;
  }[];
  thumbStorageId: string | null;
  thumbUrl: string | null;
  thumbCloudUrl: string | null;
  thumbCloudPublicId: string | null;
  logoStorageId: string | null;
  logoUrl: string | null;
  logoCloudUrl: string | null;
  logoCloudPublicId: string | null;
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
  scheduledDate: string; // yyyy-mm-dd or ""
}

export const EMPTY_FORM: FormState = {
  title: "",
  url: "",
  tagline: "",
  category: "",
  platforms: [],
  ecosystems: [],
  tags: [],
  gallery: [],
  thumbStorageId: null,
  thumbUrl: null,
  thumbCloudUrl: null,
  thumbCloudPublicId: null,
  logoStorageId: null,
  logoUrl: null,
  logoCloudUrl: null,
  logoCloudPublicId: null,
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

/** Merge a persisted draft, tolerating schema drift from older drafts. */
export function hydrateForm(draft: Partial<FormState> | null): FormState {
  if (!draft) return EMPTY_FORM;
  return {
    ...EMPTY_FORM,
    ...draft,
    platforms: Array.isArray(draft.platforms) ? draft.platforms : [],
    ecosystems: Array.isArray(draft.ecosystems) ? draft.ecosystems : [],
    tags: Array.isArray(draft.tags) ? draft.tags : [],
    gallery: Array.isArray(draft.gallery) ? draft.gallery : [],
    features:
      Array.isArray(draft.features) && draft.features.length >= 3
        ? draft.features
        : ["", "", ""],
    authorLinks:
      Array.isArray(draft.authorLinks) && draft.authorLinks.length
        ? draft.authorLinks
        : [""],
  };
}

/** Per-field Spanish messages. Keys match FormState field names. */
const REQUIRED_MSG: Record<string, string> = {
  title: "El nombre es obligatorio.",
  url: "Introduce una URL válida (https://…).",
  tagline: "Escribe una frase que resuma la herramienta.",
  category: "Selecciona una categoría principal.",
  description: "La descripción debe tener al menos 30 caracteres.",
  features: "Añade entre 3 y 5 características.",
  senderRole: "Indica tu rol.",
  authorHandle: "Indica el nombre o handle del autor.",
  contactEmail: "Introduce un email de contacto válido.",
  license: "Selecciona una licencia.",
};

const URL_RE = /^https?:\/\/[^\s]+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The fields each step owns (used for per-step validation + Review edit links). */
export const STEP_FIELDS: Record<StepId, string[]> = {
  identity: ["title", "url", "tagline", "logo"],
  classification: ["category", "platforms", "ecosystems", "tags"],
  details: ["description", "features"],
  media: ["gallery", "thumb", "videoUrl"],
  pricing: ["pricing", "pricingDetails", "license", "discount"],
  creator: ["senderRole", "authorHandle", "authorLinks", "contactEmail", "scheduledDate"],
  review: [],
};

/**
 * Validate one step; returns map of field key → Spanish message.
 * `form` must be a FormState.
 */
export function validateStep(
  step: StepId,
  form: FormState,
): Record<string, string> {
  const errs: Record<string, string> = {};

  if (step === "identity") {
    const title = form.title.trim();
    if (title.length < 2) errs.title = REQUIRED_MSG.title;
    else if (title.length > 80) errs.title = "Máximo 80 caracteres.";
    if (!URL_RE.test(form.url.trim())) errs.url = REQUIRED_MSG.url;
    const tag = form.tagline.trim();
    if (tag.length < 4) errs.tagline = REQUIRED_MSG.tagline;
    else if (tag.length > 100) errs.tagline = "Máximo 100 caracteres.";
  }

  if (step === "classification") {
    if (!SUBMIT_CATEGORIES.some((c) => c.id === form.category)) {
      errs.category = REQUIRED_MSG.category;
    }
    for (const p of form.platforms) {
      if (!(PLATFORMS as readonly string[]).includes(p)) {
        errs.platforms = "Plataforma no válida.";
        break;
      }
    }
    for (const e of form.ecosystems) {
      if (!(ECOSYSTEM_LIST as readonly string[]).includes(e)) {
        errs.ecosystems = "Ecosistema no válido.";
        break;
      }
    }
    if (form.tags.length > 8) errs.tags = "Máximo 8 etiquetas.";
    if (form.tags.some((t) => t.length > 24)) errs.tags = "Cada etiqueta: máx. 24 caracteres.";
  }

  if (step === "details") {
    if (form.description.trim().length < 30) errs.description = REQUIRED_MSG.description;
    if (form.description.trim().length > 4000)
      errs.description = "Máximo 4000 caracteres.";
    const feats = form.features.map((f) => f.trim()).filter(Boolean);
    if (feats.length < 3 || feats.length > 5) errs.features = REQUIRED_MSG.features;
    if (feats.some((f) => f.length < 2 || f.length > 120))
      errs.features = "Cada característica: 2–120 caracteres.";
  }

  if (step === "media") {
    if (form.gallery.length > 4) errs.gallery = "Máximo 4 capturas.";
    if (form.videoUrl.trim() && !URL_RE.test(form.videoUrl.trim()))
      errs.videoUrl = "La URL del vídeo debe empezar por http(s)://";
  }

  if (step === "pricing") {
    if (!PRICING_MODELS.some((p) => p.id === form.pricing)) errs.pricing = "Selecciona un modelo.";
    if (!LICENSES.some((l) => l.id === form.license)) errs.license = REQUIRED_MSG.license;
    if (form.pricingDetails.trim().length > 80)
      errs.pricingDetails = "Máximo 80 caracteres.";
    if (form.discountEnabled) {
      const code = form.discountCode.trim();
      const pct = Number(form.discountPercent);
      if (!code || code.length > 40)
        errs.discount = "Introduce un código de cupón (máx. 40).";
      else if (
        form.discountPercent === "" ||
        Number.isNaN(pct) ||
        !Number.isInteger(pct) ||
        pct < 1 ||
        pct > 100
      )
        errs.discount = "El porcentaje debe ser un entero entre 1 y 100.";
    }
  }

  if (step === "creator") {
    if (!SENDER_ROLES.some((r) => r.id === form.senderRole))
      errs.senderRole = REQUIRED_MSG.senderRole;
    const h = form.authorHandle.trim();
    if (h.length < 2) errs.authorHandle = REQUIRED_MSG.authorHandle;
    else if (h.length > 60) errs.authorHandle = "Máximo 60 caracteres.";
    const bad = form.authorLinks.map((l) => l.trim()).filter(Boolean).find((l) => !URL_RE.test(l));
    if (bad) errs.authorLinks = "Cada enlace debe ser una URL http(s) completa.";
    if (form.authorLinks.filter((l) => l.trim()).length > 4)
      errs.authorLinks = "Máximo 4 enlaces.";
    if (!EMAIL_RE.test(form.contactEmail.trim()))
      errs.contactEmail = REQUIRED_MSG.contactEmail;
    if (form.scheduledDate && Number.isNaN(new Date(form.scheduledDate).getTime()))
      errs.scheduledDate = "Fecha no válida.";
  }

  return errs;
}

/** Completion snapshot per step: which required fields are satisfied. */
export function stepCompletion(form: FormState): Record<
  StepId,
  { done: boolean; missing: number }
> {
  const perStep: Record<StepId, number> = {
    identity: 0,
    classification: 0,
    details: 0,
    media: 0,
    pricing: 0,
    creator: 0,
    review: 0,
  };

  const add = (s: StepId, n: number) => (perStep[s] = perStep[s] + n);

  // identity — 3 required
  add("identity", form.title.trim().length >= 2 ? 1 : 0);
  add("identity", URL_RE.test(form.url.trim()) ? 1 : 0);
  add("identity", form.tagline.trim().length >= 4 ? 1 : 0);

  // classification — 1 required
  add("classification", SUBMIT_CATEGORIES.some((c) => c.id === form.category) ? 1 : 0);

  // details — 2 required
  add("details", form.description.trim().length >= 30 ? 1 : 0);
  const feats = form.features.map((f) => f.trim()).filter(Boolean);
  add(
    "details",
    feats.length >= 3 &&
      feats.length <= 5 &&
      feats.every((f) => f.length >= 2 && f.length <= 120)
      ? 1
      : 0,
  );

  // media — optional
  add("media", 0);

  // pricing — 2 required
  add("pricing", PRICING_MODELS.some((p) => p.id === form.pricing) ? 1 : 0);
  add("pricing", LICENSES.some((l) => l.id === form.license) ? 1 : 0);

  // creator — 4 required
  add("creator", SENDER_ROLES.some((r) => r.id === form.senderRole) ? 1 : 0);
  add("creator", form.authorHandle.trim().length >= 2 ? 1 : 0);
  add(
    "creator",
    form.authorLinks
      .map((l) => l.trim())
      .filter(Boolean)
      .every((l) => URL_RE.test(l))
      ? 1
      : 0,
  );
  add("creator", EMAIL_RE.test(form.contactEmail.trim()) ? 1 : 0);

  return {
    identity: { done: perStep.identity === 3, missing: 3 - perStep.identity },
    classification: {
      done: perStep.classification === 1,
      missing: 1 - perStep.classification,
    },
    details: { done: perStep.details === 2, missing: 2 - perStep.details },
    media: { done: true, missing: 0 }, // optional step — always available
    pricing: { done: perStep.pricing === 2, missing: 2 - perStep.pricing },
    creator: { done: perStep.creator === 4, missing: 4 - perStep.creator },
    review: { done: false, missing: 0 },
  };
}

/** Build the `#ML-XXXX` style reference shown after a real submission id. */
export function formatRef(id: string): string {
  const tail = id.replace(/-/g, "").slice(-4).toUpperCase();
  return `#ML-${tail || "0000"}`;
}

/**
 * SSRF-safe check: reject URLs pointing at private/loopback hosts before the
 * server fetch. Defense-in-depth on top of the server action check.
 */
export function isBlockedHost(url: string): boolean {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local"))
      return true;
    if (host === "0.0.0.0" || host === "::1" || host === "[::1]") return true;
    // IPv4 private / link-local / CGNAT / broadcast ranges.
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
    if (m) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      if (a === 10 || a === 127 || a === 0) return true;
      if (a === 169 && b === 254) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 100 && b >= 64 && b <= 127) return true;
      if (a >= 224) return true; // multicast + reserved
    }
    return false;
  } catch {
    return true;
  }
}

// Keep a local copy to avoid a circular import with submit-schema.
const ECOSYSTEM_LIST = [
  "Figma",
  "Sketch",
  "Photoshop",
  "Illustrator",
  "After Effects",
  "Blender",
  "Webflow",
  "Framer",
  "VS Code",
  "Notion",
] as const;
