import { BRAND } from "@/lib/brand";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { PROJECT_CATEGORIES, searchProjects } from "@/data/community";
import { SiteHeader } from "@/components/SiteHeader";
import { FilterChips } from "@/components/FilterChips";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useCollections } from "@/hooks/use-collections";
import { Bookmark } from "lucide-react";

/** Reusable project card — same visual language as ToolCard. */
export function ProjectCard({ slug }: { slug: string }) {
  const project = useMemo(
    () => searchProjects("").find((p) => p.slug === slug),
    [slug],
  );
  const { toggle, isSaved } = useCollections();

  if (!project) {
    return (
      <div className="border border-dashed border-border/70 p-5">
        <p className="text-[13px] text-muted-foreground">
          Proyecto no disponible.
        </p>
      </div>
    );
  }

  const saved = isSaved("project", project.slug);

  return (
    <div className="group relative border border-border/60 bg-background transition-colors hover:bg-muted/40">
      <Link to={`/projects/${project.slug}`} className="block">
        <div
          className="w-full border-b border-border/60"
          style={{
            background: project.gradient,
            aspectRatio: project.aspect,
          }}
        />
        <div className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {project.category} · {project.year} · demo
          </p>
          <h3 className="mt-2 text-[15px] font-medium leading-snug">
            {project.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
        <span className="truncate font-mono text-[10px] text-muted-foreground">
          {project.tools.join(" · ")}
        </span>
        <button
          onClick={() => toggle("project", project.slug)}
          aria-label={saved ? "Quitar de guardados" : "Guardar proyecto"}
          aria-pressed={saved}
          className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bookmark
            className={`size-3.5 ${saved ? "fill-current text-foreground" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}

export default function Projects() {
  usePageMeta({
    title: `Proyectos — ${BRAND.mark}`,
    description:
      "Proyectos de demostración que enlazan herramientas, creadores y artículos: ve de la referencia al proceso.",
    path: "/projects",
  });

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const results = useMemo(
    () => searchProjects(query, category),
    [query, category],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Trabajo
        </p>
        <h1 className="mt-3 h1-editorial tracking-tight">
          Proyectos
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Proyectos demo que muestran el descubrimiento en contexto: cada ficha
          conecta las herramientas usadas, su creador y artículos relacionados.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar proyectos: identidad, render, tipografía…"
              aria-label="Buscar proyectos"
              className="h-11 w-full rounded-sm border border-border bg-transparent pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
            />
          </div>
          <FilterChips
            options={PROJECT_CATEGORIES}
            value={category}
            onChange={setCategory}
            allLabel="todas"
            ariaLabel="Filtrar proyectos por categoría"
          />
        </div>

        <p className="mt-10 font-mono text-[11px] text-muted-foreground">
          {results.length} {results.length === 1 ? "proyecto" : "proyectos"}
          {category !== "all" && ` en ${category}`}
          {query && ` para “${query}”`}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <ProjectCard key={p.slug} slug={p.slug} />
          ))}
        </div>
        {results.length === 0 && (
          <div className="mt-4 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
              Sin proyectos con esos filtros.
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
