import { Link, NavLink } from "react-router";
import { Search } from "lucide-react";
import { useState } from "react";
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
 * Shared navigation for the discovery areas. Reuses the lab's visual
 * language: orbital mark, mono labels, thin borders. Internal app areas
 * (Dashboard, Studio) keep their own headers.
 */
export function SiteHeader() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-full border border-foreground/40">
            <span className="size-2 rounded-full bg-foreground/70" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-medium uppercase tracking-[0.22em]">
              MOONØ.LAB
            </span>
            <span className="mt-0.5 hidden font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground lg:block">
              Digital Exploration Lab
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
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

        <div className="flex items-center gap-1">
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
              className="inline-flex h-9 items-center rounded-sm border border-border px-4 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {user?.name?.split(" ")[0] ?? "Tu espacio"}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex h-9 items-center rounded-sm border border-foreground/70 px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Empezar
            </Link>
          )}
          <button
            className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <span className="flex flex-col gap-1">
              <span className="h-px w-4 bg-current" />
              <span className="h-px w-4 bg-current" />
              <span className="h-px w-4 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/60 px-5 py-3 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
