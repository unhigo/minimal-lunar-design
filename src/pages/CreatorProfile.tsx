import { Link, useParams } from "react-router";
import { ArrowLeft, Bookmark } from "lucide-react";
import {
  articlesByCreator,
  getCreatorBySlug,
  projectsByCreator,
} from "@/data/community";
import { SiteHeader } from "@/components/SiteHeader";
import { ProjectCard } from "@/pages/Projects";
import NotFound from "@/pages/NotFound";
import { useCollections } from "@/hooks/use-collections";
import { usePageMeta } from "@/hooks/use-page-meta";
import { formatArticleDate } from "@/data/community";

export default function CreatorProfile() {
  const { slug } = useParams<{ slug: string }>();
  const creator = slug ? getCreatorBySlug(slug) : undefined;
  const { toggle, isSaved } = useCollections();

  usePageMeta({
    title: creator
      ? `${creator.name} — Creadores · Minimal Lunar Design`
      : "Creador no encontrado",
    description: creator?.bio ?? "",
    path: `/creators/${slug ?? ""}`,
  });

  if (!creator) {
    return <NotFound />;
  }

  const saved = isSaved("creator", creator.slug);
  const projects = projectsByCreator(creator.slug);
  const articles = articlesByCreator(creator.slug);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <Link
          to="/creators"
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Creadores
        </Link>

        {/* Header */}
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-foreground/30 font-mono text-sm text-muted-foreground">
              {creator.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {creator.type} · {creator.location} · demo
              </p>
              <h1 className="mt-2 text-3xl font-light tracking-tight">
                {creator.name}
              </h1>
              <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                {creator.username}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggle("creator", creator.slug)}
            aria-pressed={saved}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-sm border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bookmark
              className={`size-4 ${saved ? "fill-current text-foreground" : ""}`}
            />
            {saved ? "Guardado" : "Guardar"}
          </button>
        </div>

        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {creator.bio}
        </p>

        {/* Skills + tools */}
        <div className="mt-8 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Especialidades
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {creator.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-sm border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Herramientas que usa
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {creator.tools.map((toolSlug) => (
                <Link
                  key={toolSlug}
                  to={`/tools/${toolSlug}`}
                  className="rounded-sm border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {toolSlug}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Projects */}
        <section className="mt-14">
          <h2 className="text-lg font-light tracking-tight">
            Proyectos{" "}
            <span className="font-mono text-[12px] text-muted-foreground">
              ({projects.length})
            </span>
          </h2>
          {projects.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.slug} slug={p.slug} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Sin proyectos publicados todavía.
            </p>
          )}
        </section>

        {/* Articles */}
        <section className="mt-14">
          <h2 className="text-lg font-light tracking-tight">
            Artículos{" "}
            <span className="font-mono text-[12px] text-muted-foreground">
              ({articles.length})
            </span>
          </h2>
          {articles.length > 0 ? (
            <ul className="mt-5 divide-y divide-border/60 border-y border-border/60">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link
                    to={`/articles/${a.slug}`}
                    className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:text-muted-foreground"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px]">
                        {a.title}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                        {a.category} · {a.readingMinutes} min
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {formatArticleDate(a.date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Sin artículos publicados todavía.
            </p>
          )}
        </section>
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
