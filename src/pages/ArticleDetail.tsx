import { Link, useParams } from "react-router";
import { ArrowLeft, Bookmark } from "lucide-react";
import {
  getArticleBySlug,
  getCreatorBySlug,
  relatedArticles,
  formatArticleDate,
} from "@/data/community";
import { getToolBySlug } from "@/data/tools";
import { SiteHeader } from "@/components/SiteHeader";
import NotFound from "@/pages/NotFound";
import { useCollections } from "@/hooks/use-collections";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;
  const { toggle, isSaved } = useCollections();

  usePageMeta({
    title: article
      ? `${article.title} — Artículos · Minimal Lunar Design`
      : "Artículo no encontrado",
    description: article?.excerpt ?? "",
    path: `/articles/${slug ?? ""}`,
  });

  if (!article) {
    return <NotFound />;
  }

  const saved = isSaved("article", article.slug);
  const author = getCreatorBySlug(article.authorSlug);
  const tools = article.relatedToolSlugs
    .map((s) => getToolBySlug(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const related = relatedArticles(article);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Artículos
        </Link>

        {/* Header */}
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {article.category} · demo
        </p>
        <h1 className="mt-3 text-3xl font-light leading-tight tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        {/* Byline + save */}
        <div className="mt-8 flex items-center justify-between border-y border-border/60 py-4">
          <p className="text-[13px] text-muted-foreground">
            {author ? (
              <>
                Por{" "}
                <Link
                  to={`/creators/${author.slug}`}
                  className="text-foreground transition-colors hover:text-muted-foreground"
                >
                  {author.name}
                </Link>{" "}
                · {formatArticleDate(article.date)} · {article.readingMinutes}{" "}
                min de lectura
              </>
            ) : (
              <>
                {formatArticleDate(article.date)} · {article.readingMinutes} min
                de lectura
              </>
            )}
          </p>
          <button
            onClick={() => toggle("article", article.slug)}
            aria-label={saved ? "Quitar de guardados" : "Guardar artículo"}
            aria-pressed={saved}
            className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bookmark
              className={`size-3.5 ${saved ? "fill-current text-foreground" : ""}`}
            />
            {saved ? "Guardado" : "Guardar"}
          </button>
        </div>

        {/* Body */}
        <article className="mt-8 space-y-5">
          {article.body.map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-[1.8] text-foreground/90">
              {paragraph}
            </p>
          ))}
        </article>

        {/* Tools mentioned */}
        {tools.length > 0 && (
          <section className="mt-12">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Herramientas mencionadas
            </h2>
            <div className="mt-4 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
              {tools.map((t) => (
                <Link
                  key={t.slug}
                  to={`/tools/${t.slug}`}
                  className="group bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">
                    {t.shortDescription}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Sigue leyendo
            </h2>
            <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
              {related.map((a) => (
                <li key={a.slug}>
                  <Link
                    to={`/articles/${a.slug}`}
                    className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:text-muted-foreground"
                  >
                    <span className="truncate text-[14px]">{a.title}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {a.category}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-2xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">
            Minimal Lunar Design · Recursos de edición y diseño
          </p>
        </div>
      </footer>
    </div>
  );
}
