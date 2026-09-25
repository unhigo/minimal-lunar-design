/**
 * Submit wizard — shared types + Zod schemas + auto-badges.
 *
 * A submission is the review-ready intake for the directory. Every submission
 * is created with `status: "pending"`; admins approve/publish it from /admin.
 * Pure logic lives here so it can be unit tested without React or Convex.
 */

import { z } from "zod";
import type { Infer } from "convex/values";
import { submissionValidator } from "@/convex/schema";

// ---------------------------------------------------------------------------
// Option catalogs (single source of truth for wizard UI + validation)
// ---------------------------------------------------------------------------

export const SUBMIT_CATEGORIES = [
  { id: "ai", label: "AI Tools", glyph: "01" },
  { id: "web-apps", label: "Web Apps", glyph: "02" },
  { id: "software", label: "Software / Plugins", glyph: "03" },
  { id: "ui-ux", label: "UI/UX Design Systems", glyph: "04" },
  { id: "resources", label: "Recursos Descargables", glyph: "05" },
  { id: "inspiration", label: "Inspiración", glyph: "06" },
  { id: "education", label: "Educación", glyph: "07" },
] as const;

export const PLATFORMS = [
  "Web",
  "macOS",
  "Windows",
  "Linux",
  "iOS",
  "Android",
  "Figma Plugin",
  "Adobe Extension",
] as const;

export const ECOSYSTEMS = [
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

export const PRICING_MODELS = [
  { id: "free", label: "Gratis / Open Source" },
  { id: "freemium", label: "Freemium" },
  { id: "subscription", label: "Suscripción" },
  { id: "one-time", label: "Pago único" },
] as const;

export const LICENSES = [
  { id: "cc0", label: "CC0 / Dominio público" },
  { id: "commercial-no-attribution", label: "Comercial sin atribución" },
  { id: "commercial-attribution", label: "Comercial con atribución" },
  { id: "personal", label: "Solo uso personal" },
] as const;

export const SENDER_ROLES = [
  { id: "creator", label: "Creador — es mi trabajo" },
  { id: "curator", label: "Curador — lo descubrí" },
] as const;

// ---------------------------------------------------------------------------
// Zod schema — mirrors submissionValidator in convex/schema.ts
// ---------------------------------------------------------------------------

const trimmed = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max);

export const submitSchema = z.object({
  // Paso 1
  title: trimmed(2, 80),
  url: z.url("Introduce una URL válida (https://…)"),
  logoStorageId: z.string().optional(),
  tagline: trimmed(4, 100),
  // Paso 2
  category: z.enum(SUBMIT_CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  platforms: z.array(z.enum(PLATFORMS)).default([]),
  ecosystems: z.array(z.enum(ECOSYSTEMS)).default([]),
  tags: z.array(trimmed(1, 24)).max(8).default([]),
  // Paso 3
  gallery: z.array(z.object({ storageId: z.string(), caption: z.string().optional() })).max(4).default([]),
  thumbStorageId: z.string().optional(),
  videoUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || /^https?:\/\//.test(v), "La URL del vídeo debe empezar por http(s)://")
    .optional(),
  // Paso 4
  pricing: z.enum(PRICING_MODELS.map((p) => p.id) as [string, ...string[]]),
  pricingDetails: trimmed(0, 80).optional(),
  license: z.enum(LICENSES.map((l) => l.id) as [string, ...string[]]),
  discountCode: z.string().trim().max(40).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  // Paso 5
  description: trimmed(30, 4000),
  features: z.array(trimmed(2, 120)).min(3).max(5),
  // Paso 6
  senderRole: z.enum(SENDER_ROLES.map((r) => r.id) as [string, ...string[]]),
  authorHandle: trimmed(2, 60),
  authorLinks: z.array(z.url()).max(4).default([]),
  contactEmail: z.string().trim().email("Email no válido"),
  scheduledDate: z.number().optional(),
});

export type SubmitInput = z.input<typeof submitSchema>;
export type SubmitPayload = z.output<typeof submitSchema>;

/** Server-side shape (validator in convex/schema.ts). Keep in sync. */
export type SubmissionDoc = Infer<typeof submissionValidator>;

// ---------------------------------------------------------------------------
// Auto-badges — rendered from data, never stored
// ---------------------------------------------------------------------------

export interface BadgeDef {
  id: string;
  label: string;
  /** Short prefix glyph in JetBrains Mono style. */
  glyph: string;
}

/**
 * Derive the display badges for a submission. Rules:
 * - AI category → "AI-POWERED"
 * - open/commercial-friendly licenses → "FREE FOR COMMERCIAL USE"
 * - free pricing → "FREE"
 * - discount → "COMMUNITY DEAL −N%"
 * - has video → "VIDEO DEMO"
 * - creator (vs curator) → "BY THE MAKER"
 */
export function badgesFor(
  s: Pick<
    SubmitPayload,
    | "category"
    | "pricing"
    | "license"
    | "discountCode"
    | "discountPercent"
    | "videoUrl"
    | "senderRole"
    | "platforms"
  >,
): BadgeDef[] {
  const badges: BadgeDef[] = [];
  if (s.category === "ai") {
    badges.push({ id: "ai", glyph: "AI", label: "AI-Powered" });
  }
  if (s.license === "cc0" || s.license === "commercial-no-attribution") {
    badges.push({ id: "commercial", glyph: "◇", label: "Free for Commercial Use" });
  }
  if (s.pricing === "free") {
    badges.push({ id: "free", glyph: "Ø", label: "Gratis" });
  }
  if (s.discountPercent && s.discountCode) {
    badges.push({
      id: "deal",
      glyph: "%",
      label: `Community Deal −${s.discountPercent}%`,
    });
  }
  if (s.videoUrl) {
    badges.push({ id: "video", glyph: "▶", label: "Video Demo" });
  }
  if (s.senderRole === "creator") {
    badges.push({ id: "maker", glyph: "∗", label: "By the Maker" });
  }
  return badges;
}

// ---------------------------------------------------------------------------
// Draft persistence (localStorage) so a half-filled wizard survives reloads
// ---------------------------------------------------------------------------

const DRAFT_KEY = "mld.submit-draft.v1";

export function saveDraft(value: unknown) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function loadDraft<T>(): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
