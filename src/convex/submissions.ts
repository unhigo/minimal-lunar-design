import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, action } from "./_generated/server";
import { ROLES } from "./schema";
import { submissionValidator } from "./schema";

// ---------------------------------------------------------------------------
// Submissions — review-ready intake for the directory
// ---------------------------------------------------------------------------

/** Anyone signed in can file a submission; it always starts as `pending`. */
export const create = mutation({
  args: { submission: submissionValidator },
  handler: async (ctx, { submission }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Inicia sesión para enviar propuestas.");

    // Duplicate guard: same URL from anyone still in the queue.
    const queue = await ctx.db.query("submissions").collect();
    const urlKey = submission.url.replace(/\/+$/, "").toLowerCase();
    if (
      queue.some(
        (s) =>
          s.status === "pending" &&
          s.url.replace(/\/+$/, "").toLowerCase() === urlKey,
      )
    ) {
      throw new Error("Esa URL ya está en la cola de revisión.");
    }

    return await ctx.db.insert("submissions", {
      ...submission,
      submitterId: userId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/** The caller's own submissions, newest first. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const all = await ctx.db.query("submissions").collect();
    return all
      .filter((s) => s.submitterId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Full queue — admins only. */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    const all = await ctx.db.query("submissions").collect();
    const order = { pending: 0, approved: 1, rejected: 2, published: 3 } as const;
    return all.sort(
      (a, b) => order[a.status] - order[b.status] || b.createdAt - a.createdAt,
    );
  },
});

/** Admin moderation transitions. */
export const moderate = mutation({
  args: { id: v.id("submissions"), status: v.string() },
  handler: async (ctx, { id, status }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    const allowed = ["pending", "approved", "rejected", "published"];
    if (!allowed.includes(status)) throw new Error("Estado no válido.");
    await ctx.db.patch(id, {
      status: status as "pending" | "approved" | "rejected" | "published",
    });
  },
});

/**
 * Admin action: convert an approved submission into a published resource.
 * Copies the product fields onto the resources table and marks the
 * submission as `published`. Storage ids are carried over so cover and
 * gallery render through the existing image pipeline.
 */
export const publishAsResource = mutation({
  args: { id: v.id("submissions"), priceCents: v.optional(v.number()) },
  handler: async (ctx, { id, priceCents }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");

    const sub = await ctx.db.get(id);
    if (!sub) throw new Error("Submission not found.");

    const resourceId = await ctx.db.insert("resources", {
      title: sub.title,
      description: sub.description,
      url: sub.url,
      category: sub.category,
      authorId: sub.submitterId,
      price: Math.max(0, Math.round(priceCents ?? 0)),
      featured: false,
      status: "published",
      fileStorageId: (sub.thumbStorageId ?? sub.logoStorageId) as never,
      coverStorageId: (sub.thumbStorageId ?? sub.gallery[0]?.storageId) as never,
      productFields: {
        tagline: sub.tagline,
        platforms: sub.platforms,
        ecosystems: sub.ecosystems,
        tags: sub.tags,
        gallery: sub.gallery,
        videoUrl: sub.videoUrl,
        pricing: sub.pricing,
        pricingDetails: sub.pricingDetails,
        license: sub.license,
        discountCode: sub.discountCode,
        discountPercent: sub.discountPercent,
        features: sub.features,
        senderRole: sub.senderRole,
        authorHandle: sub.authorHandle,
        authorLinks: sub.authorLinks,
      },
      createdAt: Date.now(),
    });

    await ctx.db.patch(id, { status: "published" });
    return resourceId;
  },
});

// ---------------------------------------------------------------------------
// Metadata auto-fill (OpenGraph) — runs server-side to avoid CORS
// ---------------------------------------------------------------------------

interface MetaResult {
  ok: boolean;
  reason?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
}

/** Fetch a URL and extract basic OpenGraph metadata (title/description/image). */
export const metaPreview = action({
  args: { url: v.string() },
  handler: async (_ctx, { url }): Promise<MetaResult> => {
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      return { ok: false, reason: "url-invalida" };
    }
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return { ok: false, reason: "url-invalida" };
    }

    try {
      const res = await fetch(target.toString(), {
        redirect: "follow",
        signal: AbortSignal.timeout(8_000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; MoonOLabBot/1.0; +https://moono.lab)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (!res.ok) return { ok: false, reason: `http-${res.status}` };
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) {
        return { ok: false, reason: "no-html" };
      }
      // Read at most ~400KB — metadata lives in <head>.
      const reader = res.body?.getReader();
      let html = "";
      if (reader) {
        const decoder = new TextDecoder();
        let total = 0;
        while (total < 400_000) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.length;
          html += decoder.decode(value, { stream: true });
        }
        await reader.cancel().catch(() => {});
      } else {
        html = await res.text();
      }

      const pick = (re: RegExp): string | undefined => {
        const m = re.exec(html);
        if (!m) return undefined;
        return decodeEntities(m[1]).trim() || undefined;
      };

      const title =
        pick(/<meta[^>]+property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ??
        pick(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ??
        pick(/<title[^>]*>([^<]{1,300})<\/title>/i);
      const description =
        pick(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']description["']/i) ??
        pick(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
      const imageUrl =
        pick(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      const siteName = pick(
        /<meta[^>]+property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
      );

      if (!title && !description) return { ok: false, reason: "sin-metadatos" };
      return { ok: true, title, description, imageUrl, siteName };
    } catch {
      return { ok: false, reason: "network" };
    }
  },
});

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
