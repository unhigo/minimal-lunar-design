import { v } from "convex/values";
import type { Infer } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  query,
  mutation,
  internalMutation,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ROLES, roleValidator } from "./schema";
import { ADMIN_BOOTSTRAP_FLAG, timingSafeEqual } from "./admin_bootstrap";

/** Admin-gate helper: throws unless the caller has the admin role. */
async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in.");
  const user = await ctx.db.get(userId);
  if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");
  return userId;
}

/** systemFlags key for the one-time legacy pending-purchase migration. */
export const LEGACY_PURCHASES_FLAG = "purchases.legacy.cancelled";

/** True when the user has a completed purchase of the resource. */
async function hasCompletedPurchase(
  ctx: QueryCtx,
  userId: Id<"users"> | null,
  resourceId: Id<"resources">,
): Promise<boolean> {
  if (userId === null) return false;
  const rows = await ctx.db
    .query("purchases")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("resourceId"), resourceId))
    .filter((q) => q.eq(q.field("status"), "completed"))
    .collect();
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Catalog (public)
// ---------------------------------------------------------------------------

export const listPublished = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { search, category }) => {
    let resources;
    if (category && category !== "all") {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_category", (q) => q.eq("category", category))
        .filter((q) => q.eq(q.field("status"), "published"))
        .collect();
    } else {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .collect();
    }
    // Newest first.
    resources.sort((a, b) => b.createdAt - a.createdAt);
    if (search) {
      const needle = search.toLowerCase();
      resources = resources.filter(
        (r) =>
          r.title.toLowerCase().includes(needle) ||
          r.description.toLowerCase().includes(needle) ||
          r.category.toLowerCase().includes(needle),
      );
    }
    const withAuthors = await Promise.all(
      resources.map(async (r) => {
        const author = await ctx.db.get(r.authorId);
        return {
          ...r,
          authorName: author?.name ?? author?.email ?? "Unknown",
          coverUrl: r.coverStorageId
            ? await ctx.storage.getUrl(r.coverStorageId)
            : (r.coverCloudUrl ?? null),
        };
      }),
    );
    return withAuthors;
  },
});

export const getPublished = query({
  args: { id: v.id("resources") },
  handler: async (ctx, { id }) => {
    const resource = await ctx.db.get(id);
    if (!resource || resource.status !== "published") return null;
    const author = await ctx.db.get(resource.authorId);
    // P0 download gating: paid files are only resolved for the author, an
    // admin or a completed purchaser — never for anonymous visitors.
    const viewerId = await getAuthUserId(ctx);
    const viewer = viewerId !== null ? await ctx.db.get(viewerId) : null;
    let canDownload =
      resource.price === 0 ||
      resource.authorId === viewerId ||
      viewer?.role === ROLES.ADMIN;
    if (!canDownload && (await hasCompletedPurchase(ctx, viewerId, id))) {
      canDownload = true;
    }
    return {
      ...resource,
      authorName: author?.name ?? author?.email ?? "Unknown",
      fileUrl:
        canDownload && resource.fileStorageId
          ? await ctx.storage.getUrl(resource.fileStorageId)
          : null,
      coverUrl: resource.coverStorageId
        ? await ctx.storage.getUrl(resource.coverStorageId)
        : (resource.coverCloudUrl ?? null),
    };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();
    resources.sort((a, b) => b.createdAt - a.createdAt);
    return await Promise.all(
      resources.map(async (r) => {
        const sales = await ctx.db
          .query("purchases")
          .withIndex("by_resource", (q) => q.eq("resourceId", r._id))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();
        return {
          ...r,
          sales: sales.length,
          coverUrl: r.coverStorageId
            ? await ctx.storage.getUrl(r.coverStorageId)
            : (r.coverCloudUrl ?? null),
          fileUrl: r.fileStorageId
            ? await ctx.storage.getUrl(r.fileStorageId)
            : null,
        };
      }),
    );
  },
});

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    return [...new Set(resources.map((r) => r.category))].sort();
  },
});

