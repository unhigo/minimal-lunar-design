import { Link, NavLink, useLocation } from "react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { BRAND } from "@/lib/brand";

const NAV = [
  { to: "/discover", label: "Discover" },
  { to: "/tools", label: "Herramientas" },
  { to: "/inspiration", label: "Inspiración" },
  { to: "/catalog", label: "Recursos" },
  { to: "/projects", label: "Proyectos" },
  { to: "/creators", label: "Creadores" },
  { to: "/articles", label: "Artículos" },
];

/**
 * Shared navigation for the discovery areas. The full link row only fits at
 * lg and up; below that (tablet and mobile) the nav collapses into a
 * hamburger panel. The tagline stays desktop-only so the wordmark, links and
 * actions never overlap.
 */
export function SiteHeader() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the panel whenever the route changes (hash links included).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-full border border-foreground/40">
            <span className="size-2 rounded-full bg-foreground/70" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-medium uppercase tracking-[0.22em]">
              MOONØ.LAB
            </span>
            <span className="mt-0.5 hidden font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground xl:block">
              {BRAND.tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `px-3 py-2 text-[13px] transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
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

      {/* Tablet + mobile panel. Full-bleed, own scroll, generous tap targets. */}
      {open && (
        <nav
          aria-label="Navegación principal"
          className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-border/60 px-5 py-4 lg:hidden"
        >
          <ul className="space-y-0.5">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  className={({ isActive }) =>
                    `block py-2.5 text-[15px] transition-colors ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:hidden">
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
        </nav>
      )}
    </header>
  );
}
