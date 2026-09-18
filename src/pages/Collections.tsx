import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Bookmark,
  FolderPlus,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useCollections } from "@/hooks/use-collections";
import type { Collection } from "@/hooks/collections-core";
import {
  KIND_LABEL,
  resolveEntry,
  type ResolvedEntry,
} from "@/lib/collections";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatPrice } from "@/lib/catalog";

interface SavedItem {
  entry: ResolvedEntry;
  collectionId: string | null;
  /** For resources, the live Convex data (title, price, cover). */
  resource?: {
    _id: string;
    title: string;
    price?: number;
    coverUrl?: string | null;
  };
}

/**
 * Collections page: everything the visitor has saved, grouped by collection
 * or as a general "Guardados" pool. Static entries are resolved against the
 * local data layers; resources resolve live against the Convex catalog.
 */
export default function Collections() {
  usePageMeta({
    title: "Colecciones — Minimal Lunar Design",
    description:
      "Tus guardados: herramientas, proyectos, recursos, artículos e inspiración organizados en colecciones.",
    path: "/collections",
  });

  const {
    savedEntries,
    collections,
    savedCount,
    unsave,
    moveTo,
    createCollection,
    deleteCollection,
  } = useCollections();
  const [newName, setNewName] = useState("");
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null,
  );

  const published = useQuery(api.resources.listPublished, { search: "" });

  const items: SavedItem[] = useMemo(() => {
    if (!savedEntries) return [];
    return savedEntries.map((e) => {
      const entry = resolveEntry(e.kind, e.id);
      if (e.kind === "resource") {
        const r = (published ?? []).find((p) => p._id === e.id);
        return {
          entry: r
            ? { ...entry, title: r.title, meta: `${r.category} · ${formatPrice(r.price ?? 0)}` }
            : { ...entry, title: null, meta: "no disponible" },
          collectionId: e.collectionId,
          resource: r
            ? { _id: r._id, title: r.title, price: r.price, coverUrl: r.coverUrl }
            : undefined,
        };
      }
      return { entry, collectionId: e.collectionId ?? null };
    });
  }, [savedEntries, published]);

  const visible = useMemo(
    () =>
      items.filter((i) =>
        activeCollectionId === null
          ? true
          : i.collectionId === activeCollectionId,
      ),
    [items, activeCollectionId],
  );

  /** Membership lives on each saved entry (collectionId), not on the
   *  collection object — count from the resolved items. */
  const countFor = (collectionId: string | null) =>
    items.filter((i) => i.collectionId === collectionId).length;

  const submitCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createCollection(newName.trim());
    setNewName("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Guardados
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">
          Colecciones
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Todo lo que has guardado del ecosistema, en tu navegador por ahora.
          Cuando las colecciones pasen a servidor, este espacio no cambia.
        </p>

        {/* New collection */}
        <form
          onSubmit={submitCollection}
          className="mt-8 flex max-w-md items-center gap-2"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la colección…"
            aria-label="Nombre de la nueva colección"
            className="h-10 flex-1 rounded-sm border border-border bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-foreground/70 px-4 text-[13px] font-medium transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
          >
            <FolderPlus className="size-4" />
            Crear
          </button>
        </form>

        {/* Collection switcher */}
        <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <button
            onClick={() => setActiveCollectionId(null)}
            aria-pressed={activeCollectionId === null}
            className={`shrink-0 rounded-sm border px-3 py-1.5 font-mono text-[11px] transition-colors ${
              activeCollectionId === null
                ? "border-foreground/50 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            todo ({savedCount})
          </button>
          {collections.map((c: Collection) => (
            <div key={c.id} className="relative shrink-0">
              <button
                onClick={() => setActiveCollectionId(c.id)}
                aria-pressed={activeCollectionId === c.id}
                className={`rounded-sm border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                  activeCollectionId === c.id
                    ? "border-foreground/50 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.name} ({countFor(c.id)})
              </button>
              <button
                onClick={() => {
                  deleteCollection(c.id);
                  if (activeCollectionId === c.id) setActiveCollectionId(null);
                }}
                aria-label={`Eliminar colección ${c.name}`}
                className="absolute -right-2 -top-2 rounded-sm border border-border bg-background p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus:opacity-100"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Saved items */}
        {visible.length === 0 ? (
          <div className="mt-8 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
            <Bookmark className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-3 text-[13px] text-muted-foreground">
              {savedCount === 0
                ? "Aún no has guardado nada. Usa el icono de marcador en herramientas, proyectos, recursos o artículos."
                : "Esta colección está vacía. Mueve guardados aquí desde “todo”."}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(({ entry, resource }) => {
              const title = entry.title ?? resource?.title ?? "…";
              const cover =
                entry.gradient ??
                (resource?.coverUrl ? (
                  <img
                    src={resource.coverUrl}
                    alt=""
                    className="h-28 w-full border-b border-border/60 object-cover"
                  />
                ) : null);
              return (
                <div
                  key={entry.key}
                  className="flex flex-col border border-border/60 bg-background transition-colors hover:bg-muted/40"
                >
                  {cover && entry.gradient && (
                    <div
                      className="h-24 w-full border-b border-border/60"
                      style={{ background: entry.gradient }}
                    />
                  )}
                  {resource?.coverUrl && (
                    <img
                      src={resource.coverUrl}
                      alt=""
                      className="h-24 w-full border-b border-border/60 object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {KIND_LABEL[entry.kind]}
                      {entry.demo && " · demo"}
                    </p>
                    {entry.href ? (
                      <Link
                        to={entry.href}
                        className="mt-2 text-[14px] font-medium leading-snug transition-colors hover:text-muted-foreground"
                      >
                        {title}
                      </Link>
                    ) : (
                      <p className="mt-2 text-[14px] font-medium">{title}</p>
                    )}
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {entry.meta}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border/60 px-4 py-2.5">
                    {/* Move between collections */}
                    <div className="flex items-center gap-1">
                      <MoreHorizontal className="size-3.5 text-muted-foreground" />
                      <select
                        aria-label="Mover a colección"
                        value={items.find(
                          (i) => i.entry.key === entry.key,
                        )?.collectionId ?? ""}
                        onChange={(e) => {
                          const [kind, ...rest] = entry.key.split(":");
                          const id = rest.join(":");
                          if (kind === "tool" || kind === "resource" || kind === "inspiration" || kind === "project" || kind === "article" || kind === "creator") {
                            moveTo(
                              kind,
                              id,
                              e.target.value === "" ? null : e.target.value,
                            );
                          }
                        }}
                        className="max-w-[140px] rounded-sm border border-border bg-transparent px-1.5 py-1 font-mono text-[10px] text-muted-foreground outline-none"
                      >
                        <option value="">sin colección</option>
                        {collections.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        const [kind, ...rest] = entry.key.split(":");
                        if (
                          kind === "tool" ||
                          kind === "resource" ||
                          kind === "inspiration" ||
                          kind === "project" ||
                          kind === "article" ||
                          kind === "creator"
                        ) {
                          unsave(kind, rest.join(":"));
                        }
                      }}
                      aria-label="Quitar de guardados"
                      className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Subtle loading indicator while the catalog resolves */}
        {published === undefined && (
          <p className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            resolviendo recursos…
          </p>
        )}
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