// ---------------------------------------------------------------------------
// Upload (any signed-in user)
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    url: v.optional(v.string()),
    category: v.string(),
    price: v.number(),
    fileStorageId: v.optional(v.id("_storage")),
    coverStorageId: v.optional(v.id("_storage")),
    fileMeta: v.optional(
      v.object({
        name: v.string(),
        type: v.string(),
        size: v.number(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Must be signed in to upload.");
    const { title, description, url, category, price, fileStorageId, coverStorageId, fileMeta } = args;
    const normalizedPrice = Math.max(0, Math.round(price));
    return await ctx.db.insert("resources", {
      title,
      description,
      url: url || undefined,
      category,
      price: normalizedPrice,
      fileStorageId,
      coverStorageId,
      fileMeta,
      authorId: userId,
      // P0: paid resources stay hidden until a real payment provider exists
      // (they could otherwise be "bought" for free while published).
      status: normalizedPrice === 0 ? "published" : "hidden",
      createdAt: Date.now(),
    });
  },
});

/**
 * Enrich an existing (own) resource with the product fields captured by the
 * /submit wizard — tagline, platforms, pricing model, features, gallery…
 * Used by the wizard's "enrich existing resource" path.
 */
export const updateProductFields = mutation({
  args: {
    id: v.id("resources"),
    tagline: v.string(),
    platforms: v.array(v.string()),
    ecosystems: v.array(v.string()),
    tags: v.array(v.string()),
    gallery: v.array(
      v.object({
        storageId: v.id("_storage"),
        caption: v.optional(v.string()),
        cloudUrl: v.optional(v.string()),
        cloudPublicId: v.optional(v.string()),
      }),
    ),
    videoUrl: v.optional(v.string()),
    pricing: v.string(),
    pricingDetails: v.optional(v.string()),
    license: v.string(),
    discountCode: v.optional(v.string()),
    discountPercent: v.optional(v.number()),
    features: v.array(v.string()),
    thumbStorageId: v.optional(v.id("_storage")),
    thumbCloudUrl: v.optional(v.string()),
    thumbCloudPublicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const resource = await ctx.db.get(args.id);
    if (!resource) throw new Error("Resource not found.");
    if (resource.authorId !== userId) throw new Error("Not your resource.");
    const {
      id,
      tagline,
      platforms,
      ecosystems,
      tags,
      gallery,
      videoUrl,
      pricing,
      pricingDetails,
      license,
      discountCode,
      discountPercent,
      features,
      thumbStorageId,
      thumbCloudUrl,
      thumbCloudPublicId,
    } = args;
    await ctx.db.patch(id, {
      productFields: {
        tagline,
        platforms,
        ecosystems,
        tags,
        gallery,
        videoUrl,
        pricing,
        pricingDetails,
        license,
        discountCode,
        discountPercent,
        features,
        senderRole: "creator",
        authorHandle: "",
        authorLinks: [],
      },
      ...(thumbStorageId !== undefined ? { coverStorageId: thumbStorageId } : {}),
      // Cloudinary cover: only applied when no Convex storage cover was set.
      ...(thumbStorageId === undefined && thumbCloudUrl !== undefined
        ? { coverCloudUrl: thumbCloudUrl, coverCloudPublicId: thumbCloudPublicId }
        : {}),
    });
  },
});

export const updateMine = mutation({
  args: {
    id: v.id("resources"),
    title: v.string(),
    description: v.string(),
    url: v.optional(v.string()),
    category: v.string(),
    price: v.number(),
    coverStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const { id, title, description, url, category, price, coverStorageId } = args;
    const resource = await ctx.db.get(id);
    if (!resource) throw new Error("Resource not found.");
    if (resource.authorId !== userId) throw new Error("Not your resource.");
    // Replace the cover: delete the old blob if it is being swapped or removed.
    if (
      coverStorageId !== undefined &&
      resource.coverStorageId &&
      resource.coverStorageId !== coverStorageId
    ) {
      await ctx.storage.delete(resource.coverStorageId);
    }
    await ctx.db.patch(id, {
      title,
      description,
      url: url || undefined,
      category,
      price: Math.max(0, Math.round(price)),
      ...(coverStorageId !== undefined ? { coverStorageId } : {}),
    });
  },
});

export const removeMine = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const resource = await ctx.db.get(id);
    if (!resource) throw new Error("Resource not found.");
    if (resource.authorId !== userId) throw new Error("Not your resource.");
    // Cascade-delete comments, purchases and stored images for this resource.
    for (const storageId of [resource.fileStorageId, resource.coverStorageId]) {
      if (storageId) await ctx.storage.delete(storageId);
    }
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_resource", (q) => q.eq("resourceId", id))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_resource", (q) => q.eq("resourceId", id))
      .collect();
    for (const p of purchases) await ctx.db.delete(p._id);
    await ctx.db.delete(id);
  },
});

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const listComments = query({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, { resourceId }) => {
    const viewerId = await getAuthUserId(ctx);
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
      .collect();
    comments.sort((a, b) => a.createdAt - b.createdAt);
    return await Promise.all(
      comments.map(async (c) => {
        const author = await ctx.db.get(c.authorId);
        return {
          ...c,
          authorName: author?.name ?? author?.email ?? "Unknown",
          isMine: viewerId !== null && c.authorId === viewerId,
        };
      }),
    );
  },
});

