import { BRAND } from "@/lib/brand";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Bookmark, LayoutGrid, Rows3, Rows4 } from "lucide-react";
import {
  INSPIRATION,
  INSPIRATION_CATEGORIES,
  searchInspiration,
  type InspirationItem,
} from "@/data/inspiration";
import { SiteHeader } from "@/components/SiteHeader";
import { FilterChips } from "@/components/FilterChips";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useCollections } from "@/hooks/use-collections";

type ViewMode = "grid" | "masonry" | "compact";

const VIEWS: { id: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { id: "grid", icon: LayoutGrid, label: "Cuadrícula" },
  { id: "masonry", icon: Rows4, label: "Mosaico" },
  { id: "compact", icon: Rows3, label: "Compacto" },
];

function InspirationCard({
  item,
  view,
}: {
  item: InspirationItem;
  view: ViewMode;
}) {
  const { toggle, isSaved } = useCollections();
  const saved = isSaved("inspiration", item.id);

  if (view === "compact") {
    return (
      <div className="flex items-center gap-3 border-b border-border/60 py-3">
        <div
          className="size-10 shrink-0 rounded-sm border border-border/60"
          style={{ background: item.gradient }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{item.title}</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {item.category} · {item.year}
          </p>
        </div>
        <button
          onClick={() => toggle("inspiration", item.id)}
          aria-label={saved ? "Quitar de guardados" : "Guardar"}
          aria-pressed={saved}
          className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bookmark className={`size-3.5 ${saved ? "fill-current text-foreground" : ""}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden border border-border/60 bg-background">
      <div
        className="w-full"
        style={{
          background: item.gradient,
          aspectRatio: view === "masonry" ? item.aspect : "4/3",
        }}
      />
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{item.title}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {item.category} · demo
          </p>
        </div>
        <button
          onClick={() => toggle("inspiration", item.id)}
          aria-label={saved ? "Quitar de guardados" : "Guardar"}
          aria-pressed={saved}
          className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bookmark className={`size-3.5 ${saved ? "fill-current text-foreground" : ""}`} />
        </button>
      </div>
    </div>
  );
}

export default function Inspiration() {
  usePageMeta({
    title: `Inspiración — ${BRAND.mark}`,
    description:
      "Referencias de web, UI, branding, tipografía, motion y más. Filtra por disciplina y guarda lo que te inspire en colecciones.",
    path: "/inspiration",
  });

  const [params] = useSearchParams();
  const initialTag = params.get("tag");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(
    initialTag && INSPIRATION_CATEGORIES.includes(initialTag as never)
      ? initialTag
      : "all",
  );
  const [view, setView] = useState<ViewMode>("masonry");

  const results = useMemo(
    () => searchInspiration(query, category),
    [query, category],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Referencias
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-3 h1-editorial tracking-tight">
              Inspiración
            </h1>
            <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
              Una colección inicial de demo para mostrar el descubrimiento.
              Publica tus referencias desde{" "}
              <code className="font-mono text-[12px]">/upload</code> cuando el
              envío comunitario esté activo.
            </p>
          </div>

          {/* View switcher */}
          <div className="flex shrink-0 items-center gap-1 rounded-sm border border-border p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-label={v.label}
                aria-pressed={view === v.id}
                className={`inline-flex size-8 items-center justify-center rounded-sm transition-colors ${
                  view === v.id
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <v.icon className="size-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por título, tag o autor…"
            aria-label="Filtrar inspiración"
            className="h-10 max-w-md rounded-sm border border-border bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
          />
          <FilterChips
            options={INSPIRATION_CATEGORIES}
            value={category}
            onChange={setCategory}
            allLabel="todas"
            ariaLabel="Filtrar inspiración por disciplina"
          />
        </div>

        <p className="mt-8 font-mono text-[11px] text-muted-foreground">
          {results.length} {results.length === 1 ? "referencia" : "referencias"}
        </p>

        {/* Views */}
        {view === "compact" ? (
          <div className="mt-4">
            {results.map((item) => (
              <InspirationCard key={item.id} item={item} view="compact" />
            ))}
          </div>
        ) : (
          <div
            className={
              view === "masonry"
                ? "mt-4 columns-1 gap-4 sm:columns-2 lg:columns-3"
                : "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {results.map((item) => (
              <div
                key={item.id}
                className={view === "masonry" ? "mb-4 break-inside-avoid" : ""}
              >
                <InspirationCard item={item} view={view} />
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && (
          <div className="mt-4 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
              Sin referencias con esos filtros.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">

          </p>
        </div>
      </footer>
    </div>
  );
}
