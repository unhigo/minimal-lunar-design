import { BRAND } from "@/lib/brand";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useAuth } from "@/hooks/use-auth";
import { useDirectorySeed } from "@/hooks/use-directory-seed";
import { DirectoryCard } from "@/components/DirectoryCard";
import { toast } from "sonner";

const PAGE_SIZE = 12;

const SORTS = [
  { id: "popular", label: "popularidad" },
  { id: "recent", label: "recientes" },
  { id: "name", label: "nombre" },
] as const;

const PRICINGS = [
  { id: "all", label: "todos" },
  { id: "free", label: "gratis" },
  { id: "freemium", label: "freemium" },
  { id: "open-source", label: "open source" },
  { id: "paid", label: "de pago" },
] as const;

const DIRECTORY_CATEGORIES = [
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

export default function Tools() {
  usePageMeta({
    title: `Herramientas — ${BRAND.mark}`,
    description:
      "Directorio de herramientas lunares, astronómicas, cartográficas y de diseño: búsqueda instantánea, filtros por categoría y tipo, votos de la comunidad.",
    path: "/tools",
  });

  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const category = params.get("cat") ?? "all";
  const pricing = params.get("pricing") ?? "all";
  const sort = (params.get("sort") ?? "popular") as (typeof SORTS)[number]["id"];
  const page = Math.max(0, Number(params.get("page") ?? "0") || 0);

  const [input, setInput] = useState(query);
  const { isAuthenticated } = useAuth();
  // First-visit seed: fills the directory from the curated catalog.
  useDirectorySeed();

  // Keep the visible input in sync with the URL query (browser back/forward).
  useEffect(() => setInput(query), [query]);

  const setParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(params);
    if (value === defaultValue) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page"); // filter change → back to first page
    setParams(next, { replace: true });
  };

  const results = useQuery(api.tools.listPublished, {
    search: query || undefined,
    category: category !== "all" ? category : undefined,
    pricing: pricing !== "all" ? pricing : undefined,
    sort,
    cursor: String(page * PAGE_SIZE),
    numItems: PAGE_SIZE,
  });

  const toggleFavorite = useMutation(api.tools.toggleFavorite);

  const handleToggleFavorite = (tool: { slug: string }) => {
    if (!isAuthenticated) {
      toast("Inicia sesión para guardar favoritos");
      return;
    }
    toggleFavorite({ slug: tool.slug }).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    });
  };

  const tools = results?.page ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Directorio
        </p>
        <h1 className="mt-3 h1-editorial tracking-tight">
          Herramientas
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Catálogo vivo en base de datos: herramientas lunares, astronómicas,
          cartográficas y de diseño, con votos de la comunidad.
        </p>

        {/* Search + filters */}
        <div className="mt-8 flex flex-col gap-4">
          <form
            className="relative max-w-xl"
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", input.trim(), "");
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Buscar: luna, mapa, color, figma…"
              aria-label="Buscar herramientas"
              className="h-11 w-full rounded-sm border border-border bg-transparent pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
            />
          </form>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Categories */}
            <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
              <button
                onClick={() => setParam("cat", "all", "all")}
                aria-pressed={category === "all"}
                className={`rounded-sm border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                  category === "all"
                    ? "border-foreground/50 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                todas
              </button>
              {DIRECTORY_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setParam("cat", c, "all")}
                  aria-pressed={category === c}
                  className={`rounded-sm border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                    category === c
                      ? "border-foreground/50 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Pricing */}
            <select
              value={pricing}
              onChange={(e) => setParam("pricing", e.target.value, "all")}
              aria-label="Filtrar por tipo de precio"
              className="h-8 rounded-sm border border-border bg-background px-2 font-mono text-[11px] outline-none focus:border-foreground/50"
            >
              {PRICINGS.map((p) => (
                <option key={p.id} value={p.id}>
                  precio: {p.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value, "popular")}
              aria-label="Ordenar"
              className="h-8 rounded-sm border border-border bg-background px-2 font-mono text-[11px] outline-none focus:border-foreground/50"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  orden: {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result meta */}
        <p className="mt-10 font-mono text-[11px] text-muted-foreground">
          {results === undefined
            ? "CARGANDO…"
            : `${tools.length}${query ? ` resultados para “${query}”` : " herramientas en el directorio"}${category !== "all" ? ` · ${category}` : ""}`}
        </p>

        {/* Grid */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <DirectoryCard
              key={t._id}
              tool={t}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>

        {results === undefined && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse border border-border/40" />
            ))}
          </div>
        )}

        {results !== undefined && tools.length === 0 && (
          <div className="mt-4 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
              Nada por aquí. Prueba otra búsqueda, categoría o limpia los filtros.
            </p>
          </div>
        )}

        {/* Pagination */}
        {results !== undefined && tools.length > 0 && (
          <nav aria-label="Paginación" className="mt-10 flex items-center justify-between border-t border-border/60 pt-6">
            <button
              disabled={page === 0}
              onClick={() => setParam("page", String(Math.max(0, page - 1)), "0")}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border px-4 text-[13px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" /> Anterior
            </button>
            <span className="font-mono text-[11px] text-muted-foreground">
              página {page + 1}
            </span>
            <button
              disabled={results.isDone}
              onClick={() => setParam("page", String(page + 1), "0")}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border px-4 text-[13px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente <ChevronRight className="size-3.5" />
            </button>
          </nav>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">
            {BRAND.mark} · {BRAND.tagline}
          </p>
        </div>
      </footer>
    </div>
  );
}
