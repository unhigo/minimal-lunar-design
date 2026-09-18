import { BRAND } from "@/lib/brand";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Search, X } from "lucide-react";
import { searchAll, type SearchHit } from "@/lib/search";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatPrice } from "@/lib/catalog";

const RECENT_KEY = "mld.recent-searches.v1";

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  if (!q.trim()) return;
  const next = [q, ...loadRecent().filter((s) => s !== q)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

const KIND_LABEL: Record<SearchHit["kind"], string> = {
  tool: "herramienta",
  resource: "recurso",
  inspiration: "inspiración",
  project: "proyecto",
  article: "artículo",
  creator: "creador",
};

function HitCard({ hit }: { hit: SearchHit }) {
  if (hit.kind === "tool") {
    return (
      <Link
        to={`/tools/${hit.tool.slug}`}
        className="group flex flex-col border border-border/60 bg-background p-5 transition-colors hover:bg-muted/40"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          herramienta · {hit.tool.category}
        </span>
        <h3 className="mt-3 text-[15px] font-medium">{hit.tool.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
          {hit.tool.shortDescription}
        </p>
      </Link>
    );
  }
  if (hit.kind === "resource") {
    return (
      <Link
        to={`/resource/${hit.resource._id}`}
        className="group flex flex-col overflow-hidden border border-border/60 bg-background transition-colors hover:bg-muted/40"
      >
        {hit.resource.coverUrl ? (
          <img
            src={hit.resource.coverUrl}
            alt=""
            className="h-32 w-full border-b border-border/60 object-cover"
          />
        ) : null}
        <div className="flex flex-1 flex-col p-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            recurso · {hit.resource.category}
          </span>
          <h3 className="mt-3 text-[15px] font-medium">{hit.resource.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
            {hit.resource.description}
          </p>
          <p className="mt-4 font-mono text-[11px] text-muted-foreground">
            {formatPrice(hit.resource.price ?? 0)}
          </p>
        </div>
      </Link>
    );
  }
  if (hit.kind === "project") {
    return (
      <Link
        to={`/projects/${hit.project.slug}`}
        className="group flex flex-col overflow-hidden border border-border/60 bg-background transition-colors hover:bg-muted/40"
      >
        <div
          className="h-32 w-full border-b border-border/60"
          style={{ background: hit.project.gradient }}
        />
        <div className="flex flex-1 flex-col p-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            proyecto · {hit.project.category} · demo
          </span>
          <h3 className="mt-3 text-[15px] font-medium">{hit.project.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
            {hit.project.description}
          </p>
        </div>
      </Link>
    );
  }
  if (hit.kind === "article") {
    return (
      <Link
        to={`/articles/${hit.article.slug}`}
        className="group flex flex-col border border-border/60 bg-background p-5 transition-colors hover:bg-muted/40"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          artículo · {hit.article.category} · demo
        </span>
        <h3 className="mt-3 text-[15px] font-medium">{hit.article.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
          {hit.article.excerpt}
        </p>
      </Link>
    );
  }
  if (hit.kind === "creator") {
    return (
      <Link
        to={`/creators/${hit.creator.slug}`}
        className="group flex flex-col border border-border/60 bg-background p-5 transition-colors hover:bg-muted/40"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          creador · {hit.creator.type} · demo
        </span>
        <h3 className="mt-3 text-[15px] font-medium">{hit.creator.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
          {hit.creator.bio}
        </p>
      </Link>
    );
  }
  return (
    <div className="flex flex-col overflow-hidden border border-border/60 bg-background transition-colors hover:bg-muted/40">
      <div
        className="h-32 w-full border-b border-border/60"
        style={{ background: hit.item.gradient }}
      />
      <div className="flex flex-1 flex-col p-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          inspiración · {hit.item.category}
        </span>
        <h3 className="mt-3 text-[15px] font-medium">{hit.item.title}</h3>
        <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
          demo · {hit.item.creator} · {hit.item.year}
        </p>
      </div>
    </div>
  );
}

export default function Discover() {
  usePageMeta({
    title: `Discover — ${BRAND.mark}`,
    description:
      "Busca en todo el ecosistema: herramientas de diseño, recursos de la comunidad e inspiración. Un solo buscador.",
    path: "/discover",
  });

  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [input, setInput] = useState(q);
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const { isAuthenticated } = useAuth();

  const resources = useQuery(
    api.resources.listPublished,
    isAuthenticated ? { search: q || undefined } : { search: q || undefined },
  );

  const { hits, summary } = useMemo(() => searchAll(q, resources ?? []), [q, resources]);

  // Keep input in sync when arriving with ?q=
  useEffect(() => setInput(q), [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(input.trim() ? { q: input.trim() } : {});
    if (input.trim()) {
      saveRecent(input.trim());
      setRecent(loadRecent());
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Descubrimiento
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">
          Busca en todo el ecosistema
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Herramientas, recursos de la comunidad e inspiración, con un único
          buscador.
        </p>

        <form onSubmit={submit} className="relative mt-8 max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search tools, projects, resources…"
            aria-label="Buscador global"
            className="h-12 w-full rounded-sm border border-border bg-transparent pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
          />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput("");
                setParams({});
              }}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </form>

        {/* Recent searches */}
        {recent.length > 0 && !q && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              recientes
            </span>
            {recent.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setInput(r);
                  setParams({ q: r });
                }}
                className="rounded-sm border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {q && (
          <>
            <p className="mt-8 font-mono text-[11px] text-muted-foreground">
          {summary.tools} herramientas · {summary.resources} recursos ·{" "}
          {summary.projects} proyectos · {summary.articles} artículos ·{" "}
          {summary.creators} creadores · {summary.inspiration} inspiración para
          “{q}”
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hits.map((hit, i) => (
                <HitCard key={`${hit.kind}-${i}`} hit={hit} />
              ))}
            </div>
            {hits.length === 0 && (
              <div className="mt-4 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
                <p className="text-[13px] text-muted-foreground">
                  Nada por aquí. Prueba con “color”, “figma” o “texturas”.
                </p>
              </div>
            )}
          </>
        )}

        {!q && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/tools"
              className="border border-border/60 p-6 transition-colors hover:bg-muted/40"
            >
              <h2 className="text-[15px] font-medium">Herramientas</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Directorio curado con web oficial y licencia.
              </p>
            </Link>
            <Link
              to="/projects"
              className="border border-border/60 p-6 transition-colors hover:bg-muted/40"
            >
              <h2 className="text-[15px] font-medium">Proyectos</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Trabajos con proceso, herramientas y creador.
              </p>
            </Link>
            <Link
              to="/catalog"
              className="border border-border/60 p-6 transition-colors hover:bg-muted/40"
            >
              <h2 className="text-[15px] font-medium">Recursos</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Mockups, fuentes y texturas de la comunidad.
              </p>
            </Link>
            <Link
              to="/articles"
              className="border border-border/60 p-6 transition-colors hover:bg-muted/40"
            >
              <h2 className="text-[15px] font-medium">Artículos</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Guías enlazadas con las herramientas que citan.
              </p>
            </Link>
            <Link
              to="/creators"
              className="border border-border/60 p-6 transition-colors hover:bg-muted/40"
            >
              <h2 className="text-[15px] font-medium">Creadores</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Quiénes están detrás del trabajo.
              </p>
            </Link>
            <Link
              to="/inspiration"
              className="border border-border/60 p-6 transition-colors hover:bg-muted/40"
            >
              <h2 className="text-[15px] font-medium">Inspiración</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Referencias visuales por disciplina.
              </p>
            </Link>
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
