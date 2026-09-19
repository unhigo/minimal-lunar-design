import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { usePageMeta } from "@/hooks/use-page-meta";
import { BlockEditor } from "@/components/BlockEditor";
import { BRAND } from "@/lib/brand";
import { Loader2 } from "lucide-react";

/**
 * Resource composition editor — the open-lab surface where any signed-in
 * user can add blocks (image, video, text, gallery, slider) to a resource,
 * and the author can additionally edit the resource meta.
 */
export default function ResourceEditor() {
  const { id } = useParams<{ id: string }>();
  const resourceId = id as Id<"resources"> | undefined;
  const { user, isLoading } = useAuth();

  const resource = useQuery(
    api.resources.getMineForEdit,
    resourceId ? { id: resourceId } : "skip",
  );

  usePageMeta({
    title: resource
      ? `Editar — ${resource.title} · ${BRAND.mark}`
      : `Editar recurso · ${BRAND.mark}`,
    description: `Composición y personalización de bloques en ${BRAND.mark} — Digital Exploration Lab.`,
    path: resourceId ? `/resource/${resourceId}/edit` : "/",
  });

  // Auth still settling — never flash "not found" during this window.
  if (isLoading || resource === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  if (resource.status === "hidden") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-5 text-foreground">
        <p className="text-sm text-muted-foreground">
          Este recurso está oculto por moderación y no admite edición.
        </p>
        <Link
          to="/dashboard"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Ir a tu espacio
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-5 text-foreground">
        <p className="text-sm text-muted-foreground">
          Inicia sesión para entrar al editor de bloques.
        </p>
        <Link
          to={`/auth?returnTo=${encodeURIComponent(`/resource/${resourceId}/edit`)}`}
          className="inline-flex h-11 items-center rounded-sm border border-foreground/70 px-6 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Inicia sesión
        </Link>
      </div>
    );
  }

  const isAuthor = resource.authorId === user._id;
  const rid = resourceId!;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-5">
          <Link
            to={`/resource/${rid}`}
            className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Volver al recurso
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {BRAND.name} · editor
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {isAuthor ? "Editar" : "Colaborar"}
        </p>
        <h1 className="mt-3 h1-editorial tracking-tight">
          {resource.title}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          {isAuthor
            ? "Compón la página con bloques —imágenes, video, notas, galerías y sliders— y ajusta los datos del recurso. Tú decides el orden y la personalización."
            : "Este es un laboratorio abierto: añade bloques a la página —imágenes, video, notas, galerías y sliders—. La comunidad construye la ficha juntos."}
        </p>

        <div className="mt-10">
          <BlockEditor resourceId={rid} />
        </div>
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
