import { BRAND } from "@/lib/brand";
import { Link, useParams } from "react-router";
import { ArrowLeft, Bookmark, ExternalLink } from "lucide-react";
import {
  getCreatorBySlug,
  getProjectBySlug,
  relatedProjects,
} from "@/data/community";
import { getToolBySlug } from "@/data/tools";
import { SiteHeader } from "@/components/SiteHeader";
import { ProjectCard } from "@/pages/Projects";
import NotFound from "@/pages/NotFound";
import { useCollections } from "@/hooks/use-collections";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProjectBySlug(slug) : undefined;
  const { toggle, isSaved } = useCollections();

  usePageMeta({
    title: project
      ? `${project.title} — Proyectos · ${BRAND.mark}`
      : "Proyecto no encontrado",
    description: project?.description ?? "",
    path: `/projects/${slug ?? ""}`,
  });

  if (!project) {
    return <NotFound />;
  }

  const saved = isSaved("project", project.slug);
  const creator = getCreatorBySlug(project.creatorSlug);
  const tools = project.tools
    .map((s) => getToolBySlug(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const related = relatedProjects(project);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Proyectos
        </Link>

        {/* Cover */}
        <div
          className="mt-8 w-full border border-border/60"
          style={{
            background: project.gradient,
            aspectRatio: "16/9",
          }}
        />

        {/* Header */}
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              {project.category} · {project.year} · demo
            </p>
            <h1 className="mt-3 h1-editorial tracking-tight">
              {project.title}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          </div>
          <button
            onClick={() => toggle("project", project.slug)}
            aria-pressed={saved}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-sm border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bookmark
              className={`size-4 ${saved ? "fill-current text-foreground" : ""}`}
            />
            {saved ? "Guardado" : "Guardar"}
          </button>
        </div>

        {/* Story */}
        <section className="mt-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            El proceso
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground/90">
            {project.story}
          </p>
        </section>

        {/* Facts grid: creator + tools */}
        <div className="mt-10 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Creador
            </p>
            {creator ? (
              <Link
                to={`/creators/${creator.slug}`}
                className="mt-2 block text-sm transition-colors hover:text-muted-foreground"
              >
                {creator.name}
                <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                  {creator.username} · demo
                </span>
              </Link>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">—</p>
            )}
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Herramientas usadas
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tools.map((t) => (
                <Link
                  key={t!.slug}
                  to={`/tools/${t!.slug}`}
                  className="inline-flex items-center gap-1 rounded-sm border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {t!.name}
                  <ExternalLink className="size-3" />
                </Link>
              ))}
              {tools.length === 0 && (
                <p className="text-[13px] text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </div>

        {/* Interlinking: articles about this kind of work */}
        <section className="mt-14">
          <h2 className="text-lg font-light tracking-tight">En la plataforma</h2>
          <div className="mt-5 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-3">
            <Link
              to={`/tools?category=${encodeURIComponent(project.category)}`}
              className="group bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                herramientas
              </p>
              <h3 className="mt-3 text-sm font-medium">
                Herramientas de {project.category}
              </h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Directorio con web oficial y licencia.
              </p>
            </Link>
            <Link
              to={`/creators/${creator?.slug ?? ""}`}
              className="group bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                creadores
              </p>
              <h3 className="mt-3 text-sm font-medium">Su creador</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Perfil, proyectos y artículos.
              </p>
            </Link>
            <Link
              to={`/inspiration?tag=${encodeURIComponent(project.tags[0] ?? project.category)}`}
              className="group bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                inspiración
              </p>
              <h3 className="mt-3 text-sm font-medium">Referencias afines</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Disciplina: {project.tags[0] ?? project.category}.
              </p>
            </Link>
          </div>
        </section>

        {/* Related projects */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-light tracking-tight">
              Proyectos relacionados
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProjectCard key={p.slug} slug={p.slug} />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-4xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">
            {BRAND.mark} · {BRAND.tagline}
          </p>
        </div>
      </footer>
    </div>
  );
}
