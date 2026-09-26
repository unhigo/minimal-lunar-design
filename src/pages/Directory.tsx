import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Search } from "lucide-react";
import {
  DIRECTORY,
  DIRECTORY_SECTIONS,
  DIRECTORY_SECTION_LABELS,
  directoryGrouped,
  type DirectoryEntry,
  type DirectorySection,
} from "@/data/directory";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/hooks/use-page-meta";
import { BRAND } from "@/lib/brand";

const PRICING_LABEL: Record<DirectoryEntry["pricing"], string> = {
  free: "gratis",
  freemium: "freemium",
  paid: "premium",
};

function EntryCard({ entry }: { entry: DirectoryEntry }) {
  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex flex-col border border-border/60 bg-background p-5 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {entry.tags.slice(0, 2).join(" · ")}
        </span>
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="mt-3 text-[15px] font-medium leading-snug">{entry.name}</h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {entry.shortDescription}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3.5">
        <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {PRICING_LABEL[entry.pricing]}
        </span>
        <span className="truncate font-mono text-[10px] text-muted-foreground">
          {entry.sub.toLowerCase()}
        </span>
      </div>
    </a>
  );
}

function EntryRow({ entry }: { entry: DirectoryEntry }) {
  return (
    <li className="border-b border-border/60">
      <a
        href={entry.url}
        target="_blank"
        rel="noreferrer noopener"
        className="group flex items-baseline gap-4 py-4 transition-colors hover:bg-muted/30 sm:gap-6"
      >
        <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {entry.sub}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[15px] font-medium">
            {entry.name}
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          {entry.shortDescription && (
            <span className="mt-1 block truncate text-[13px] text-muted-foreground">
              {entry.shortDescription}
            </span>
          )}
        </span>
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
          {PRICING_LABEL[entry.pricing]}
        </span>
      </a>
    </li>
  );
}

export default function Directory() {
  usePageMeta({
    title: `Directorio — ${BRAND.mark}`,
    description:
      "Catálogo importado del directorio de Unhigo Makers: herramientas, recursos, plantillas Framer e inspiración, organizados por sección y subcategoría.",
    path: "/directory",
  });

  const [section, setSection] = useState<DirectorySection>("tools");
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const grouped = directoryGrouped(section);
    if (!needle) return grouped;
    return grouped
      .map((g) => ({
        sub: g.sub,
        items: g.items.filter(
          (e) =>
            e.name.toLowerCase().includes(needle) ||
            e.shortDescription.toLowerCase().includes(needle) ||
            e.tags.some((t) => t.toLowerCase().includes(needle)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [section, query]);

  const total = DIRECTORY.filter((e) => e.section === section).length;
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Directory · {DIRECTORY.length} entries
        </p>
        <h1 className="mt-3 h1-editorial tracking-tight">Directorio importado</h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Catálogo curado de Unhigo Makers: herramientas, recursos, plantillas
          Framer e inspiración — organizado por sección y subcategoría.
        </p>

        {/* Section tabs — each section groups its entries by subcategory. */}
        <div
          role="tablist"
          aria-label="Secciones del directorio"
          className="mt-8 flex flex-wrap gap-2"
        >
          {DIRECTORY_SECTIONS.map((s) => {
            const count = DIRECTORY.filter((e) => e.section === s).length;
            return (
              <button
                key={s}
                role="tab"
                aria-selected={section === s}
                onClick={() => setSection(s)}
                className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  section === s
                    ? "border-foreground/60 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {DIRECTORY_SECTION_LABELS[s]}
                <span className="text-[10px] text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mt-6 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por nombre, descripción o tag…"
            aria-label="Filtrar el directorio"
            className="h-11 w-full rounded-sm border border-border bg-transparent pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
          />
        </div>

        <p className="mt-6 font-mono text-[11px] text-muted-foreground">
          {shown} de {total} en {DIRECTORY_SECTION_LABELS[section].toLowerCase()}
        </p>

        {/* Grouped by subcategory */}
        <div className="mt-4 space-y-12">
          {groups.map((g) => (
            <section key={g.sub} aria-label={g.sub}>
              <div className="flex items-baseline justify-between gap-4 border-b border-foreground/20 pb-2">
                <h2 className="text-lg font-light tracking-tight">{g.sub}</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {String(g.items.length).padStart(2, "0")} entries
                </span>
              </div>

              {section === "framer" ? (
                <ul>
                  {g.items.map((e) => (
                    <EntryRow key={e.slug} entry={e} />
                  ))}
                </ul>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((e) => (
                    <EntryCard key={e.slug} entry={e} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="mt-4 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
              Nada por aquí. Prueba otra búsqueda o cambia de sección.
            </p>
          </div>
        )}

        <p className="mt-16 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Fuente:{" "}
          <a
            href="https://unhigomakers.notion.site/All-2121582918ca818787d0ec96970dcd0a"
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            Unhigo Makers — Resources (Notion)
          </a>
        </p>

        <div className="mt-6 border-t border-border/60 pt-6">
          <Link to="/tools" className="btn-outline">
            Explorar el directorio vivo
          </Link>
        </div>
      </main>
    </div>
  );
}
