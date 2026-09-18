/**
 * Resolver for saved-collection entries: turns a `${kind}:${id}` entry into
 * display info and a link, using the existing data layers. Resource entries
 * live in Convex, so they are resolved by the page via the published list.
 */

import type { SaveKind } from "@/hooks/collections-core";
import { getToolById } from "@/data/tools";
import { INSPIRATION } from "@/data/inspiration";
import {
  getArticleBySlug,
  getCreatorBySlug,
  getProjectBySlug,
} from "@/data/community";

export interface ResolvedEntry {
  key: string;
  kind: SaveKind;
  /** null for inspiration items, which have no detail page. */
  href: string | null;
  /** null for resources, whose title comes from the Convex query. */
  title: string | null;
  meta: string;
  gradient?: string;
  demo?: boolean;
  /** True when the referenced entity no longer exists in the data layer. */
  missing?: boolean;
}

export const KIND_LABEL: Record<SaveKind, string> = {
  tool: "herramienta",
  resource: "recurso",
  inspiration: "inspiración",
  project: "proyecto",
  article: "artículo",
  creator: "creador",
};

export function resolveEntry(kind: SaveKind, id: string): ResolvedEntry {
  const base = { key: `${kind}:${id}`, kind };

  if (kind === "tool") {
    const tool = getToolById(id);
    return {
      ...base,
      href: tool ? `/tools/${tool.slug}` : null,
      title: tool?.name ?? "Herramienta no disponible",
      meta: tool ? `${tool.category} · ${tool.pricing}` : "referencia rota",
      missing: !tool,
    };
  }
  if (kind === "project") {
    const project = getProjectBySlug(id);
    return {
      ...base,
      href: project ? `/projects/${project.slug}` : null,
      title: project?.title ?? "Proyecto no disponible",
      meta: project ? `${project.category} · ${project.year} · demo` : "referencia rota",
      gradient: project?.gradient,
      demo: project?.demo,
      missing: !project,
    };
  }
  if (kind === "article") {
    const article = getArticleBySlug(id);
    return {
      ...base,
      href: article ? `/articles/${article.slug}` : null,
      title: article?.title ?? "Artículo no disponible",
      meta: article ? `${article.category} · ${article.readingMinutes} min · demo` : "referencia rota",
      demo: article?.demo,
      missing: !article,
    };
  }
  if (kind === "creator") {
    const creator = getCreatorBySlug(id);
    return {
      ...base,
      href: creator ? `/creators/${creator.slug}` : null,
      title: creator?.name ?? "Creador no disponible",
      meta: creator ? `${creator.type} · demo` : "referencia rota",
      demo: creator?.demo,
      missing: !creator,
    };
  }
  if (kind === "inspiration") {
    const item = INSPIRATION.find((i) => i.id === id);
    return {
      ...base,
      href: null,
      title: item?.title ?? "Referencia no disponible",
      meta: item ? `${item.category} · ${item.year} · demo` : "referencia rota",
      gradient: item?.gradient,
      demo: item?.demo,
      missing: !item,
    };
  }

  // resource — resolved against the Convex catalog by the page.
  return {
    ...base,
    href: `/resource/${id}`,
    title: null,
    meta: "recurso de la comunidad",
  };
}
