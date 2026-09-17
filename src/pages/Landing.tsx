import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { moonPath, moonPhase } from "@/lib/lunar";
import { CATEGORIES } from "@/lib/catalog";
import { SiteHeader } from "@/components/SiteHeader";
import { trendingTools, featuredTools } from "@/data/tools";
import { INSPIRATION } from "@/data/inspiration";

function useTodayMoon(radius = 44) {
  return useMemo(() => {
    const now = new Date();
    const phase = moonPhase(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const illumination = Math.round(
      ((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100,
    );
    return { phase, illumination, d: moonPath(phase, radius, "N") };
  }, [radius]);
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const FEATURES = [
  {
    title: "Catálogo curado",
    body: "Mockups, fuentes, texturas y plantillas buscables en un único catálogo minimalista.",
  },
  {
    title: "Publica lo tuyo",
    body: "Sube tus propios recursos, ponles precio o compártelos gratis con la comunidad.",
  },
  {
    title: "Compra en un clic",
    body: "Pago simulado en la demo: adquieres el recurso y queda guardado en tu espacio.",
  },
  {
    title: "Estudio lunar incluido",
    body: "Un calendario de 365 lunas, configurable y exportable en SVG o PNG hasta 4K.",
  },
  {
    title: "Comentarios por recurso",
    body: "Cada ficha tiene su hilo: pregunta, responde y comparte cómo lo usas.",
  },
  {
    title: "Panel de administración",
    body: "Moderación de recursos y comentarios, y gestión de roles, todo desde un panel.",
  },
] as const;

const STEPS = [
  { n: "01", title: "Explora", body: "Busca y filtra el catálogo por categoría." },
  { n: "02", title: "Abre una ficha", body: "Detalles, autor, precio y comentarios." },
  { n: "03", title: "Consíguelo", body: "Gratis o con pago simulado, en un clic." },
  { n: "04", title: "Crea", body: "Descarga el recurso o compón en el estudio lunar." },
] as const;

const AREAS = [
  {
    to: "/discover",
    title: "Discover",
    body: "Un buscador para todo: herramientas, recursos, proyectos e inspiración.",
    meta: "buscador global",
  },
  {
    to: "/tools",
    title: "Herramientas",
    body: "Directorio curado con web oficial, licencia y alternativas.",
    meta: "30 herramientas",
  },
  {
    to: "/catalog",
    title: "Recursos",
    body: "Mockups, fuentes, texturas y plantillas de la comunidad.",
    meta: "8 categorías",
  },
  {
    to: "/inspiration",
    title: "Inspiración",
    body: "Referencias visuales por disciplina, listas para guardar.",
    meta: "demo inicial",
  },
  {
    to: "/projects",
    title: "Proyectos",
    body: "Trabajos con proceso, herramientas usadas y su creador.",
    meta: "demo inicial",
  },
  {
    to: "/creators",
    title: "Creadores",
    body: "Perfiles con proyectos, artículos y herramientas de cada cual.",
    meta: "demo inicial",
  },
] as const;

export default function Landing() {
  const { phase, illumination, d } = useTodayMoon(44);
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");
  const trending = useMemo(() => trendingTools(5), []);
  const featured = useMemo(() => featuredTools(3), []);
  const inspirationSample = useMemo(() => INSPIRATION.slice(0, 3), []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-5">
          <div className="grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Recursos de edición y diseño
              </p>
              <h1 className="text-4xl leading-[1.08] font-light tracking-tight sm:text-5xl lg:text-6xl">
                Busca recursos,
                <br />
                <span className="text-muted-foreground"> publica los tuyos.</span>
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Herramientas, recursos e inspiración de edición y diseño en un
                solo ecosistema: descubre, guarda y crea. Empieza buscando.
              </p>

              {/* Hero search — global discovery entry */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(heroQuery.trim() ? `/discover?q=${encodeURIComponent(heroQuery.trim())}` : "/discover");
                }}
                className="relative mt-8 max-w-md"
              >
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="Search tools, projects, resources…"
                  aria-label="Buscador global"
                  className="h-12 w-full rounded-sm border border-border bg-transparent pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
                />
              </form>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/catalog"
                  className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  <Search className="size-4" />
                  Explorar catálogo
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex h-11 items-center gap-2 rounded-sm border border-border px-6 text-sm font-medium text-foreground transition-colors hover:border-foreground/50"
                >
                  Crear cuenta
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="mt-12 flex items-center gap-8 border-t border-border/60 pt-6">
                <div>
                  <p className="font-mono text-xl font-light">
                    {CATEGORIES.length}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Categorías
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xl font-light">365</p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Lunas
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xl font-light">4K</p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Exportación
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Live moon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-sm"
            >
              <div className="relative flex aspect-square items-center justify-center rounded-full border border-border/70">
                <div
                  className="pointer-events-none absolute inset-6 rounded-full opacity-60"
                  style={{
                    background:
                      "radial-gradient(circle at 38% 34%, rgba(255,255,255,0.06), transparent 62%)",
                  }}
                />
                <svg viewBox="-56 -56 112 112" className="size-44 sm:size-52">
                  <circle
                    r={44}
                    fill="var(--color-secondary, #1c1c1f)"
                    stroke="currentColor"
                    strokeOpacity="0.25"
                    strokeWidth="0.5"
                    className="text-muted-foreground"
                  />
                  <path
                    d={d}
                    fill="currentColor"
                    className="text-foreground"
                    opacity={0.92}
                  />
                </svg>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    esta noche · {illumination}% iluminada · fase{" "}
                    {phase.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                Renderizada en vivo con la fecha de hoy
              </p>
            </motion.div>
          </div>
        </section>

        {/* Discovery areas */}
        <section className="border-y border-border/60">
          <div className="mx-auto w-full max-w-6xl px-5 py-14">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Ecosistema
                </p>
                <h2 className="mt-3 text-2xl font-light tracking-tight sm:text-3xl">
                  Las puertas del ecosistema
                </h2>
              </div>
            </div>
            <div className="mt-10 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
              {AREAS.map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="group bg-background p-6 transition-colors hover:bg-muted/40"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {a.meta}
                  </p>
                  <h3 className="mt-4 flex items-center gap-1.5 text-[15px] font-medium">
                    {a.title}
                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {a.body}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trending tools */}
        <section className="mx-auto w-full max-w-6xl px-5 py-14">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Tendencia
              </p>
              <h2 className="mt-3 text-2xl font-light tracking-tight sm:text-3xl">
                Herramientas en órbita
              </h2>
            </div>
            <Link
              to="/tools"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver directorio
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {trending.map((t) => (
              <Link
                key={t.id}
                to={`/tools/${t.slug}`}
                className="group inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2.5 transition-colors hover:border-foreground/40"
              >
                <span className="text-[13px]">{t.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {t.category}
                </span>
              </Link>
            ))}
          </div>

          {/* Featured + inspiration preview */}
          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Destacadas
              </h3>
              <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
                {featured.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/tools/${t.slug}`}
                      className="flex items-center justify-between py-3.5 transition-colors hover:text-muted-foreground"
                    >
                      <span className="text-[14px]">{t.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {t.shortDescription.slice(0, 34)}…
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Inspiración reciente
                </h3>
                <Link
                  to="/inspiration"
                  className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ver todo
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {inspirationSample.map((i) => (
                  <div
                    key={i.id}
                    className="overflow-hidden rounded-sm border border-border/60"
                  >
                    <div
                      className="aspect-[4/3] w-full"
                      style={{ background: i.gradient }}
                    />
                    <p className="truncate px-2.5 py-2 text-[11px] text-muted-foreground">
                      {i.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Resource categories strip */}
        <section className="border-t border-border/60">
          <div className="mx-auto w-full max-w-6xl px-5 py-10">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c}
                  to="/catalog"
                  className="rounded-sm border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {c}
                </Link>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/collections"
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Tus colecciones →
              </Link>
              <Link
                to="/submit"
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Enviar una propuesta →
              </Link>
              <Link
                to="/articles"
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Leer los artículos →
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
          <motion.div {...fadeUp}>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Qué incluye
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-light tracking-tight sm:text-4xl">
              Todo lo necesario. Nada de más.
            </h2>
          </motion.div>
          <div className="mt-14 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.04 }}
                className="bg-background p-7 transition-colors hover:bg-muted/40"
              >
                <p className="font-mono text-[10px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-[15px] font-medium">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-border/60">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
            <motion.div {...fadeUp}>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Cómo funciona
              </p>
              <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">
                Cuatro pasos. Un minuto.
              </h2>
            </motion.div>
            <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.n}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                  className="border-t border-foreground/20 pt-5"
                >
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {s.n}
                  </p>
                  <h3 className="mt-3 text-[15px] font-medium">{s.title}</h3>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    {s.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/60">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 py-20 sm:py-24 lg:flex-row lg:items-center lg:justify-between">
            <motion.div {...fadeUp}>
              <h2 className="max-w-lg text-3xl font-light tracking-tight sm:text-4xl">
                Tu próximo recurso está a una búsqueda.
              </h2>
              <p className="mt-3 max-w-md text-[15px] text-muted-foreground">
                Crea tu cuenta, explora el catálogo y empieza a descargar.
              </p>
            </motion.div>
            <Link
              to="/auth"
              className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-sm bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Empezar ahora
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-muted-foreground">
            Minimal Lunar Design — búsqueda de recursos de edición y diseño.
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            Fase {phase.toFixed(3)} · {illumination}% iluminada esta noche
          </p>
        </div>
      </footer>
    </div>
  );
}
