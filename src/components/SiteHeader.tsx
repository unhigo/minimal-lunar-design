/**
 * SiteHeader — glass bar: wordmark + Menubar (shadcn, glass-styled) on
 * desktop; on mobile the same NAV_SECTIONS manifest renders as an accordion
 * panel. Navigation data is unchanged (src/lib/nav.ts).
 */
import { Link, useLocation } from "react-router";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Logo, SignalDot } from "@/components/brand/Logo";
import { SiteMenubar } from "@/components/SiteMenubar";
import { NAV_SECTIONS } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** "/tools/slug" → "/tools" · "/" → "/" — for section highlighting. */
function routeBase(pathname: string): string {
  if (pathname === "/") return "/";
  return `/${pathname.split("/")[1] ?? ""}`;
}

export function SiteHeader() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { pathname } = useLocation();
  const base = routeBase(pathname);

  // Close the panel whenever the route changes (hash links included).
  useEffect(() => {
    setOpen(false);
    setExpanded(null);
  }, [pathname]);

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5">
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="MOONØ.LAB — inicio"
        >
          {/* §12 WORDMARK variant for navigation, with signal dot. */}
          <Logo variant="wordmark" className="text-[15px]" />
          <SignalDot className="size-1.5 transition-transform group-hover:scale-125" />
          <span className="mt-0.5 hidden self-center font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground xl:block">
            Observe · Explore · Create
          </span>
        </Link>

        {/* Desktop menubar — five glass menus reorganizing every page,
            subpage, category and subcategory of the lab. */}
        <SiteMenubar className="hidden lg:flex" />

        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/submit"
            className="hidden h-9 items-center gap-1.5 rounded-sm bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90 md:inline-flex"
          >
            <Plus className="size-3.5" />
            Submit
          </Link>
          <Link
            to="/discover"
            aria-label="Buscar"
            className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-4" />
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="hidden h-9 items-center rounded-sm border border-border px-4 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              {user?.name?.split(" ")[0] ?? "Tu espacio"}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden h-9 items-center rounded-sm border border-foreground/70 px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground hover:text-background sm:inline-flex"
            >
              Empezar
            </Link>
          )}
          <button
            className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            <span className="flex flex-col gap-1">
              <span
                className={`h-px w-4 bg-current transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`}
              />
              <span className={`h-px w-4 bg-current ${open ? "opacity-0" : ""}`} />
              <span
                className={`h-px w-4 bg-current transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Tablet + mobile panel — the same manifest as the menubar, as an
          accordion. Full-bleed, own scroll, generous tap targets. */}
      {open && (
        <nav
          aria-label="Navegación principal"
          className="glass-panel max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-border/60 px-5 py-4 lg:hidden"
        >
          {NAV_SECTIONS.map((section) => {
            const sectionActive = section.groups.some((g) =>
              [...g.links, ...(g.subs ?? []).flatMap((s) => s.links)].some(
                (l) => l.to.split("?")[0] === base,
              ),
            );
            const isOpen = expanded === section.id;
            return (
              <div key={section.id} className="border-b border-border/60 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : section.id)}
                  aria-expanded={isOpen}
                  className={cn(
                    "flex w-full items-center justify-between py-3.5 font-mono text-[11px] uppercase tracking-[0.28em]",
                    sectionActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {sectionActive && (
                      <span aria-hidden className="signal-dot size-1.5" />
                    )}
                    {section.label}
                  </span>
                  <span aria-hidden className="text-base leading-none">
                    {isOpen ? "–" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-4">
                    {section.groups.map((group) => (
                      <div key={group.label} className="mt-2">
                        <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground/70">
                          {group.label}
                        </p>
                        <ul className="mt-1.5 space-y-0.5">
                          {group.links.map((l) => (
                            <li key={l.to + l.label}>
                              <Link
                                to={l.to}
                                className={cn(
                                  "block py-1.5 font-mono text-[13px]",
                                  l.to.split("?")[0] === base
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {group.subs?.map((sub) => (
                          <div key={sub.label} className="mt-3">
                            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground/70">
                              {sub.label}
                            </p>
                            <ul className="mt-1.5 space-y-0.5">
                              {sub.links.map((l) => (
                                <li key={l.to + l.label}>
                                  <Link
                                    to={l.to}
                                    className={cn(
                                      "block py-1.5 font-mono text-[13px]",
                                      l.to.split("?")[0] === base
                                        ? "text-foreground"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {l.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="py-4">
            <Link
              to="/submit"
              className="btn-solid h-10 w-full justify-center text-[13px]"
            >
              <Plus className="size-3.5" /> Submit
            </Link>
            <div className="mt-3 flex flex-col gap-2 sm:hidden">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-outline">
                  Tu espacio
                </Link>
              ) : (
                <Link to="/auth" className="btn-solid">
                  Empezar
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
