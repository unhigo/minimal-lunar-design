import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  Lock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/hooks/use-page-meta";
import { BRAND } from "@/lib/brand";
import { copyToClipboard } from "@/lib/clipboard";
import {
  buildEmbedCode,
  clampDimension,
  EMBED_DIM_MAX,
  EMBED_DIM_MIN,
  EMBED_FORMATS,
  EMBED_FORMAT_LABELS,
  normalizeEmbedUrl,
  type EmbedFormat,
  type EmbedOptions,
} from "@/lib/embed";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULTS: EmbedOptions = {
  url: "https://www.youtube.com/embed/aqz-KE-bpKQ",
  title: "",
  width: 800,
  height: 450,
  responsive: true,
  lazy: true,
  scrolling: true,
  border: true,
  format: "html",
};

export default function EmbedGenerator() {
  usePageMeta({
    title: `Nyxhora — Generador de código embed · ${BRAND.mark}`,
    description:
      "Genera código de incrustación responsivo en HTML, React/Next.js, AMP o Web Component: vista previa en vivo, carga diferida y copia al portapapeles.",
    path: "/tools/nyxhora-embed",
  });

  const [opts, setOpts] = useState<EmbedOptions>(DEFAULTS);
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [copied, setCopied] = useState(false);
  const [proOpen, setProOpen] = useState(false);

  const url = opts.url.trim();
  const validUrl = useMemo(() => normalizeEmbedUrl(url), [url]);
  const validTitle = opts.title.trim().length > 0;
  const canPreview = Boolean(validUrl) && validTitle;
  const code = useMemo(() => buildEmbedCode({ ...opts, url: validUrl ?? url }), [opts, validUrl, url]);

  // Reset the transient "copied" state after each copy.
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  function set<K extends keyof EmbedOptions>(key: K, value: EmbedOptions[K]) {
    setOpts((o) => ({ ...o, [key]: value }));
  }

  async function handleCopy() {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      toast.success("Código copiado al portapapeles");
    } else {
      toast.error("No se pudo copiar — selecciona el código y cópialo manualmente");
    }
  }

  function resetDefaults() {
    setOpts(DEFAULTS);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        {/* Breadcrumb + hero */}
        <nav aria-label="Miga de pan" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link to="/tools" className="transition-colors hover:text-foreground">
            herramientas
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground">nyxhora embed</span>
        </nav>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Laboratorio · herramienta interna
            </p>
            <h1 className="mt-3 h1-editorial tracking-tight">
              Nyxhora Embed Code Generator
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              Convierte cualquier URL en un bloque incrustable listo para
              producción: responsivo 16:9, carga diferida, controles de scroll y
              borde, y salida para HTML, React/Next.js, AMP o Web Component.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={() => setProOpen(true)} className="rounded-sm">
              <Sparkles className="size-4" />
              Nyxhora Pro
            </Button>
            <Link
              to="/tools"
              className="inline-flex h-11 items-center rounded-sm border border-border px-5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              Ver directorio
            </Link>
          </div>
        </div>

        {/* Workspace */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* ── Controls ─────────────────────────────────────────────── */}
          <section aria-labelledby="controls-heading" className="rounded-sm border border-border/60 p-6">
            <h2 id="controls-heading" className="text-[15px] font-medium">
              Configuración
            </h2>
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="embed-url">URL de origen</Label>
                <Input
                  id="embed-url"
                  value={opts.url}
                  onChange={(e) => set("url", e.target.value)}
                  placeholder="https://ejemplo.com/video/123"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  data-1p-ignore
                />
                <p className="text-[12px] text-muted-foreground">
                  {validUrl
                    ? "URL válida — se usará como src del iframe."
                    : "Introduce una URL http(s) válida para activar la vista previa."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="embed-title">Título de accesibilidad</Label>
                <Input
                  id="embed-title"
                  value={opts.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="p. ej. Presentación del laboratorio"
                  autoComplete="off"
                  data-1p-ignore
                />
                <p className="text-[12px] text-muted-foreground">
                  {validTitle
                    ? "Se usará como atributo title del iframe."
                    : "Obligatorio: describe el contenido para lectores de pantalla."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="embed-width">Ancho (px)</Label>
                  <Input
                    id="embed-width"
                    type="number"
                    min={EMBED_DIM_MIN}
                    max={EMBED_DIM_MAX}
                    value={opts.width}
                    onChange={(e) =>
                      set("width", clampDimension(Number(e.target.value)))
                    }
                    data-1p-ignore
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Ancho máximo del contenedor.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="embed-height">Alto (px)</Label>
                  <Input
                    id="embed-height"
                    type="number"
                    min={EMBED_DIM_MIN}
                    max={EMBED_DIM_MAX}
                    value={opts.height}
                    onChange={(e) =>
                      set("height", clampDimension(Number(e.target.value)))
                    }
                    data-1p-ignore
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Altura fija sin modo responsivo.
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t border-border/60 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="embed-responsive">Modo responsivo 16:9</Label>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      El marco escala manteniendo la proporción.
                    </p>
                  </div>
                  <Switch
                    id="embed-responsive"
                    checked={opts.responsive}
                    onCheckedChange={(v) => set("responsive", v)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="embed-lazy">Carga diferida (lazy)</Label>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      No carga el contenido hasta estar cerca del viewport.
                    </p>
                  </div>
                  <Switch
                    id="embed-lazy"
                    checked={opts.lazy}
                    onCheckedChange={(v) => set("lazy", v)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="embed-scroll">Permitir scroll interno</Label>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      Desactívalo para bloquear el desplazamiento dentro del marco.
                    </p>
                  </div>
                  <Checkbox
                    id="embed-scroll"
                    checked={opts.scrolling}
                    onCheckedChange={(v) => set("scrolling", v === true)}
                    className="size-5"
                  />
                </div>
                <div
                  className={`flex items-center justify-between gap-4 transition-opacity ${
                    opts.responsive ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <div>
                    <Label htmlFor="embed-border">Mostrar borde fino</Label>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      Hairline de 1px alrededor del marco.
                      {opts.responsive ? " Solo en tamaño fijo." : ""}
                    </p>
                  </div>
                  <Checkbox
                    id="embed-border"
                    checked={opts.border}
                    onCheckedChange={(v) => set("border", v === true)}
                    disabled={opts.responsive}
                    className="size-5"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-5">
                <Label htmlFor="embed-format">Formato de código</Label>
                <Select
                  value={opts.format}
                  onValueChange={(v) => set("format", v as EmbedFormat)}
                >
                  <SelectTrigger id="embed-format" className="w-full">
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMBED_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {EMBED_FORMAT_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-5">
                <button
                  type="button"
                  onClick={resetDefaults}
                  className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  Restablecer
                </button>
              </div>
            </div>
          </section>

          {/* ── Output: code + live preview ──────────────────────────── */}
          <section
            aria-labelledby="output-heading"
            className="rounded-sm border border-border/60 p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="output-heading" className="text-[15px] font-medium">
                Resultado
              </h2>
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as "code" | "preview")}
              >
                <TabsList>
                  <TabsTrigger value="code">Código</TabsTrigger>
                  <TabsTrigger value="preview">Vista previa</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {tab === "code" ? (
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {EMBED_FORMAT_LABELS[opts.format]} ·{" "}
                    {opts.responsive
                      ? "responsivo 16:9"
                      : `${opts.width}×${opts.height}px`}{" "}
                    · {opts.lazy ? "lazy" : "eager"}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    disabled={!canPreview}
                    variant="secondary"
                    className="shrink-0 rounded-sm"
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <pre className="custom-scrollbar mt-3 max-h-[26rem] overflow-auto rounded-sm border border-border/60 bg-muted/40 p-4 font-mono text-[12px] leading-relaxed text-foreground/90">
                  <code>{code}</code>
                </pre>
                <p className="mt-3 text-[12px] text-muted-foreground">
                  Si el portapapeles está bloqueado en la vista previa, usa el
                  fallback automático o copia a mano desde el bloque.
                </p>
              </div>
            ) : (
              <div className="mt-5">
                {canPreview && validUrl ? (
                  opts.responsive ? (
                    <div
                      className="relative w-full overflow-hidden rounded-sm border border-border/60 bg-muted"
                      style={{ paddingTop: "56.25%" }}
                    >
                      <iframe
                        key={`${validUrl}|${opts.title.trim()}`}
                        src={validUrl}
                        title={opts.title.trim()}
                        className="absolute inset-0 size-full border-0"
                        loading={opts.lazy ? "lazy" : "eager"}
                        scrolling={opts.scrolling ? "yes" : "no"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div
                      className={`relative overflow-hidden rounded-sm bg-muted ${
                        opts.border ? "border border-border/60" : "border-0"
                      }`}
                      style={{
                        height: clampDimension(opts.height),
                        maxWidth: "100%",
                      }}
                    >
                      <iframe
                        key={`${validUrl}|${opts.title.trim()}`}
                        src={validUrl}
                        title={opts.title.trim()}
                        className="size-full border-0"
                        loading={opts.lazy ? "lazy" : "eager"}
                        scrolling={opts.scrolling ? "yes" : "no"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  )
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border/70 px-6 text-center">
                    <Lock className="size-5 text-muted-foreground" />
                    <p className="max-w-sm text-[13px] text-muted-foreground">
                      Introduce una URL válida y un título de accesibilidad para
                      activar la vista previa en vivo.
                    </p>
                  </div>
                )}
                <p className="mt-3 text-[12px] text-muted-foreground">
                  La previsualización se actualiza al instante con cada cambio.
                  Algunos orígenes (Google, bancos) bloquean su incrustación —
                  prueba YouTube, Vimeo o Maps.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Pro banner */}
        <aside
          aria-label="Funciones Pro del generador"
          className="mt-12 flex flex-col gap-4 rounded-sm border border-foreground/25 bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              actualización pro
            </p>
            <h2 className="mt-2 text-[15px] font-medium">
              Guarda y comparte presets de incrustación
            </h2>
            <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
              Colecciones de configuraciones reutilizables, CSS de borde
              personalizado y lotes de URLs convertidos en un solo paso.
            </p>
          </div>
          <Button onClick={() => setProOpen(true)} className="shrink-0 rounded-sm">
            <Sparkles className="size-4" />
            Ver Pro
          </Button>
        </aside>

        {/* Integration banner */}
        <aside
          aria-label="Integración con el laboratorio"
          className="mt-6 flex flex-col gap-4 rounded-sm border border-border/60 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              en el laboratorio
            </p>
            <h2 className="mt-2 text-[15px] font-medium">
              Publica el resultado como recurso
            </h2>
            <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
              Guarda tus incrustaciones como fichas con bloques para que la
              comunidad las descubra, comente y reutilice.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              to="/upload"
              className="inline-flex h-11 items-center rounded-sm border border-foreground/70 px-5 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              <Code2 className="size-4" />
              Publicar recurso
            </Link>
            <a
              href="https://developer.mozilla.org/es/docs/Web/HTML/Element/iframe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-sm border border-border px-5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              Docs de iframe
              <ExternalLink className="size-4" />
            </a>
          </div>
        </aside>
      </main>

      {/* Pro update modal */}
      <Dialog open={proOpen} onOpenChange={setProOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              Nyxhora Pro
            </DialogTitle>
            <DialogDescription>
              Las funciones Pro del generador están en camino. Deja tu cuenta
              lista y te avisaremos en cuanto abran los presets guardados.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-[13px] text-muted-foreground">
            {[
              "Presets guardados y compartibles por enlace",
              "Borde y estilos CSS personalizados",
              "Conversión por lotes de listas de URLs",
              "Exportación directa a colecciones del laboratorio",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-sm"
              onClick={() => setProOpen(false)}
            >
              Más tarde
            </Button>
            <Button
              className="flex-1 rounded-sm"
              onClick={() => {
                setProOpen(false);
                toast.success("Apuntado — te avisaremos con la novedad");
              }}
            >
              Avisadme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
