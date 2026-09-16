import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAction, useMutation, useQuery } from "convex/react";
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
import { formatPrice, timeAgo } from "@/lib/catalog";

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const resource = useQuery(
    api.resources.getPublished,
    id ? { id } : "skip",
  );
  const comments = useQuery(
    api.resources.listComments,
    id ? { resourceId: id as never } : "skip",
  );
  const purchased = useQuery(
    api.resources.hasPurchased,
    id ? { resourceId: id as never } : "skip",
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
    if (!id) return;
    setCheckoutBusy(true);
    setError(null);
    try {
      const result = await beginCheckout({ resourceId: id as never });
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
    if (!id || !commentBody.trim()) return;
    setCommentBusy(true);
    setError(null);
    try {
      await addComment({ resourceId: id as never, body: commentBody.trim() });
      setCommentBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo comentar.");
    } finally {
      setCommentBusy(false);
    }
  };

  const owned = purchased === true;

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
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {resource.category}
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">
          {resource.title}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {resource.description}
        </p>

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
            {owned && resource.url ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-sm bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Download className="size-4" />
                Abrir recurso
              </a>
            ) : owned ? (
              <span className="inline-flex h-10 items-center text-[12px] text-muted-foreground">
                Sin enlace adjunto
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
                <button
                  onClick={() => void deleteComment({ id: c._id })}
                  title="Eliminar comentario"
                  className="shrink-0 p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
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
            Minimal Lunar Design · Recursos de edición y diseño
          </p>
        </div>
      </footer>
    </div>
  );
}
