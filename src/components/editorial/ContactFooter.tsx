import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { BRAND } from "@/lib/brand";

const COLUMNS = [
  {
    title: "Explorar",
    links: [
      { to: "/discover", label: "Discover" },
      { to: "/tools", label: "Herramientas" },
      { to: "/inspiration", label: "Inspiración" },
      { to: "/projects", label: "Proyectos" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { to: "/creators", label: "Creadores" },
      { to: "/articles", label: "Artículos" },
      { to: "/collections", label: "Colecciones" },
      { to: "/submit", label: "Enviar propuesta" },
    ],
  },
  {
    title: "Laboratorio",
    links: [
      { to: "/catalog", label: "Recursos" },
      { to: "/studio", label: "Estudio lunar" },
      { to: "/upload", label: "Publicar" },
      { to: "/dashboard", label: "Tu espacio" },
    ],
  },
] as const;

export function ContactFooter({
  phase,
  illumination,
}: {
  phase: number;
  illumination: number;
}) {
  return (
    <footer className="border-t border-border/60" data-contact>
      <div className="mx-auto w-full max-w-6xl px-5">
        {/* Contact CTA */}
        <div className="grid gap-10 section-pad lg:grid-cols-2 lg:items-end">
          <div data-reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Contacto
            </p>
            <h2 className="headline-tight h1-editorial mt-4 max-w-md">
              Trae tu próxima exploración al laboratorio.
            </h2>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              MOONØ.LAB — a laboratory for curious minds
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:items-end" data-reveal>
            <a
              href="mailto:hola@moon0.lab"
              className="group inline-flex items-baseline gap-2 font-mono text-lg tracking-tight transition-colors hover:text-muted-foreground sm:text-xl"
            >
              hola@moon0.lab
              <ArrowUpRight className="size-4 translate-y-0.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <Link to="/auth" className="btn-solid">
              Crear cuenta
            </Link>
          </div>
        </div>

        {/* Signal line — the lab's wave, drawn in with the pen easing
            (scroll-scrubbed where view timelines are supported). */}
        <div aria-hidden className="border-t border-border/60">
          <div className="relative mx-auto h-20 w-full max-w-6xl px-5">
            <svg
              viewBox="0 0 835 90"
              preserveAspectRatio="none"
              className="h-full w-full"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="signal-stroke"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2="835"
                  y2="0"
                >
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.05" />
                  <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                className="wline wline-scrub"
                pathLength={1}
                d="M0,52 C70,24 130,74 205,50 C280,26 330,18 400,44 C470,70 530,74 610,46 C690,18 760,30 835,50"
                stroke="url(#signal-stroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span className="signal-dot absolute left-[6%] top-[58%]" />
            <span className="signal-dot absolute right-[6%] top-[55%]" />
          </div>
        </div>

        {/* Link columns */}
        <div className="grid gap-10 border-t border-border/60 py-12 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em]">
              {BRAND.mark.replace("™", "")}
            </p>
            <p className="mt-2 max-w-[24ch] text-[13px] leading-relaxed text-muted-foreground">
              {BRAND.tagline} Herramientas, recursos y experimentos abiertos a
              la comunidad.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link
                      to={l.to}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Meta line */}
        <div className="flex flex-col gap-2 border-t border-border/60 py-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.mark} — {BRAND.tagline}
          </p>
          <p>
            Fase {phase.toFixed(3)} · {illumination}% iluminada esta noche · coda 2.55s
          </p>
        </div>
      </div>
    </footer>
  );
}
