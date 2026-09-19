import { motion } from "framer-motion";
import { Link } from "react-router";
import { ArrowLeft, Moon } from "lucide-react";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16">
        <div className="relative mb-10 flex size-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-border/70" />
          <div className="absolute inset-4 rounded-full bg-secondary/60" />
          <div className="absolute left-0 top-1/2 h-24 w-12 -translate-y-1/2 rounded-full bg-background" />
          <Moon className="relative size-8 text-muted-foreground" />
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-4 h1-editorial tracking-tight">
          Esta luna no existe.
        </h1>
        <p className="mt-3 max-w-sm text-center text-[14px] leading-relaxed text-muted-foreground">
          La página que buscas se ha eclipsado o nunca ha estado aquí. Prueba a
          volver al catálogo o al inicio.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Link
            to="/"
            className="btn-solid"
          >
            <ArrowLeft className="size-4" />
            Volver al inicio
          </Link>
          <Link
            to="/catalog"
            className="inline-flex h-11 items-center rounded-sm border border-border px-5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Ver catálogo
          </Link>
        </div>
      </div>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-6 text-center">
          <p className="font-mono text-[11px] text-muted-foreground">

          </p>
        </div>
      </footer>
    </motion.div>
  );
}
