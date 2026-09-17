import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Check,
  ExternalLink,
  Minus,
  Search,
} from "lucide-react";
import { getToolBySlug, relatedTools } from "@/data/tools";
import {
  articlesAboutTool,
  creatorsUsingTool,
  projectsUsingTool,
} from "@/data/community";
import { searchAll } from "@/lib/search";
import { ToolCard } from "@/components/ToolCard";
import { SiteHeader } from "@/components/SiteHeader";
import NotFound from "@/pages/NotFound";
import { useCollections } from "@/hooks/use-collections";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export default function ToolDetail() {
  const { slug } = useParams<{ slug: string }>();
  const tool = slug ? getToolBySlug(slug) : undefined;
  const { toggle, isSaved } = useCollections();
  const { isAuthenticated } = useAuth();

  // Interlinking: community resources that may pair well with this tool,
  // matched by tag/category overlap.
  const allResources = useQuery(api.resources.listPublished, { search: "" });
  const relatedResources = (allResources ?? [])
    .filter((r) =>
      tool
        ? r.category.toLowerCase().includes(tool.category.toLowerCase()) ||
          tool.tags.some((t) =>
            (r.title + " " + r.description).toLowerCase().includes(t.toLowerCase()),
          )
        : false,
    )
    .slice(0, 3);

  const related = tool ? relatedTools(tool) : [];
  const inspiration = tool
    ? searchAll(tool.tags[0] ?? tool.category).hits.filter(
        (h) => h.kind === "inspiration",
      ).length
    : 0;
  const toolProjects = tool ? projectsUsingTool(tool.slug) : [];
  const toolArticles = tool ? articlesAboutTool(tool.slug) : [];
  const toolCreators = tool ? creatorsUsingTool(tool.slug) : [];

  usePageMeta({
    title: tool
      ? `${tool.name} — Herramientas · Minimal Lunar Design`
      : "Herramienta no encontrada",
    description: tool?.shortDescription ?? "",
    path: `/tools/${slug ?? ""}`,
    jsonLd: tool
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: tool.name,
          description: tool.shortDescription,
          url: tool.website,
          applicationCategory: tool.category,
          offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        }
      : undefined,
  });

  if (!tool) {
    return <NotFound />;
  }

  const saved = isSaved("tool", tool.id);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Herramientas
        </Link>

        {/* Header */}
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {tool.category}
              </span>
              {tool.verified && (
                <span className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  <BadgeCheck className="size-3" /> verificada
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">
              {tool.name}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {tool.description}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <a
              href={tool.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Abrir web
              <ExternalLink className="size-4" />
            </a>
            <button
              onClick={() => toggle("tool", tool.id)}
              aria-pressed={saved}
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bookmark
                className={`size-4 ${saved ? "fill-current text-foreground" : ""}`}
              />
              {saved ? "Guardada" : "Guardar"}
            </button>
          </div>
        </div>

        {/* Facts grid */}
        <div className="mt-10 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Licencia / precio
            </p>
            <p className="mt-2 text-sm">{tool.pricingDetails}</p>
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Plataformas
            </p>
            <p className="mt-2 font-mono text-[12px] text-muted-foreground">
              {tool.platforms.join(" · ")}
            </p>
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Destacable
            </p>
            <ul className="mt-2 space-y-1.5">
              {tool.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px]">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Pros y contras
            </p>
            <ul className="mt-2 space-y-1.5">
              {tool.pros.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[13px]">
                  <Check className="mt-0.5 size-3.5 shrink-0" />
                  {p}
                </li>
              ))}
              {tool.cons.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-2 text-[13px] text-muted-foreground"
                >
                  <Minus className="mt-0.5 size-3.5 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Related tools */}
        <section className="mt-14">
          <h2 className="text-lg font-light tracking-tight">
            Herramientas relacionadas
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>

        {/* Interlinking: platform content related to this tool */}
        <section className="mt-14">
          <h2 className="text-lg font-light tracking-tight">
            En la plataforma
          </h2>
          <div className="mt-5 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {toolProjects.length > 0 && (
              <Link
                to={`/projects?category=${encodeURIComponent(toolProjects[0].category)}`}
                className="group bg-background p-5 transition-colors hover:bg-muted/40"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  proyectos
                </p>
                <h3 className="mt-3 text-sm font-medium">
                  {toolProjects.length} {toolProjects.length === 1 ? "proyecto" : "proyectos"} la usan
                </h3>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {toolProjects
                    .slice(0, 2)
                    .map((p) => p.title)
                    .join(" · ")}
                </p>
              </Link>
            )}
            {toolArticles.length > 0 && (
              <Link
                to={`/articles/${toolArticles[0].slug}`}
                className="group bg-background p-5 transition-colors hover:bg-muted/40"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  artículos
                </p>
                <h3 className="mt-3 text-sm font-medium">
                  {toolArticles.length} {toolArticles.length === 1 ? "lectura" : "lecturas"}
                </h3>
                <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">
                  {toolArticles[0].title}
                </p>
              </Link>
            )}
            {toolCreators.length > 0 && (
              <Link
                to={`/creators/${toolCreators[0].slug}`}
                className="group bg-background p-5 transition-colors hover:bg-muted/40"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  creadores
                </p>
                <h3 className="mt-3 text-sm font-medium">
                  {toolCreators.length} en su flujo de trabajo
                </h3>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {toolCreators
                    .slice(0, 2)
                    .map((c) => c.name)
                    .join(" · ")}
                </p>
              </Link>
            )}
            <Link
              to={`/catalog?search=${encodeURIComponent(tool.name)}`}
              className="group bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <Search className="size-4 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-medium">
                Recursos de la comunidad
              </h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {relatedResources.length > 0
                  ? `${relatedResources.length} relacionados con ${tool.name}`
                  : "Busca recursos que la usen o la complementen."}
              </p>
            </Link>
            <Link
              to={`/inspiration?tag=${encodeURIComponent(tool.tags[0] ?? tool.category)}`}
              className="group bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <Search className="size-4 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-medium">Inspiración</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {inspiration > 0
                  ? `${inspiration} referencias con “${tool.tags[0] ?? tool.category}”`
                  : "Explora referencias de esta disciplina."}
              </p>
            </Link>
            <Link
              to={`/discover?q=${encodeURIComponent(tool.name)}`}
              className="group bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <Search className="size-4 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-medium">Descubrir más</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Todo lo relacionado con {tool.name} en un vistazo.
              </p>
            </Link>
          </div>
        </section>

        {!isAuthenticated && (
          <p className="mt-12 border border-dashed border-border/70 p-4 text-[13px] text-muted-foreground">
            <Link
              to={`/auth?returnTo=${encodeURIComponent(`/tools/${tool.slug}`)}`}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Inicia sesión
            </Link>{" "}
            para guardar herramientas en tus colecciones.
          </p>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-4xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">
            Minimal Lunar Design · Recursos de edición y diseño
          </p>
        </div>
      </footer>
    </div>
  );
}