export const addComment = mutation({
  args: { resourceId: v.id("resources"), body: v.string() },
  handler: async (ctx, { resourceId, body }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to comment.");
    const resource = await ctx.db.get(resourceId);
    if (!resource || resource.status !== "published") {
      throw new Error("Resource not available.");
    }
    return await ctx.db.insert("comments", {
      resourceId,
      authorId: userId,
      body: body.trim(),
      createdAt: Date.now(),
    });
  },
});

export const deleteComment = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const comment = await ctx.db.get(id);
    if (!comment) throw new Error("Comment not found.");
    const user = await ctx.db.get(userId);
    if (comment.authorId !== userId && user?.role !== ROLES.ADMIN) {
      throw new Error("Not allowed.");
    }
    await ctx.db.delete(id);
  },
});

// ---------------------------------------------------------------------------
// Checkout — P0 hardening
//
// Free items (price === 0) complete instantly: the server resolves the price
// itself, the client never declares amounts or statuses.
//
// Paid items: checkout is DISABLED (PAYMENTS_ENABLED=false state) until a
// real provider is wired (createCheckoutSession → provider → signed webhook →
// server marks completed, idempotent by provider event id). The old
// client-driven confirmCheckout — any signed-in user could mark their own
// pending purchase "completed" — was removed entirely.
// ---------------------------------------------------------------------------

export const beginCheckout = mutation({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, { resourceId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to purchase.");
    const resource = await ctx.db.get(resourceId);
    if (!resource || resource.status !== "published") {
      throw new Error("Resource not available.");
    }
    // Guard against duplicate completed purchases of the same item.
    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("resourceId"), resourceId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();
    if (existing.length > 0) {
      return { status: "already-owned" as const, purchaseId: existing[0]._id };
    }
    // Paid items: no fake completion. No pending rows are created until a
    // provider exists — that also avoids orphan "pending" clutter.
    if (resource.price !== 0) {
      return { status: "unavailable" as const, purchaseId: null };
    }
    const purchaseId = await ctx.db.insert("purchases", {
      resourceId,
      userId,
      amount: resource.price,
      status: "completed",
      createdAt: Date.now(),
    });
    return { status: "completed" as const, purchaseId };
  },
});

/**
 * One-time migration: legacy pending purchases (created by the removed demo
 * checkout) can never complete — there is no provider to confirm them. This
 * internal mutation marks them "cancelled" so no orphan state remains.
 * Latched via systemFlags so it runs at most once per deployment.
 */
export const cancelLegacyPurchases = internalMutation({
  args: {},
  handler: async (ctx) => {
    const latch = await ctx.db
      .query("systemFlags")
      .withIndex("by_key", (q) => q.eq("key", LEGACY_PURCHASES_FLAG))
      .unique();
    if (latch) return { cancelled: 0, alreadyRan: true };
    let cancelled = 0;
    const pending = await ctx.db
      .query("purchases")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    for (const p of pending) {
      await ctx.db.patch(p._id, { status: "cancelled" });
      cancelled++;
    }
    await ctx.db.insert("systemFlags", {
      key: LEGACY_PURCHASES_FLAG,
      value: "1",
      createdAt: Date.now(),
    });
    return { cancelled, alreadyRan: false };
  },
});

export const myPurchases = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    purchases.sort((a, b) => b.createdAt - a.createdAt);
    return await Promise.all(
      purchases.map(async (p) => {
        const resource = await ctx.db.get(p.resourceId);
        return {
          ...p,
          resourceTitle: resource?.title ?? "(deleted resource)",
          resourceUrl: resource?.url ?? null,
          fileUrl: resource?.fileStorageId
            ? await ctx.storage.getUrl(resource.fileStorageId)
            : null,
        };
      }),
    );
  },
});

export const hasPurchased = query({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, { resourceId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("resourceId"), resourceId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();
    return existing.length > 0;
  },
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const listAllForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    const resources = await ctx.db.query("resources").collect();
    resources.sort((a, b) => b.createdAt - a.createdAt);
    return await Promise.all(
      resources.map(async (r) => {
        const author = await ctx.db.get(r.authorId);
        return {
          ...r,
          authorName: author?.name ?? author?.email ?? "Unknown",
        };
      }),
    );
  },
});

export const setUserRole = mutation({
  args: { userId: v.id("users"), role: roleValidator },
  handler: async (
    ctx,
    { userId, role }: { userId: Id<"users">; role: Infer<typeof roleValidator> },
  ) => {
    const callerId = await getAuthUserId(ctx);
    if (callerId === null) throw new Error("Not signed in.");
    const caller = await ctx.db.get(callerId);
    if (caller?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    await ctx.db.patch(userId, { role });
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const callerId = await getAuthUserId(ctx);
    if (callerId === null) throw new Error("Not signed in.");
    const caller = await ctx.db.get(callerId);
    if (caller?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      name: u.name ?? null,
      email: u.email ?? null,
      role: u.role ?? null,
      isAnonymous: u.isAnonymous ?? false,
    }));
  },
});

