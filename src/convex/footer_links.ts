import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ROLES } from "./schema";
import {
  FOOTER_ICON_KEYS,
  FOOTER_LINK_GROUPS,
  categoryRank,
} from "../data/footer-links";

/** Admin-gate (misma política que resources.ts). */
async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in.");
  const user = await ctx.db.get(userId);
  if (user?.role !== ROLES.ADMIN) throw new Error("Admins only.");
  return userId;
}

/** Validación compartida por create/update (URL http(s) + icono conocido). */
function assertValidInput(input: {
  category: string;
  name: string;
  url: string;
  handle: string;
  description: string;
  icon: string;
}) {
  let parsed: URL;
  try {
    parsed = new URL(input.url);
  } catch {
    throw new Error("La URL debe ser una dirección absoluta válida.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("La URL debe usar http o https.");
  }
  if (!(FOOTER_ICON_KEYS as readonly string[]).includes(input.icon)) {
    throw new Error("Icono desconocido.");
  }
  if (input.category.trim().length === 0 || input.category.length > 40) {
    throw new Error("Categoría inválida (1–40 caracteres).");
  }
  if (input.name.trim().length === 0 || input.name.length > 60) {
    throw new Error("Nombre inválido (1–60 caracteres).");
  }
  if (input.handle.length > 60) throw new Error("Handle demasiado largo.");
  if (input.description.length > 160) {
    throw new Error("Descripción demasiado larga (máx. 160).");
  }
  if (input.url.length > 500) throw new Error("URL demasiado larga.");
}

/**
 * Agrupa filas de `footerLinks` en el orden editorial de categorías
 * (CATEGORY_ORDER; desconocidas al final) y, dentro de cada categoría,
 * por sortOrder y nombre. Exportado puro para tests.
 */
export function groupFooterRows<
  T extends { category: string; name: string; sortOrder: number },
>(rows: readonly T[]): Array<{ category: string; links: T[] }> {
  const sorted = [...rows].sort(
    (a, b) =>
      categoryRank(a.category) - categoryRank(b.category) ||
      a.sortOrder - b.sortOrder ||
      a.name.localeCompare(b.name),
  );
  const groups: Array<{ category: string; links: T[] }> = [];
  for (const row of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.category === row.category) {
      last.links.push(row);
    } else {
      groups.push({ category: row.category, links: [row] });
    }
  }
  return groups;
}

/**
 * Query pública del footer: enlaces visibles agrupados por categoría.
 * El cliente mantiene un fallback estático mientras carga o si la tabla
 * está vacía (no sembrada).
 */
export const getGroups = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("footerLinks")
      .withIndex("by_visible", (q) => q.eq("visible", true))
      .collect();
    return groupFooterRows(rows).map((group) => ({
      category: group.category,
      links: group.links.map((l) => ({
        name: l.name,
        url: l.url,
        handle: l.handle,
        description: l.description,
        icon: l.icon,
      })),
    }));
  },
});

/** Listado completo para /admin (incluye ocultos). */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("footerLinks").collect();
    return rows.sort(
      (a, b) =>
        categoryRank(a.category) - categoryRank(b.category) ||
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name),
    );
  },
});

/** Crea un enlace; sortOrder = máximo actual + 1. */
export const create = mutation({
  args: {
    category: v.string(),
    name: v.string(),
    url: v.string(),
    handle: v.string(),
    description: v.string(),
    icon: v.string(),
    visible: v.boolean(),
  },
  handler: async (ctx, input) => {
    await requireAdmin(ctx);
    assertValidInput(input);
    const all = await ctx.db.query("footerLinks").collect();
    const maxOrder = all.reduce((m, r) => Math.max(m, r.sortOrder), 0);
    await ctx.db.insert("footerLinks", {
      category: input.category.trim(),
      name: input.name.trim(),
      url: input.url.trim(),
      handle: input.handle.trim(),
      description: input.description.trim(),
      icon: input.icon,
      sortOrder: maxOrder + 1,
      visible: input.visible,
      createdAt: Date.now(),
    });
  },
});

/** Edita un enlace existente (campos completos + orden + visibilidad). */
export const update = mutation({
  args: {
    id: v.id("footerLinks"),
    category: v.string(),
    name: v.string(),
    url: v.string(),
    handle: v.string(),
    description: v.string(),
    icon: v.string(),
    sortOrder: v.number(),
    visible: v.boolean(),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("El enlace no existe.");
    assertValidInput(fields);
    await ctx.db.patch(id, {
      category: fields.category.trim(),
      name: fields.name.trim(),
      url: fields.url.trim(),
      handle: fields.handle.trim(),
      description: fields.description.trim(),
      icon: fields.icon,
      sortOrder: fields.sortOrder,
      visible: fields.visible,
    });
  },
});

/** Elimina un enlace. */
export const remove = mutation({
  args: { id: v.id("footerLinks") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

/** Alterna la visibilidad sin abrir el formulario. */
export const setVisible = mutation({
  args: { id: v.id("footerLinks"), visible: v.boolean() },
  handler: async (ctx, { id, visible }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { visible });
  },
});

/**
 * ADMIN-ONLY seed idempotente: siembra FOOTER_LINK_GROUPS (fuente única en
 * src/data/footer-links.ts) solo si la tabla está vacía. Patrón igual a
 * tools.seedAdminFromCatalog: el payload vive en el servidor.
 */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const any = await ctx.db.query("footerLinks").first();
    if (any !== null) return { skipped: true, inserted: 0 };

    let order = 0;
    let inserted = 0;
    const now = Date.now();
    for (const group of FOOTER_LINK_GROUPS) {
      for (const link of group.links) {
        await ctx.db.insert("footerLinks", {
          category: group.category,
          name: link.name,
          url: link.url,
          handle: link.handle,
          description: link.description,
          icon: link.icon,
          sortOrder: order++,
          visible: true,
          createdAt: now,
        });
        inserted++;
      }
    }
    return { skipped: false, inserted };
  },
});
