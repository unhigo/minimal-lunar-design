import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, internalMutation } from "./_generated/server";
import { ROLES } from "./schema";
import type { Id, Doc } from "./_generated/dataModel";
import {
  slugify,
  pricingFromSubmitCategory,
  mapSubmitCategoryToDirectory,
  mapSeedCategoryToDirectory,
} from "../lib/directory-utils";

/** Vote/favorite counter keyed by tool id. */
type VoteMap = Map<Id<"tools">, number>;

function countByTool(rows: { toolId: Id<"tools"> }[]): VoteMap {
  const map: VoteMap = new Map();
  for (const row of rows) {
    map.set(row.toolId, (map.get(row.toolId) ?? 0) + 1);
  }
  return map;
}

/** Directory row with attached live counters. */
export type DirectoryToolDoc = Doc<"tools"> & { votes: number; favorites: number };

interface PaginatedDirectoryTools {
  page: DirectoryToolDoc[];
  isDone: boolean;
  continueCursor: string;
}

// ---------------------------------------------------------------------------
// Directory tools — DB-backed catalog (lunar/astro/design tooling)
// ---------------------------------------------------------------------------

export const TOOL_CATEGORIES_DB = [
  "astronomía",
  "cartografía",
  "geoespacial",
  "ciencia",
  "diseño",
  "imagen",
  "color",
  "tipografía",
  "3d",
  "código",
  "no-code",
  "productividad",
  "ia",
  "fotografía",
] as const;

const toolValidator = v.object({
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  shortDescription: v.string(),
  website: v.string(),
  category: v.string(),
  tags: v.array(v.string()),
  pricing: v.union(
    v.literal("free"),
    v.literal("freemium"),
    v.literal("open-source"),
    v.literal("paid"),
  ),
  pricingDetails: v.string(),
  platforms: v.array(v.string()),
  features: v.array(v.string()),
  logoStorageId: v.optional(v.id("_storage")),
  screenshotStorageId: v.optional(v.id("_storage")),
  author: v.optional(v.string()),
  featured: v.boolean(),
  trending: v.boolean(),
  verified: v.boolean(),
  status: v.union(v.literal("published"), v.literal("pending"), v.literal("rejected")),
});

/** Public listing: published tools only, with vote + favorite counts. */
export const listPublished = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    tag: v.optional(v.string()),
    pricing: v.optional(v.string()),
    sort: v.optional(
      v.union(
        v.literal("popular"),
        v.literal("recent"),
        v.literal("name"),
      ),
    ),
    // Native Convex pagination — consumed with usePaginatedQuery (Async Table).
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const search = (args.search ?? "").trim().toLowerCase();
    const tag = (args.tag ?? "").trim().toLowerCase();

    let tools;
    const category = args.category && args.category !== "all" ? args.category : null;
    if (category) {
      tools = await ctx.db
        .query("tools")
        .withIndex("by_category", (q) => q.eq("category", category))
        .collect();
    } else {
      tools = await ctx.db
        .query("tools")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .collect();
    }

    tools = tools.filter((t) => t.status === "published");

    if (search) {
      tools = tools.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.shortDescription.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search)) ||
        t.category.toLowerCase().includes(search),
      );
    }
    if (tag) {
      tools = tools.filter((t) => t.tags.some((x) => x.toLowerCase().includes(tag)));
    }
    if (args.pricing && args.pricing !== "all") {
      tools = tools.filter((t) => t.pricing === args.pricing);
    }

    // Attach vote/favorite counts in one pass over the counters tables.
    const votesByTool = countByTool(await ctx.db.query("toolVotes").collect());
    const favsByTool = countByTool(await ctx.db.query("toolFavorites").collect());

    let rows = tools.map((t) => ({
      ...t,
      votes: votesByTool.get(t._id) ?? 0,
      favorites: favsByTool.get(t._id) ?? 0,
    }));

    const sort = args.sort ?? "popular";
    rows.sort((a, b) => {
      if (sort === "recent") return b.createdAt - a.createdAt;
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      return b.votes - a.votes || b.createdAt - a.createdAt;
    });

    // Native pagination: slice the fully materialized+sorted result set with
    // paginationOpts (numItems + cursor offset provided by usePaginatedQuery).
    const start = args.paginationOpts.cursor
      ? Number.parseInt(args.paginationOpts.cursor, 10) || 0
      : 0;
    const page = rows.slice(start, start + args.paginationOpts.numItems);
    const nextStart = start + args.paginationOpts.numItems;
    return {
      page,
      isDone: nextStart >= rows.length,
      continueCursor: String(nextStart),
    };
  },
});

