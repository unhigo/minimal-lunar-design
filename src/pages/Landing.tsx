import { useMemo } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { moonPath, moonPhase } from "@/lib/lunar";
import { CATEGORIES } from "@/lib/catalog";

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

export default function Landing() {
  const { phase, illumination, d } = useTodayMoon(44);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full border border-foreground/40">
              <span className="size-2 rounded-full bg-foreground/70" />
            </span>
            <span className="text-sm font-medium uppercase tracking-[0.22em]">
              Minimal Lunar Design
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/catalog"
              className="hidden px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Catálogo
            </Link>
            <a
              href="#how"
              className="hidden px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Cómo funciona
            </a>
            <Link
              to="/auth"
              className="inline-flex h-9 items-center rounded-sm border border-foreground/70 px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Empezar
            </Link>
          </nav>
        </div>
      </header>

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
                Minimal Lunar Design es un catálogo de recursos de edición y
                diseño: mockups, fuentes, texturas y plantillas. Encuentra lo
                que necesitas, comparte lo que creas y compón tu calendario
                lunar en el estudio.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
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

        {/* Category strip */}
        <section className="border-y border-border/60">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-2 px-5 py-8">
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
