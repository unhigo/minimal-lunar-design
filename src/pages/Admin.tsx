import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, timeAgo } from "@/lib/catalog";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const resources = useQuery(
    api.resources.listAllForAdmin,
    isAdmin ? {} : "skip",
  );
  const users = useQuery(api.resources.listUsers, isAdmin ? {} : "skip");
  const comments = useQuery(
    api.resources.listRecentComments,
    isAdmin ? {} : "skip",
  );

  const toggleVisibility = useMutation(api.resources.setVisibility);
  const toggleFeatured = useMutation(api.resources.toggleFeatured);
  const removeResource = useMutation(api.resources.removeAsAdmin);
  const removeComment = useMutation(api.resources.deleteComment);
  const setUserRole = useMutation(api.resources.setUserRole);
  const bootstrapAdmin = useMutation(api.resources.bootstrapAdmin);

  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState("");
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapDone, setBootstrapDone] = useState(false);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setBootstrapError(null);
    try {
      await bootstrapAdmin({ secret: secret.trim() });
      setBootstrapDone(true);
    } catch (err) {
      setBootstrapError(
        err instanceof Error ? err.message : "No se pudo activar el rol.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-5 text-foreground">
        <ShieldAlert className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Esta zona es solo para administradores.
        </p>
        {bootstrapDone ? (
          <p className="text-[13px] text-muted-foreground">
            Rol activado. Recargando…
          </p>
        ) : (
          <form
            onSubmit={handleBootstrap}
            className="flex w-full max-w-sm flex-col gap-3 rounded-sm border border-border/70 p-6"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Primer administrador
            </p>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Si eres el propietario del estudio, introduce la clave de
              arranque para activar tu cuenta como administradora.
            </p>
            <Input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Clave de arranque"
              type="password"
              className="h-9 rounded-sm border-border bg-transparent font-mono"
              required
            />
            {bootstrapError && (
              <p className="text-[12px] text-destructive">{bootstrapError}</p>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={busy || !secret.trim()}
              className="rounded-sm"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Activar administrador"
              )}
            </Button>
          </form>
        )}
        <Link
          to="/dashboard"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Volver a tu espacio
        </Link>
      </div>
    );
  }

  const wrap = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </button>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Administración
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <h1 className="text-2xl font-light tracking-tight sm:text-3xl">
          Panel de administración
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Modera recursos y comentarios, y gestiona los roles de los usuarios.
        </p>

        {/* Resources */}
        <section className="mt-10">
          <h2 className="text-lg font-light tracking-tight">
            Recursos ({resources?.length ?? 0})
          </h2>
          {resources === undefined ? (
            <div className="mt-4 h-24 animate-pulse rounded-sm border border-border/60" />
          ) : resources.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted-foreground">
              No hay recursos todavía.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
              {resources.map((r) => (
                <li
                  key={r._id}
                  className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {r.title}{" "}
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        · {r.category}
                      </span>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {r.authorName} · {formatPrice(r.price)} ·{" "}
                      {timeAgo(r.createdAt)} · {r.status}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void wrap(() =>
                          toggleVisibility({
                            id: r._id,
                            hidden: r.status === "published",
                          }),
                        )
                      }
                    >
                      {r.status === "published" ? (
                        <>
                          <EyeOff className="mr-1.5 size-3.5" /> Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1.5 size-3.5" /> Mostrar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void wrap(() =>
                          toggleFeatured({ id: r._id, featured: !r.featured }),
                        )
                      }
                    >
                      <Star
                        className={
                          r.featured
                            ? "size-3.5 fill-current"
                            : "size-3.5"
                        }
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        void wrap(() => removeResource({ id: r._id }))
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Comments */}
        <section className="mt-12">
          <h2 className="text-lg font-light tracking-tight">
            Comentarios recientes
          </h2>
          {comments === undefined ? (
            <div className="mt-4 h-16 animate-pulse rounded-sm border border-border/60" />
          ) : comments.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted-foreground">
              No hay comentarios todavía.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
              {comments.map((c) => (
                <li
                  key={c._id}
                  className="flex items-start justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {c.authorName} · en “{c.resourceTitle}” ·{" "}
                      {timeAgo(c.createdAt)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm">{c.body}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => void wrap(() => removeComment({ id: c._id }))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Users */}
        <section className="mt-12">
          <h2 className="text-lg font-light tracking-tight">
            Usuarios ({users?.length ?? 0})
          </h2>
          {users === undefined ? (
            <div className="mt-4 h-16 animate-pulse rounded-sm border border-border/60" />
          ) : (
            <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
              {users.map((u) => (
                <li
                  key={u._id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {u.name ?? u.email ?? u._id}
                      {u.isAnonymous && (
                        <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                          invitado
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {u.email ?? "sin email"} · rol: {u.role ?? "user"}
                    </p>
                  </div>
                  <select
                    value={u.role ?? "user"}
                    disabled={busy}
                    onChange={(e) =>
                      void wrap(() =>
                        setUserRole({
                          userId: u._id,
                          role: e.target.value as
                            | "admin"
                            | "user"
                            | "member",
                        }),
                      )
                    }
                    className="h-8 shrink-0 rounded-sm border border-border bg-background px-2 font-mono text-[12px] outline-none focus:border-foreground/50"
                  >
                    <option value="user">user</option>
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">
 · Administración
          </p>
        </div>
      </footer>
    </div>
  );
}