/** Full listing without pagination (used by the home page strips). */
export const listAllPublished = query({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    const votesByTool = countByTool(await ctx.db.query("toolVotes").collect());
    return tools
      .map((t) => ({ ...t, votes: votesByTool.get(t._id) ?? 0 }))
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, "es"));
  },
});

/** Single tool by slug + related tools by category/tag overlap. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const tool = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!tool) return null;

    const votes = await ctx.db.query("toolVotes").withIndex("by_tool", (q) => q.eq("toolId", tool._id)).collect();
    const sameCategory = await ctx.db
      .query("tools")
      .withIndex("by_category", (q) => q.eq("category", tool.category))
      .collect();

    const related = sameCategory
      .filter((t) => t._id !== tool._id && t.status === "published")
      .sort((a, b) => {
        const overlap = (x: typeof a) => x.tags.filter((tag) => tool.tags.includes(tag)).length;
        return overlap(b) - overlap(a) || a.name.localeCompare(b.name, "es");
      })
      .slice(0, 4)
      .map((t) => ({
        _id: t._id,
        name: t.name,
        slug: t.slug,
        shortDescription: t.shortDescription,
        category: t.category,
        tags: t.tags,
        pricing: t.pricing,
      }));

    return {
      ...tool,
      votes: votes.length,
      related,
    };
  },
});

/** My vote + favorite state for one tool. */
export const myInteraction = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { voted: false, favorited: false };
    const tool = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!tool) return { voted: false, favorited: false };
    const vote = await ctx.db
      .query("toolVotes")
      .withIndex("by_tool_user", (q) => q.eq("toolId", tool._id).eq("userId", userId))
      .unique();
    const fav = await ctx.db
      .query("toolFavorites")
      .withIndex("by_tool_user", (q) => q.eq("toolId", tool._id).eq("userId", userId))
      .unique();
    return { voted: vote !== null, favorited: fav !== null };
  },
});

/** Toggle a vote (one per user per tool). */
export const toggleVote = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Inicia sesión para votar.");
    const tool = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!tool) throw new Error("Herramienta no encontrada.");

    const existing = await ctx.db
      .query("toolVotes")
      .withIndex("by_tool_user", (q) => q.eq("toolId", tool._id).eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { voted: false };
    }
    await ctx.db.insert("toolVotes", { toolId: tool._id, userId, createdAt: Date.now() });
    return { voted: true };
  },
});

/** Toggle a favorite (one per user per tool). */
export const toggleFavorite = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Inicia sesión para guardar favoritos.");
    const tool = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!tool) throw new Error("Herramienta no encontrada.");

    const existing = await ctx.db
      .query("toolFavorites")
      .withIndex("by_tool_user", (q) => q.eq("toolId", tool._id).eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    }
    await ctx.db.insert("toolFavorites", { toolId: tool._id, userId, createdAt: Date.now() });
    return { favorited: true };
  },
});

/** My favorites with tool data (dashboard). */
export const myFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const favs = await ctx.db
      .query("toolFavorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    favs.sort((a, b) => b.createdAt - a.createdAt);
    const out = [];
    for (const fav of favs) {
      const tool = await ctx.db.get(fav.toolId);
      if (tool && tool.status === "published") {
        out.push({ _id: tool._id, name: tool.name, slug: tool.slug, shortDescription: tool.shortDescription, category: tool.category, favoritedAt: fav.createdAt });
      }
    }
    return out;
  },
});

/** Stats for the home page (counts + per-category distribution). */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.db.query("tools").collect();
    const published = tools.filter((t) => t.status === "published");
    const votes = await ctx.db.query("toolVotes").collect();
    const byCategory = new Map<string, number>();
    for (const t of published) {
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1);
    }
    return {
      total: published.length,
      votes: votes.length,
      categories: [...byCategory.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  },
});

// ---------------------------------------------------------------------------
// Submission → tool publication
// ---------------------------------------------------------------------------

/**
 * Publish an approved submission as a directory tool. Unlike the resource
 * publication path, this lands the submission in the tools directory with
 * pending→published lifecycle handled by the admin.
 */
