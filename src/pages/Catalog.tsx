import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Store } from "lucide-react";
import { ResourceCard } from "@/components/ResourceCard";
import { CATEGORIES } from "@/lib/catalog";

export default function Catalog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const published = useQuery(api.resources.listPublished, {
    search: search || undefined,
    category: category === "all" ? undefined : category,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full border border-foreground/40">
              <span className="size-2 rounded-full bg-foreground/70" />
            </span>
            <span className="text-sm font-medium uppercase tracking-[0.22em]">

            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/dashboard"
              className="hidden px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Mi espacio
            </Link>
            <Link
              to="/upload"
              className="inline-flex h-9 items-center rounded-sm border border-foreground/70 px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Subir recurso
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Catálogo
            </p>
            <h1 className="mt-3 h1-editorial tracking-tight">

            </h1>
            <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
              Mockups, fuentes, texturas y plantillas seleccionadas por la
              comunidad. Busca, filtra y consigue lo que necesitas.
            </p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="mt-10 flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar recursos…"
              className="h-10 w-full rounded-sm border border-border bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategory("all")}
              className={
                category === "all"
                  ? "rounded-sm bg-foreground px-3 py-1.5 font-mono text-[11px] text-background"
                  : "rounded-sm border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              todo
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={
                  category === c
                    ? "rounded-sm bg-foreground px-3 py-1.5 font-mono text-[11px] text-background"
                    : "rounded-sm border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-10">
          {published === undefined ? (
            <div className="grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse bg-muted/30"
                />
              ))}
            </div>
          ) : published.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-border/70 px-6 py-16 text-center">
              <Store className="size-5 text-muted-foreground" />
              <p className="max-w-sm text-[13px] text-muted-foreground">
                {search || category !== "all"
                  ? "Ningún recurso coincide con tu búsqueda. Prueba con otros términos."
                  : "Todavía no hay recursos publicados. Sé el primero en subir uno."}
              </p>
              <Link
                to="/upload"
                className="mt-2 inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Subir el primero
              </Link>
            </div>
          ) : (
            <div className="grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
              {published.map((r) => (
                <ResourceCard key={r._id} resource={r} />
              ))}
            </div>
          )}
        </div>
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
