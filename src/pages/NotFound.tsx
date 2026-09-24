import { motion } from "framer-motion";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { LiquidOrb } from "@/components/LiquidOrb";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16">
        <div className="relative mb-10 size-28">
          <LiquidOrb preset="umbra" interactive={false} className="rounded-full" />
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
            {BRAND.footerLine}
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
