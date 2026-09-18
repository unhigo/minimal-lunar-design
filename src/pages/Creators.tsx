import { BRAND } from "@/lib/brand";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { CREATOR_TYPES, searchCreators } from "@/data/community";
import { SiteHeader } from "@/components/SiteHeader";
import { FilterChips } from "@/components/FilterChips";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useCollections } from "@/hooks/use-collections";
import { Bookmark } from "lucide-react";

/** Reusable creator card — demo data is labeled honestly. */
export function CreatorCard({ slug }: { slug: string }) {
  const creator = useMemo(
    () => searchCreators("").find((c) => c.slug === slug),
    [slug],
  );
  const { toggle, isSaved } = useCollections();

  if (!creator) {
    return (
      <div className="border border-dashed border-border/70 p-5">
        <p className="text-[13px] text-muted-foreground">
          Creador no disponible.
        </p>
      </div>
    );
  }

  const saved = isSaved("creator", creator.slug);

  return (
    <div className="border border-border/60 bg-background p-5 transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-foreground/30 font-mono text-[11px] text-muted-foreground">
            {creator.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
          <div className="min-w-0">
            <Link
              to={`/creators/${creator.slug}`}
              className="block truncate text-[14px] font-medium transition-colors hover:text-muted-foreground"
            >
              {creator.name}
            </Link>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {creator.username} · demo
            </p>
          </div>
        </div>
        <button
          onClick={() => toggle("creator", creator.slug)}
          aria-label={saved ? "Quitar de guardados" : "Guardar creador"}
          aria-pressed={saved}
          className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bookmark
            className={`size-3.5 ${saved ? "fill-current text-foreground" : ""}`}
          />
        </button>
      </div>
      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {creator.bio}
      </p>
      <p className="mt-3 border-t border-border/60 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {creator.type} · {creator.location}
      </p>
    </div>
  );
}

export default function Creators() {
  usePageMeta({
    title: `Creadores — ${BRAND.mark}`,
    description:
      "Perfiles de demostración con proyectos y artículos enlazados: descubre quién está detrás de cada pieza.",
    path: "/creators",
  });

  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const results = useMemo(() => searchCreators(query, type), [query, type]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Comunidad
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">
          Creadores
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Perfiles demo para mostrar el descubrimiento de personas detrás del
          trabajo: sus proyectos, sus artículos y las herramientas que usan.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar creadores: ilustración, 3d, tipografía…"
              aria-label="Buscar creadores"
              className="h-11 w-full rounded-sm border border-border bg-transparent pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
            />
          </div>
          <FilterChips
            options={CREATOR_TYPES}
            value={type}
            onChange={setType}
            allLabel="todos"
            ariaLabel="Filtrar creadores por tipo"
          />
        </div>

        <p className="mt-10 font-mono text-[11px] text-muted-foreground">
          {results.length} {results.length === 1 ? "creador" : "creadores"}
          {type !== "all" && ` en ${type}`}
          {query && ` para “${query}”`}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <CreatorCard key={c.slug} slug={c.slug} />
          ))}
        </div>
        {results.length === 0 && (
          <div className="mt-4 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
              Sin creadores con esos filtros.
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
