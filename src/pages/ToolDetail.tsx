import { BRAND } from "@/lib/brand";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  ArrowUp,
  BadgeCheck,
  Bookmark,
  Check,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { DirectoryCard } from "@/components/DirectoryCard";
import NotFound from "@/pages/NotFound";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/lib/catalog";

export default function ToolDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();

  const tool = useQuery(
    api.tools.getBySlug,
    slug ? { slug } : "skip",
  );
  const interaction = useQuery(
    api.tools.myInteraction,
    slug && isAuthenticated ? { slug } : "skip",
  );

  const toggleVote = useMutation(api.tools.toggleVote);
  const toggleFavorite = useMutation(api.tools.toggleFavorite);

  usePageMeta({
    title: tool ? `${tool.name} — Herramientas · ${BRAND.mark}` : "Herramienta no encontrada",
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

  if (tool === undefined) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-24">
          <div className="h-8 w-40 animate-pulse bg-muted" />
          <div className="mt-6 h-16 w-2/3 animate-pulse bg-muted" />
        </main>
      </div>
    );
  }

  if (tool === null) {
    return <NotFound />;
  }

  const voted = interaction?.voted ?? false;
  const favorited = interaction?.favorited ?? false;

  const requireAuth = (message: string) => {
    if (!isAuthenticated) {
      toast(message, {
        description: "Vota y guarda favoritos con tu cuenta del laboratorio.",
        action: {
          label: "Iniciar sesión",
          onClick: () => {
            window.location.href = `/auth?returnTo=${encodeURIComponent(`/tools/${tool.slug}`)}`;
          },
        },
      });
      return true;
    }
    return false;
  };

  const handleVote = () => {
    if (requireAuth("Inicia sesión para votar")) return;
    toggleVote({ slug: tool.slug }).catch((err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo votar."),
    );
  };

  const handleFavorite = () => {
    if (requireAuth("Inicia sesión para guardar favoritos")) return;
    toggleFavorite({ slug: tool.slug }).catch((err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar."),
    );
  };

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
            <h1 className="mt-3 h1-editorial tracking-tight">
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
              onClick={() => void handleVote()}
              aria-pressed={voted}
              className={`inline-flex h-10 items-center gap-2 rounded-sm border px-4 text-sm transition-colors ${
                voted
                  ? "border-foreground/60 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUp className={`size-4 ${voted ? "fill-current" : ""}`} />
              {tool.votes}
            </button>
            <button
              onClick={() => void handleFavorite()}
              aria-pressed={favorited}
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bookmark
                className={`size-4 ${favorited ? "fill-current text-foreground" : ""}`}
              />
              {favorited ? "Guardada" : "Guardar"}
            </button>
          </div>
        </div>

        {tool.status === "pending" && (
          <div className="mt-6 flex items-center gap-2 rounded-sm border border-dashed border-border/70 p-4 text-[13px] text-muted-foreground">
            <ShieldAlert className="size-4" />
            Esta herramienta está pendiente de revisión — solo la ve su autor y el equipo.
          </div>
        )}

        {/* Facts grid */}
        <div className="mt-10 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Licencia / precio
            </p>
            <p className="mt-2 text-sm">{tool.pricingDetails || "—"}</p>
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Plataformas
            </p>
            <p className="mt-2 font-mono text-[12px] text-muted-foreground">
              {tool.platforms.length > 0 ? tool.platforms.join(" · ") : "—"}
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
              Ficha
            </p>
            <dl className="mt-2 space-y-1.5 font-mono text-[12px] text-muted-foreground">
              {tool.author && (
                <div className="flex justify-between gap-4">
                  <dt>autor</dt>
                  <dd className="truncate text-foreground">{tool.author}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt>slug</dt>
                <dd className="text-foreground">{tool.slug}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>publicada</dt>
                <dd className="text-foreground">{timeAgo(tool.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>tags</dt>
                <dd className="text-right text-foreground">
                  {tool.tags.slice(0, 4).join(" · ")}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Related tools (same category, tag overlap) */}
        {tool.related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-light tracking-tight">
              Herramientas relacionadas
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tool.related.map((t) => (
                <DirectoryCard
                  key={t._id}
                  compact
                  tool={{
                    _id: t._id,
                    name: t.name,
                    slug: t.slug,
                    shortDescription: t.shortDescription,
                    category: t.category,
                    tags: t.tags,
                    pricing: t.pricing,
                    pricingDetails: "",
                    trending: false,
                    verified: false,
                    featured: false,
                    votes: 0,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Cross-links into the rest of the platform */}
        <section className="mt-14">
          <h2 className="text-lg font-light tracking-tight">
            En la plataforma
          </h2>
          <div className="mt-5 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to={`/catalog?search=${encodeURIComponent(tool.name)}`}
              className="group bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                recursos
              </p>
              <h3 className="mt-3 text-sm font-medium">Recursos de la comunidad</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Busca recursos que la usen o la complementen.
              </p>
            </Link>
            <Link
              to={`/inspiration?tag=${encodeURIComponent(tool.tags[0] ?? tool.category)}`}
              className="group bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                inspiración
              </p>
              <h3 className="mt-3 text-sm font-medium">Referencias visuales</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Explora “{tool.tags[0] ?? tool.category}” en la sección de inspiración.
              </p>
            </Link>
            <Link
              to={`/discover?q=${encodeURIComponent(tool.name)}`}
              className="group bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                descubrir
              </p>
              <h3 className="mt-3 text-sm font-medium">Todo sobre {tool.name}</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Resultados globales en un vistazo.
              </p>
            </Link>
          </div>
        </section>
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