export const publishSubmissionAsTool = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, { submissionId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");

    const sub = await ctx.db.get(submissionId);
    if (!sub) throw new Error("Envío no encontrado.");

    // Unique slug: base from name; disambiguate with -2, -3…
    const base = slugify(sub.title) || `tool-${Date.now()}`;
    let slug = base;
    let n = 2;
    // Note: index lookup per candidate is fine — admin operation, low frequency.
    while (await ctx.db.query("tools").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()) {
      slug = `${base}-${n++}`;
    }

    const toolId = await ctx.db.insert("tools", {
      name: sub.title,
      slug,
      shortDescription: sub.tagline,
      description: sub.description,
      website: sub.url,
      category: mapSubmitCategoryToDirectory(sub.category),
      tags: sub.tags.length > 0 ? sub.tags : ["lunar"],
      pricing: pricingFromSubmitCategory(sub.pricing),
      pricingDetails: sub.pricingDetails ?? "",
      platforms: sub.platforms,
      features: sub.features,
      logoStorageId: sub.logoStorageId,
      screenshotStorageId: sub.thumbStorageId ?? sub.gallery[0]?.storageId,
      author: sub.authorHandle,
      featured: false,
      trending: false,
      verified: sub.senderRole === "creator",
      status: "published",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(submissionId, { status: "published" });
    return toolId;
  },
});

// ---------------------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------------------

/** Admin: full tool list (any status). */
export const listAllForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    const tools = await ctx.db.query("tools").collect();
    const votesByTool = countByTool(await ctx.db.query("toolVotes").collect());
    return tools
      .map((t) => ({ ...t, votes: votesByTool.get(t._id) ?? 0 }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Admin: create. */
export const create = mutation({
  args: toolValidator,
  handler: async (ctx, data) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");

    const base = data.slug?.trim() ? slugify(data.slug) : slugify(data.name);
    let slug = base || `tool-${Date.now()}`;
    let n = 2;
    while (await ctx.db.query("tools").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()) {
      slug = `${base}-${n++}`;
    }

    const now = Date.now();
    return await ctx.db.insert("tools", {
      ...data,
      slug,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Admin: patch any field. */
export const update = mutation({
  args: {
    id: v.id("tools"),
    name: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    pricing: v.optional(toolValidator.fields.pricing),
    pricingDetails: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    trending: v.optional(v.boolean()),
    verified: v.optional(v.boolean()),
    status: v.optional(toolValidator.fields.status),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

/** Admin: delete tool (votes/favorites cascade manually). */
export const remove = mutation({
  args: { id: v.id("tools") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");

    const votes = await ctx.db.query("toolVotes").withIndex("by_tool", (q) => q.eq("toolId", id)).collect();
    for (const vote of votes) await ctx.db.delete(vote._id);
    const favs = await ctx.db.query("toolFavorites").withIndex("by_tool", (q) => q.eq("toolId", id)).collect();
    for (const fav of favs) await ctx.db.delete(fav._id);
    await ctx.db.delete(id);
  },
});

// ---------------------------------------------------------------------------
// Seed — one-shot idempotent import of the curated catalog. Requires an
// authenticated admin (called once from the UI) OR runs via a scheduled job.
// ---------------------------------------------------------------------------

const seedToolValidator = v.object({
  name: v.string(),
  shortDescription: v.string(),
  description: v.string(),
  website: v.string(),
  category: v.string(),
  tags: v.array(v.string()),
  pricing: v.union(v.literal("free"), v.literal("freemium"), v.literal("open-source"), v.literal("paid")),
  pricingDetails: v.string(),
  platforms: v.array(v.string()),
  features: v.array(v.string()),
  verified: v.boolean(),
  featured: v.boolean(),
  trending: v.boolean(),
  createdAt: v.number(),
});

/** Internal: insert one tool if its slug is free. Returns "inserted"|"exists". */
export const seedOne = internalMutation({
  args: { tool: seedToolValidator },
  handler: async (ctx, { tool }) => {
    const slug = slugify(tool.name);
    const existing = await ctx.db.query("tools").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (existing) return "exists" as const;
    await ctx.db.insert("tools", {
      ...tool,
      slug,
      status: "published",
      createdAt: tool.createdAt,
      updatedAt: tool.createdAt,
    });
    return "inserted" as const;
  },
});

/**
 * Idempotent seed trigger. Safe to call from any visitor (including
 * anonymous sessions): it no-ops entirely when the directory already has
 * data, and it only ever inserts the curated catalog payloads the client
 * passes in — nothing user-controlled is stored unvalidated.
 */
export const seedFromCatalog = mutation({
  args: { tools: v.array(seedToolValidator) },
  handler: async (ctx, { tools }) => {
    const anyTool = await ctx.db.query("tools").first();
    if (anyTool !== null) return { skipped: true, inserted: 0 };
    let inserted = 0;
    for (const tool of tools) {
      const slug = slugify(tool.name);
      const existing = await ctx.db.query("tools").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
      if (!existing) {
        await ctx.db.insert("tools", {
          ...tool,
          category: mapSeedCategoryToDirectory(tool.category),
          slug,
          status: "published",
          createdAt: tool.createdAt,
          updatedAt: tool.createdAt,
        });
        inserted++;
      }
    }
    return { skipped: false, inserted };
  },
});
