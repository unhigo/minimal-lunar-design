import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IntegrationPanel } from "@/components/IntegrationPanel";
import { ResourceBlocks } from "@/components/ResourceBlocks";
import { BRAND } from "@/lib/brand";
import { formatPrice, timeAgo } from "@/lib/catalog";
import {
  badgesFor,
  LICENSES,
  PRICING_MODELS,
  type SubmitPayload,
} from "@/lib/submit-schema";

/** Resolves a Convex storage id to a public URL (null while loading). */
function StorageImage({
  storageId,
  alt,
}: {
  storageId: Id<"_storage">;
  alt: string;
}) {
  const url = useQuery(api.files.getUrl, { storageId });
  if (!url) {
    return <div className="aspect-[4/3] w-full animate-pulse bg-muted/40" />;
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className="aspect-[4/3] w-full rounded-sm border border-border/60 object-cover"
    />
  );
}

/** Embeds a demo video (YouTube/Loom/Vimeo) or falls back to a plain link. */
function VideoEmbed({ url }: { url: string }) {
  let embed: string | null = null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      embed = `https://www.youtube-nocookie.com/embed/${u.searchParams.get("v")}`;
    } else if (u.hostname === "youtu.be") {
      embed = `https://www.youtube-nocookie.com/embed${u.pathname}`;
    } else if (u.hostname.includes("loom.com")) {
      embed = url.replace("/share/", "/embed/");
    } else if (u.hostname.includes("vimeo.com")) {
      embed = `https://player.vimeo.com/video${u.pathname}`;
    }
  } catch {
    embed = null;
  }
  if (embed) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-sm border border-border/60">
        <iframe
          src={embed}
          title="Vídeo demostrativo"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-[12px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
    >
      {url}
    </a>
  );
}

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const resourceId = id as Id<"resources"> | undefined;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const resource = useQuery(
    api.resources.getPublished,
    resourceId ? { id: resourceId } : "skip",
  );
  const blocks = useQuery(
    api.blocks.list,
    resourceId ? { resourceId } : "skip",
  );
  const comments = useQuery(
    api.resources.listComments,
    resourceId ? { resourceId } : "skip",
  );
  const purchased = useQuery(
    api.resources.hasPurchased,
    resourceId ? { resourceId } : "skip",
  );

  const beginCheckout = useMutation(api.resources.beginCheckout);
  const confirmCheckout = useMutation(api.resources.confirmCheckout);
  const addComment = useMutation(api.resources.addComment);
  const deleteComment = useMutation(api.resources.deleteComment);

  const [commentBody, setCommentBody] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (resource === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-5 text-foreground">
        <p className="text-sm text-muted-foreground">
          Este recurso no existe o no está disponible.
        </p>
        <Link
          to="/catalog"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  if (resource === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!resourceId) return;
    setCheckoutBusy(true);
    setError(null);
    try {
      const result = await beginCheckout({ resourceId });
      if (result.status === "already-owned") {
        setCheckoutMsg("Ya tienes este recurso en tu espacio.");
      } else if (result.status === "completed") {
        setCheckoutMsg("Listo. El recurso ya está disponible en tu espacio.");
      } else {
        await confirmCheckout({ purchaseId: result.purchaseId });
        setCheckoutMsg("Pago simulado completado. Ya tienes el recurso.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setCheckoutBusy(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceId || !commentBody.trim()) return;
    setCommentBusy(true);
    setError(null);
    try {
      await addComment({ resourceId, body: commentBody.trim() });
      setCommentBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo comentar.");
    } finally {
      setCommentBusy(false);
    }
  };

  const owned = purchased === true;
  const pf = resource.productFields;
  const autoBadges = pf
    ? badgesFor({
        category: resource.category,
        pricing: (pf.pricing ?? "free") as SubmitPayload["pricing"],
        license: (pf.license ?? "personal") as SubmitPayload["license"],
        discountCode: pf.discountCode,
        discountPercent: pf.discountPercent,
        videoUrl: pf.videoUrl,
        senderRole: (pf.senderRole ?? "curator") as SubmitPayload["senderRole"],
        platforms: pf.platforms as SubmitPayload["platforms"],
      })
    : [];
  const pricingLabel = PRICING_MODELS.find((p) => p.id === pf?.pricing)?.label;
  const licenseLabel = LICENSES.find((l) => l.id === pf?.license)?.label;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </button>
          <Link
            to="/catalog"
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Catálogo
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        {resource.coverUrl && (
          <img
            src={resource.coverUrl}
            alt={resource.title}
            className="mb-8 aspect-[21/9] w-full rounded-sm border border-border/60 object-cover"
          />
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {resource.category}
        </p>
        <h1 className="mt-3 h1-editorial tracking-tight">
          {resource.title}
        </h1>
        {pf?.tagline && (
          <p className="mt-2 max-w-2xl text-[16px] font-light text-foreground/90">
            {pf.tagline}
          </p>
        )}
        {autoBadges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {autoBadges.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
              >
                <span aria-hidden>{b.glyph}</span> {b.label}
              </span>
            ))}
          </div>
        )}
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {resource.description}
        </p>

        {/* Community-composed content blocks */}
        {blocks !== undefined && blocks.length > 0 && (
          <div className="mt-10">
            <ResourceBlocks blocks={blocks} />
          </div>
        )}

        {/* Product detail — data captured by the /submit wizard */}
        {pf && (
          <section className="mt-10 space-y-8" aria-label="Detalle del producto">
            {pf.gallery.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Galería
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {pf.gallery.map((g) => (
                    <StorageImage
                      key={g.storageId}
                      storageId={g.storageId}
                      alt={g.caption ?? resource.title}
                    />
                  ))}
                </div>
              </div>
            )}

            {pf.videoUrl && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Vídeo demostrativo
                </p>
                <div className="mt-3">
                  <VideoEmbed url={pf.videoUrl} />
                </div>
              </div>
            )}

            {pf.features.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Características
                </p>
                <ul className="mt-3 space-y-2">
                  {pf.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px]">
                      <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
              {(pricingLabel || pf.pricingDetails) && (
                <div className="bg-background p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Modelo de precios
                  </p>
                  <p className="mt-1.5 text-sm">{pricingLabel ?? "—"}</p>
                  {pf.pricingDetails && (
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {pf.pricingDetails}
                    </p>
                  )}
                </div>
              )}
              {licenseLabel && (
                <div className="bg-background p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Licencia
                  </p>
                  <p className="mt-1.5 text-sm">{licenseLabel}</p>
                </div>
              )}
              {(pf.platforms.length > 0 || pf.ecosystems.length > 0) && (
                <div className="bg-background p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Plataformas
                  </p>
                  <p className="mt-1.5 text-sm">
                    {[...pf.platforms, ...pf.ecosystems].join(" · ")}
                  </p>
                </div>
              )}
              {pf.discountCode && pf.discountPercent && (
                <div className="bg-background p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Community deal
                  </p>
                  <p className="mt-1.5 text-sm">
                    <span className="font-mono">{pf.discountCode}</span> · −{pf.discountPercent}%
                  </p>
                </div>
              )}
            </div>

            {(pf.tags.length > 0 || pf.authorHandle) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-4">
                {pf.authorHandle && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {pf.senderRole === "creator" ? "creado por" : "enviado por"}{" "}
                    <span className="text-foreground">{pf.authorHandle}</span>
                  </span>
                )}
                {pf.authorLinks.map((l) => (
                  <a
                    key={l}
                    href={l}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-mono text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    {l}
                  </a>
                ))}
                {pf.tags.length > 0 && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {pf.tags.map((t) => `#${t}`).join(" ")}
                  </span>
                )}
              </div>
            )}
          </section>
        )}

        <div className="mt-8 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-3">
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Precio
            </p>
            <p className="mt-2 font-mono text-lg">{formatPrice(resource.price)}</p>
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Autor
            </p>
            <p className="mt-2 truncate text-sm">{resource.authorName}</p>
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Publicado
            </p>
            <p className="mt-2 font-mono text-sm">{timeAgo(resource.createdAt)}</p>
          </div>
        </div>

        {/* Acquisition */}
        <div className="mt-8 flex flex-col gap-3 border border-border/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {owned ? (
              <p className="text-sm text-muted-foreground">
                Ya tienes este recurso.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {resource.price === 0
                  ? "Es gratis. Añádelo a tu espacio."
                  : "Pago simulado en esta demo — no se cobra nada real."}
              </p>
            )}
            {checkoutMsg && (
              <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                {checkoutMsg}
              </p>
            )}
            {error && <p className="mt-1 text-[12px] text-destructive">{error}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {owned && resource.fileUrl ? (
              <a
                href={resource.fileUrl}
                download={resource.fileMeta?.name ?? "recurso"}
                className="inline-flex h-10 items-center gap-2 rounded-sm bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Download className="size-4" />
                Descargar imagen
              </a>
            ) : owned && resource.url ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-sm bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <ExternalLink className="size-4" />
                Abrir recurso
              </a>
            ) : owned ? (
              <span className="inline-flex h-10 items-center text-[12px] text-muted-foreground">
                Sin archivo adjunto
              </span>
            ) : (
              <Button
                onClick={() => void handleCheckout()}
                disabled={checkoutBusy || !isAuthenticated}
                className="h-10 rounded-sm px-5"
              >
                {checkoutBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    {resource.price === 0 ? "Obtener gratis" : "Comprar"}
                    <ExternalLink className="ml-2 size-3.5" />
                  </>
                )}
              </Button>
            )}
            {!isAuthenticated && !owned && (
              <Link
                to={`/auth?returnTo=${encodeURIComponent(`/resource/${id}`)}`}
                className="inline-flex h-10 items-center rounded-sm border border-border px-4 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Inicia sesión
              </Link>
            )}
          </div>
        </div>

        {/* Integration / export — only for owners */}
        {owned && (
          <section className="mt-8">
            <IntegrationPanel
              resourceId={resource._id}
              title={resource.title}
              fileUrl={resource.fileUrl}
              externalUrl={resource.url ?? null}
              coverUrl={resource.coverUrl}
            />
          </section>
        )}

        {/* Open-lab invitation */}
        {isAuthenticated && (
          <section className="mt-12 flex flex-col gap-3 border border-dashed border-border/70 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Laboratorio abierto</p>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                {BRAND.mark} es un laboratorio colaborativo: cualquier persona
                registrada puede ampliar esta ficha con imágenes, video, notas,
                galerías o sliders.
              </p>
            </div>
            <Link
              to={`/resource/${id}/edit`}
              className="inline-flex h-10 shrink-0 items-center rounded-sm bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Editar bloques
            </Link>
          </section>
        )}

        {/* Comments */}
        <section className="mt-14">
          <h2 className="flex items-center gap-2 text-lg font-light tracking-tight">
            <MessageSquare className="size-4 text-muted-foreground" />
            Comentarios
            <span className="font-mono text-[11px] text-muted-foreground">
              ({comments?.length ?? 0})
            </span>
          </h2>

          {isAuthenticated ? (
            <form onSubmit={handleComment} className="mt-5">
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Escribe un comentario…"
                className="min-h-20 rounded-sm border-border bg-transparent"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={commentBusy || !commentBody.trim()}
                  className="rounded-sm"
                >
                  {commentBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      Publicar
                      <Send className="ml-1.5 size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <p className="mt-5 border border-dashed border-border/70 p-4 text-[13px] text-muted-foreground">
              <Link
                to={`/auth?returnTo=${encodeURIComponent(`/resource/${id}`)}`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                Inicia sesión
              </Link>{" "}
              para comentar.
            </p>
          )}

          <ul className="mt-8 divide-y divide-border/60 border-t border-border/60">
            {(comments ?? []).map((c) => (
              <li key={c._id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {c.authorName} · {timeAgo(c.createdAt)}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                    {c.body}
                  </p>
                </div>
                {c.isMine && (
                  <button
                    onClick={() => void deleteComment({ id: c._id })}
                    title="Eliminar comentario"
                    className="shrink-0 p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
            {comments !== undefined && comments.length === 0 && (
              <li className="py-6 text-[13px] text-muted-foreground">
                Sé el primero en comentar.
              </li>
            )}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-4xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">
            {BRAND.footerLine}
          </p>
        </div>
      </footer>
    </div>
  );
}
