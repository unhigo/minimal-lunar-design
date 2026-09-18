import { v } from "convex/values";
import type { Infer } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ROLES, roleValidator } from "./schema";

/** Shared secret for making the first signed-in user an admin. */
export const BOOTSTRAP_SECRET = "luna-admin-bootstrap";

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
            : null,
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
    return {
      ...resource,
      authorName: author?.name ?? author?.email ?? "Unknown",
      fileUrl: resource.fileStorageId
        ? await ctx.storage.getUrl(resource.fileStorageId)
        : null,
      coverUrl: resource.coverStorageId
        ? await ctx.storage.getUrl(resource.coverStorageId)
        : null,
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
            : null,
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
    return await ctx.db.insert("resources", {
      title,
      description,
      url: url || undefined,
      category,
      price: Math.max(0, Math.round(price)),
      fileStorageId,
      coverStorageId,
      fileMeta,
      authorId: userId,
      status: "published",
      createdAt: Date.now(),
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
// Checkout (demo — no payment processor wired yet)
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
    const purchaseId = await ctx.db.insert("purchases", {
      resourceId,
      userId,
      amount: resource.price,
      status: resource.price === 0 ? "completed" : "pending",
      createdAt: Date.now(),
    });
    return {
      status: resource.price === 0 ? ("completed" as const) : ("pending" as const),
      purchaseId,
    };
  },
});

export const confirmCheckout = mutation({
  args: { purchaseId: v.id("purchases") },
  handler: async (ctx, { purchaseId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const purchase = await ctx.db.get(purchaseId);
    if (!purchase) throw new Error("Purchase not found.");
    if (purchase.userId !== userId) throw new Error("Not your purchase.");
    await ctx.db.patch(purchaseId, { status: "completed" });
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

export const bootstrapAdmin = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    if (secret !== BOOTSTRAP_SECRET) {
      throw new Error("Invalid bootstrap secret.");
    }
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in first.");
    await ctx.db.patch(userId, { role: ROLES.ADMIN });
    return ROLES.ADMIN;
  },
});

/**
 * Full view of one of the caller's own resources for the block editor.
 * Returns null for missing resources; ownership must be checked by the caller
 * (comparing authorId against the current user id from useAuth).
 */
export const getMineForEdit = query({
  args: { id: v.id("resources") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const resource = await ctx.db.get(id);
    if (!resource) return null;
    const author = await ctx.db.get(resource.authorId);
    return {
      ...resource,
      authorName: author?.name ?? author?.email ?? "Unknown",
      fileUrl: resource.fileStorageId
        ? await ctx.storage.getUrl(resource.fileStorageId)
        : null,
      coverUrl: resource.coverStorageId
        ? await ctx.storage.getUrl(resource.coverStorageId)
        : null,
    };
  },
});
