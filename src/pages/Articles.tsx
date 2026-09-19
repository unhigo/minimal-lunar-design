import { BRAND } from "@/lib/brand";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { ARTICLE_CATEGORIES, searchArticles } from "@/data/community";
import { SiteHeader } from "@/components/SiteHeader";
import { FilterChips } from "@/components/FilterChips";
import { usePageMeta } from "@/hooks/use-page-meta";
import { formatArticleDate } from "@/data/community";

export default function Articles() {
  usePageMeta({
    title: `Artículos — ${BRAND.mark}`,
    description:
      "Guías y reflexiones demo sobre licencias, color, tipografía e imagen, enlazadas con las herramientas del directorio.",
    path: "/articles",
  });

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const results = useMemo(
    () => searchArticles(query, category),
    [query, category],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Lecturas
        </p>
        <h1 className="mt-3 h1-editorial tracking-tight">
          Artículos
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Contenido demo con autores ficticios: cada pieza enlaza con las
          herramientas reales que menciona.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar artículos: licencias, color, tipografía…"
              aria-label="Buscar artículos"
              className="h-11 w-full rounded-sm border border-border bg-transparent pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
            />
          </div>
          <FilterChips
            options={ARTICLE_CATEGORIES}
            value={category}
            onChange={setCategory}
            allLabel="todas"
            ariaLabel="Filtrar artículos por categoría"
          />
        </div>

        <p className="mt-10 font-mono text-[11px] text-muted-foreground">
          {results.length} {results.length === 1 ? "artículo" : "artículos"}
          {category !== "all" && ` en ${category}`}
          {query && ` para “${query}”`}
        </p>

        <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
          {results.map((a) => (
            <li key={a.slug}>
              <Link
                to={`/articles/${a.slug}`}
                className="group block py-5 transition-colors"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {a.category} · {formatArticleDate(a.date)} ·{" "}
                  {a.readingMinutes} min · demo
                </p>
                <h2 className="mt-2 text-[17px] font-medium leading-snug transition-colors group-hover:text-muted-foreground">
                  {a.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                  {a.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        {results.length === 0 && (
          <div className="mt-4 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
              Sin artículos con esos filtros.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-4xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">

          </p>
        </div>
      </footer>
    </div>
  );
}