export const listRecentComments = query({
  args: {},
  handler: async (ctx) => {
    const callerId = await getAuthUserId(ctx);
    if (callerId === null) throw new Error("Not signed in.");
    const caller = await ctx.db.get(callerId);
    if (caller?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    const comments = await ctx.db.query("comments").collect();
    comments.sort((a, b) => b.createdAt - a.createdAt);
    return await Promise.all(
      comments.slice(0, 50).map(async (c) => {
        const author = await ctx.db.get(c.authorId);
        const resource = await ctx.db.get(c.resourceId);
        return {
          ...c,
          authorName: author?.name ?? author?.email ?? "Unknown",
          resourceTitle: resource?.title ?? "(deleted resource)",
        };
      }),
    );
  },
});

export const setVisibility = mutation({
  args: { id: v.id("resources"), hidden: v.boolean() },
  handler: async (ctx, { id, hidden }) => {
    const callerId = await getAuthUserId(ctx);
    if (callerId === null) throw new Error("Not signed in.");
    const caller = await ctx.db.get(callerId);
    if (caller?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    await ctx.db.patch(id, { status: hidden ? "hidden" : "published" });
  },
});

export const toggleFeatured = mutation({
  args: { id: v.id("resources"), featured: v.boolean() },
  handler: async (ctx, { id, featured }) => {
    const callerId = await getAuthUserId(ctx);
    if (callerId === null) throw new Error("Not signed in.");
    const caller = await ctx.db.get(callerId);
    if (caller?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    await ctx.db.patch(id, { featured });
  },
});

export const removeAsAdmin = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, { id }) => {
    const callerId = await getAuthUserId(ctx);
    if (callerId === null) throw new Error("Not signed in.");
    const caller = await ctx.db.get(callerId);
    if (caller?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_resource", (q) => q.eq("resourceId", id))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_resource", (q) => q.eq("resourceId", id))
      .collect();
    for (const p of purchases) await ctx.db.delete(p._id);
    await ctx.db.delete(id);
  },
});

/**
 * One-shot first-admin bootstrap (P0 fix).
 *
 * - The secret lives ONLY in server env ADMIN_BOOTSTRAP_SECRET (set with
 *   `npx convex env set ADMIN_BOOTSTRAP_SECRET ...`); it is never shipped to
 *   the client, never hardcoded, never logged.
 * - FIRST_ADMIN_ONLY: rejected as soon as any admin exists, and additionally
 *   latched by a one-shot systemFlags row so it can never run twice.
 * - Length-safe, timing-insensitive comparison implemented without node APIs.
 */
export const bootstrapAdmin = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!expected) {
      throw new Error(
        "Bootstrap no configurado: define ADMIN_BOOTSTRAP_SECRET en el despliegue.",
      );
    }
    if (!timingSafeEqual(secret, expected)) {
      throw new Error("Invalid bootstrap secret.");
    }

    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in first.");

    const existingAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), ROLES.ADMIN))
      .first();
    if (existingAdmin) {
      throw new Error("Bootstrap bloqueado: ya existe un administrador.");
    }

    const latch = await ctx.db
      .query("systemFlags")
      .withIndex("by_key", (q) => q.eq("key", ADMIN_BOOTSTRAP_FLAG))
      .unique();
    if (latch) {
      throw new Error("Bootstrap bloqueado: ya se utilizó.");
    }

    await ctx.db.patch(userId, { role: ROLES.ADMIN });
    await ctx.db.insert("systemFlags", {
      key: ADMIN_BOOTSTRAP_FLAG,
      value: "1",
      createdAt: Date.now(),
    });
    return ROLES.ADMIN;
  },
});

/**
 * Full view of one of the caller's own resources for the block editor.
 * P0: ownership is now enforced server-side (the old docstring delegated it
 * to the client, letting any signed-in user read someone else's resource).
 * Admins may also read any resource for moderation.
 */
export const getMineForEdit = query({
  args: { id: v.id("resources") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const resource = await ctx.db.get(id);
    if (!resource) return null;
    const viewer = await ctx.db.get(userId);
    if (resource.authorId !== userId && viewer?.role !== ROLES.ADMIN) {
      return null;
    }
    const author = await ctx.db.get(resource.authorId);
    return {
      ...resource,
      authorName: author?.name ?? author?.email ?? "Unknown",
      fileUrl: resource.fileStorageId
        ? await ctx.storage.getUrl(resource.fileStorageId)
        : null,
      coverUrl: resource.coverStorageId
        ? await ctx.storage.getUrl(resource.coverStorageId)
        : (resource.coverCloudUrl ?? null),
    };
  },
});
