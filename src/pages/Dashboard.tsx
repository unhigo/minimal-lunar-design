import { Link, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { ArrowUpRight, Download, Palette, Store, Upload } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice, timeAgo } from "@/lib/catalog";

const QUICK_ACTIONS = [
  {
    to: "/catalog",
    icon: Store,
    title: "Explorar catálogo",
    body: "Busca recursos de edición y diseño subidos por la comunidad.",
  },
  {
    to: "/upload",
    icon: Upload,
    title: "Subir un recurso",
    body: "Publica tus propias plantillas, fuentes, texturas y más.",
  },
  {
    to: "/studio",
    icon: Palette,
    title: "Abrir el estudio",
    body: "Compón tu calendario lunar y expórtalo listo para imprimir.",
  },
] as const;

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const purchases = useQuery(api.resources.myPurchases);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const completed = (purchases ?? []).filter((p) => p.status === "completed");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full border border-foreground/40">
              <span className="size-2 rounded-full bg-foreground/70" />
            </span>
            <span className="text-sm font-medium uppercase tracking-[0.22em]">
              Minimal Lunar Design
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/catalog"
              className="hidden px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Catálogo
            </Link>
            <Link
              to="/upload"
              className="hidden px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Subir
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => void handleSignOut()}
            >
              Salir
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Tu espacio
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">
          Hola{user?.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
          Todo lo que has comprado y publicado, en un solo sitio.
        </p>

        {/* Quick actions */}
        <div className="mt-10 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group bg-background p-6 transition-colors hover:bg-muted/40"
            >
              <a.icon className="size-4 text-muted-foreground" />
              <h2 className="mt-4 flex items-center gap-1.5 text-[15px] font-medium">
                {a.title}
                <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {a.body}
              </p>
            </Link>
          ))}
        </div>

        {/* Purchases */}
        <section className="mt-14">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-light tracking-tight">
                Tus descargas
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {completed.length === 0
                  ? "Aún no has adquirido ningún recurso."
                  : `${completed.length} ${completed.length === 1 ? "recurso" : "recursos"} disponibles.`}
              </p>
            </div>
            <Link
              to="/catalog"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver catálogo
            </Link>
          </div>

          {purchases === undefined ? (
            <div className="mt-6 h-20 animate-pulse rounded-sm border border-border/60" />
          ) : completed.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
              <Download className="size-5 text-muted-foreground" />
              <p className="max-w-sm text-[13px] text-muted-foreground">
                Cuando adquieras un recurso aparecerá aquí, listo para
                descargar.
              </p>
              <Link
                to="/catalog"
                className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Explorar recursos
              </Link>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-border/60 border-y border-border/60">
              {completed.map((p) => (
                <li
                  key={p._id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.resourceTitle}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {formatPrice(p.amount)} · {timeAgo(p.createdAt)}
                    </p>
                  </div>
                  {p.resourceUrl ? (
                    <a
                      href={p.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 self-start rounded-sm border border-border px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
                    >
                      <Download className="size-3" />
                      Abrir recurso
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">
            Minimal Lunar Design · Recursos de edición y diseño
          </p>
        </div>
      </footer>
    </div>
  );
}
