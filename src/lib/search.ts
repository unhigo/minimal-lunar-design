/**
 * Global search across the whole discovery ecosystem.
 * MVP: combines the static data layers (tools, inspiration) with the live
 * Convex resources catalog. Kept UI-agnostic so a future server-side search
 * API can replace `searchAll` without touching components.
 */

import { searchTools, TOOLS } from "@/data/tools";
import {
  searchInspiration,
  INSPIRATION,
  type InspirationItem,
} from "@/data/inspiration";
import {
  searchArticles,
  searchProjects,
  searchCreators,
  ARTICLES,
  PROJECTS,
  CREATORS,
  type Article,
  type Project,
  type Creator,
} from "@/data/community";
import type { Tool } from "@/data/tools";

export interface ConvexResourceLike {
  _id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  authorName?: string;
  coverUrl?: string | null;
}

export type SearchHit =
  | { kind: "tool"; tool: Tool }
  | { kind: "resource"; resource: ConvexResourceLike }
  | { kind: "inspiration"; item: InspirationItem }
  | { kind: "project"; project: Project }
  | { kind: "article"; article: Article }
  | { kind: "creator"; creator: Creator };

export interface SearchSummary {
  tools: number;
  resources: number;
  inspiration: number;
  projects: number;
  articles: number;
  creators: number;
}

export function searchAll(
  query: string,
  resources: ConvexResourceLike[] = [],
): { hits: SearchHit[]; summary: SearchSummary } {
  const tools = searchTools(query).slice(0, 6);
  const items = searchInspiration(query).slice(0, 6);
  const projects = searchProjects(query).slice(0, 4);
  const articles = searchArticles(query).slice(0, 4);
  const creators = searchCreators(query).slice(0, 4);
  const needle = query.trim().toLowerCase();
  const matchedResources = needle
    ? resources.filter(
        (r) =>
          r.title.toLowerCase().includes(needle) ||
          r.description.toLowerCase().includes(needle) ||
          r.category.toLowerCase().includes(needle),
      )
    : resources;

  const hits: SearchHit[] = [
    ...tools.map((t) => ({ kind: "tool" as const, tool: t })),
    ...matchedResources.slice(0, 6).map((r) => ({
      kind: "resource" as const,
      resource: r,
    })),
    ...projects.map((p) => ({ kind: "project" as const, project: p })),
    ...articles.map((a) => ({ kind: "article" as const, article: a })),
    ...creators.map((c) => ({ kind: "creator" as const, creator: c })),
    ...items.map((i) => ({ kind: "inspiration" as const, item: i })),
  ];

  return {
    hits,
    summary: {
      tools: searchTools(query).length,
      resources: matchedResources.length,
      inspiration: searchInspiration(query).length,
      projects: searchProjects(query).length,
      articles: searchArticles(query).length,
      creators: searchCreators(query).length,
    },
  };
}

/** Counts for the home "ecosystem" strip. */
export function ecosystemCounts(resourcesCount = 0) {
  return {
    tools: TOOLS.length,
    inspiration: INSPIRATION.length,
    resources: resourcesCount,
    projects: PROJECTS.length,
    articles: ARTICLES.length,
    creators: CREATORS.length,
  };
}
