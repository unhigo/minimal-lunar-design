import { BRAND } from "@/lib/brand";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TOOL_CATEGORIES, searchTools, trendingTools } from "@/data/tools";
import { ToolCard } from "@/components/ToolCard";
import { SiteHeader } from "@/components/SiteHeader";
import { FilterChips } from "@/components/FilterChips";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function Tools() {
  usePageMeta({
    title: `Herramientas — ${BRAND.mark}`,
    description:
      "Directorio curado de herramientas de diseño, imagen, color, tipografía y 3D para creadores. Con web oficial, precio verificado y alternativas.",
    path: "/tools",
  });

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const results = useMemo(() => searchTools(query, category), [query, category]);
  const trending = useMemo(
    () => (query || category !== "all" ? [] : trendingTools(4)),
    [query, category],
  );

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
          Herramientas reales con su web oficial, tipo de licencia y
          alternativas relacionadas. Sin rankings inventados.
        </p>

        {/* Search + filters */}
        <div className="mt-8 flex flex-col gap-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar herramientas: figma, color, 3d…"
              aria-label="Buscar herramientas"
              className="h-11 w-full rounded-sm border border-border bg-transparent pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
            />
          </div>
          <FilterChips
            options={TOOL_CATEGORIES}
            value={category}
            onChange={setCategory}
            allLabel="todas"
            ariaLabel="Filtrar herramientas por categoría"
          />
        </div>

        {/* Trending strip */}
        {trending.length > 0 && (
          <section className="mt-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              ↑ Tendencia ahora
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {trending.map((t) => (
                <a
                  key={t.id}
                  href={t.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {t.name}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Results */}
        <p className="mt-10 font-mono text-[11px] text-muted-foreground">
          {results.length}{" "}
          {results.length === 1 ? "herramienta" : "herramientas"}
          {category !== "all" && ` en ${category}`}
          {query && ` para “${query}”`}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
        {results.length === 0 && (
          <div className="mt-4 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
              Sin resultados. Prueba con otra búsqueda o categoría.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">

          </p>
        </div>
      </footer>
    </div>
  );
}
