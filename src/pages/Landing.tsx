import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowUpRight, Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { moonPhase } from "@/lib/lunar";
import { BRAND } from "@/lib/brand";
import { CATEGORIES } from "@/lib/catalog";
import { SiteHeader } from "@/components/SiteHeader";
import { LiquidOrbStage } from "@/components/LiquidOrb";
import { useDirectorySeed } from "@/hooks/use-directory-seed";
import { PROJECTS } from "@/data/community";
import { EditorialSection } from "@/components/editorial/EditorialSection";
import { ParallaxImage } from "@/components/editorial/ParallaxImage";
import { ContactFooter } from "@/components/editorial/ContactFooter";
import { useGsapReveal } from "@/hooks/use-gsap";

function useTodayMoon() {
  return useMemo(() => {
    const now = new Date();
    const phase = moonPhase(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const illumination = Math.round(
      ((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100,
    );
    return { phase, illumination };
  }, []);
}

const STRATEGIES = [
  {
    n: "01",
    title: "Descubrir sin ruido",
    body: "Un buscador que cruza herramientas, recursos, proyectos e inspiración en una sola consulta.",
  },
  {
    n: "02",
    title: "Componer en la ficha",
    body: "Cada recurso es un lienzo: bloques de imagen, vídeo, galerías y sliders que cualquiera puede ampliar.",
  },
  {
    n: "03",
    title: "Guardar lo que importa",
    body: "Colecciones personales para referencias, herramientas y materiales, siempre a mano.",
  },
  {
    n: "04",
    title: "Publicar y colaborar",
    body: "Sube tus recursos, propone herramientas y deja que la comunidad extienda tu trabajo.",
  },
  {
    n: "05",
    title: "Exportar a tu flujo",
    body: "Del calendario lunar en 4K al markdown de cada ficha: todo sale del laboratorio hacia tu proceso.",
  },
];

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
    meta: "31 herramientas",
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
  const { phase, illumination } = useTodayMoon();
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");
  const heroRef = useGsapReveal<HTMLDivElement>(0.1);
  // First-visit seed: fills the directory from the curated catalog.
  useDirectorySeed();

  // Live directory data (DB-backed): ranked by votes, plus aggregate stats.
  const directory = useQuery(api.tools.listAllPublished, {});
  const dirStats = useQuery(api.tools.stats, {});
  const trending = useMemo(
    () => (directory ?? []).filter((t) => t.trending).slice(0, 5),
    [directory],
  );
  const featured = useMemo(
    () => (directory ?? []).filter((t) => t.featured).slice(0, 5),
    [directory],
  );
  const cases = useMemo(() => PROJECTS.slice(0, 3), []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div ref={heroRef} className="mx-auto w-full max-w-6xl px-5">
          <div className="grid gap-12 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16 lg:pb-20 lg:pt-20">
            <div>
              <p
                data-reveal
                className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground"
              >
                {BRAND.tagline}
              </p>
              {/* display-editorial scales with the viewport: large but never
                  overflowing on mobile, monumental on desktop. */}
              <h1 className="display-editorial mt-6 uppercase" data-reveal>
                Exploramos
                <br />
                <span className="text-outline">lo que la luz</span>
                <br />
                <span className="text-muted-foreground">deja ver.</span>
              </h1>
              <p
                data-reveal
                className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground"
              >
                Herramientas, recursos y experimentos de exploración visual y
                tecnológica. Descubre, guarda y compón con la comunidad —
                empieza buscando.
              </p>

              <div data-reveal className="mt-8 max-w-md">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    navigate(
                      heroQuery.trim()
                        ? `/discover?q=${encodeURIComponent(heroQuery.trim())}`
                        : "/discover",
                    );
                  }}
                  className="relative"
                >
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Herramientas, recursos, proyectos…"
                    aria-label="Buscador global"
                    className="h-12 w-full rounded-sm border border-border bg-transparent pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
                  />
                </form>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link to="/catalog" className="btn-solid">
                    Explorar catálogo
                    <ArrowUpRight className="size-4" />
                  </Link>
                  <Link to="/auth" className="btn-outline">
                    Crear cuenta
                  </Link>
                </div>
              </div>

              {/* Stats — hairline-separated, compact on mobile */}
              <dl
                data-reveal
                className="mt-10 flex items-center gap-6 border-t border-border/60 pt-5 sm:gap-10"
              >
                {[
                  {
                    v: dirStats ? String(dirStats.total) : "—",
                    k: "Herramientas",
                  },
                  {
                    v: dirStats ? String(dirStats.votes) : "—",
                    k: "Votos",
                  },
                  { v: "365", k: "Lunas" },
                ].map((s) => (
                  <div key={s.k} className="border-l border-border/60 pl-4 first:border-l-0 first:pl-0">
                    <dt className="sr-only">{s.k}</dt>
                    <dd className="font-mono text-xl font-light">{s.v}</dd>
                    <dd className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                      {s.k}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Live liquid orb — theme-aware WebGL, preset switcher below.
                Stacks under the copy on mobile, right column on lg. */}
            <div data-reveal className="relative mx-auto w-full max-w-[16rem] sm:max-w-sm">
              <LiquidOrbStage />
              <p className="mt-4 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                Orbe líquido · {illumination}% iluminada esta noche
              </p>
            </div>
          </div>
        </div>

        {/* ── 01 · Strategies (numbered list) ─────────────────────────── */}
        <EditorialSection
          index="01"
          kicker="Estrategias"
          title="Cómo el laboratorio trabaja"
          border
        >
          <ol className="mt-10">
            {STRATEGIES.map((s) => (
              <li
                key={s.n}
                data-reveal
                className="group grid gap-2 border-t border-border/60 py-6 transition-colors first:border-t-0 hover:bg-muted/30 sm:grid-cols-[4rem_1fr_2rem] sm:items-baseline sm:gap-6 sm:py-7"
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  /{s.n}
                </span>
                <div>
                  <h3 className="text-lg font-medium tracking-tight transition-colors group-hover:text-muted-foreground sm:text-xl">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
                <ArrowUpRight className="hidden size-4 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
              </li>
            ))}
          </ol>
        </EditorialSection>

        {/* ── 02 · About (manifesto) ──────────────────────────────────── */}
        <EditorialSection
          index="02"
          kicker="Sobre el laboratorio"
          title="Una práctica, no un producto"
          border
        >
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <p
              data-reveal
              className="font-editorial text-xl leading-relaxed sm:text-2xl sm:leading-relaxed"
            >
              MOONØ.LAB es un laboratorio digital independiente. Exploramos
              herramientas, recursos y experimentos con una obsesión: que cada
              pieza que entra salga más útil de lo que llegó. Sin humo — solo
              el proceso, abierto.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1" data-reveal>
              {STEPS.map((s) => (
                <div key={s.n} className="border-t border-foreground/20 pt-4">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {s.n}
                  </p>
                  <h3 className="mt-2 text-[15px] font-medium">{s.title}</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </EditorialSection>

        {/* ── 03 · Case studies (interactive, parallax) ───────────────── */}
        <EditorialSection
          index="03"
          kicker="Casos"
          title="Exploraciones recientes"
          border
          action={
            <Link
              to="/projects"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver todos
            </Link>
          }
        >
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {cases.map((p) => (
              <Link
                key={p.id}
                data-reveal
                to={`/projects/${p.slug}`}
                className="group block"
              >
                <ParallaxImage background={p.gradient} aspect="4/3">
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                    <div className="flex items-end justify-between gap-3">
                      <h3 className="text-[15px] font-medium text-foreground">
                        {p.title}
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70">
                        {p.year}
                      </span>
                    </div>
                  </div>
                </ParallaxImage>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="truncate text-[13px] text-muted-foreground">
                    {p.tags.slice(0, 3).join(" · ")}
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors group-hover:text-foreground">
                    {p.category}
                  </span>
                </div>
              </Link>
            ))}
            {/* Studio case — the exportable lunar calendar */}
            <Link data-reveal to="/studio" className="group block">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm border border-border/60 bg-muted transition-colors group-hover:bg-accent">
                <span className="select-none text-5xl font-light tracking-tight text-outline-muted transition-colors group-hover:[-webkit-text-stroke-color:var(--foreground)] sm:text-6xl">
                  365
                </span>
                <span className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  estudio lunar
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="truncate text-[13px] text-muted-foreground">
                  Calendario de 365 lunas, exportable en SVG y PNG 4K
                </p>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </div>
            </Link>
          </div>
        </EditorialSection>

        {/* ── 04 · Ecosystem areas ────────────────────────────────────── */}
        <EditorialSection
          index="04"
          kicker="Ecosistema"
          title="Las puertas del ecosistema"
          border
        >
          <div className="mt-10 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {AREAS.map((a) => (
              <Link
                key={a.to}
                data-reveal
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
        </EditorialSection>

        {/* ── 05 · Trending + featured ────────────────────────────────── */}
        <EditorialSection
          index="05"
          kicker="Tendencia"
          title="Herramientas en órbita"
          border
          action={
            <Link
              to="/tools"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver directorio
            </Link>
          }
        >
          <div className="mt-10 flex flex-wrap gap-2" data-reveal>
            {trending.map((t) => (
              <Link
                key={t._id}
                to={`/tools/${t.slug}`}
                className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2.5 transition-colors hover:border-foreground/40"
              >
                <span className="text-[13px]">{t.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {t.category}
                </span>
              </Link>
            ))}
            {directory !== undefined && trending.length === 0 && (
              <p className="text-[13px] text-muted-foreground">
                Sin herramientas en tendencia ahora mismo.
              </p>
            )}
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <div data-reveal>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Destacadas
              </h3>
              <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
                {featured.map((t) => (
                  <li key={t._id}>
                    <Link
                      to={`/tools/${t.slug}`}
                      className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:text-muted-foreground"
                    >
                      <span className="shrink-0 text-[14px]">{t.name}</span>
                      <span className="truncate font-mono text-[11px] text-muted-foreground">
                        ▲ {t.votes} · {t.shortDescription.slice(0, 30)}…
                      </span>
                    </Link>
                  </li>
                ))}
                {directory !== undefined && featured.length === 0 && (
                  <li className="py-3.5 text-[13px] text-muted-foreground">
                    Aún no hay herramientas destacadas.
                  </li>
                )}
              </ul>
            </div>
            <div data-reveal>
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
                {PROJECTS.slice(3, 6).map((i) => (
                  <Link
                    key={i.id}
                    to={`/projects/${i.slug}`}
                    className="group overflow-hidden rounded-sm border border-border/60"
                  >
                    <ParallaxImage background={i.gradient} aspect="1/1" />
                    <p className="truncate px-2.5 py-2 text-[11px] text-muted-foreground">
                      {i.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </EditorialSection>

        {/* ── 06 · Features ───────────────────────────────────────────── */}
        <EditorialSection
          index="06"
          kicker="Qué incluye"
          title="Todo lo necesario. Nada de más."
          border
        >
          <div className="mt-10 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                data-reveal
                className="bg-background p-7 transition-colors hover:bg-muted/40"
              >
                <p className="font-mono text-[10px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-[15px] font-medium">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </EditorialSection>

        {/* ── 07 · Categories strip ───────────────────────────────────── */}
        <section className="border-t border-border/60">
          <div className="mx-auto w-full max-w-6xl px-5 py-12">
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
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
      </main>

      <ContactFooter phase={phase} illumination={illumination} />
    </div>
  );
}
