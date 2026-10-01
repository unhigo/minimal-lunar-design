/**
 * /design-system — the visual source of truth of MOONØ.LAB.
 *
 * Documents the real tokens (colors, typography, spacing, radius, motion),
 * the real primitives (Button, Input, Badge, Table, Tabs, Dialog, Tooltip)
 * with their interaction states, and the block registry. Built exclusively
 * from the same ui/* components and CSS variables the app consumes, so this
 * page can never drift from the system it documents.
 */
import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Check, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BLOCK_LIMITS, BLOCK_REGISTRY } from "@/lib/block-registry";

const SECTIONS = [
  { id: "color", label: "Color" },
  { id: "typography", label: "Tipografía" },
  { id: "spacing", label: "Spacing" },
  { id: "radius", label: "Radius" },
  { id: "motion", label: "Motion" },
  { id: "buttons", label: "Botones" },
  { id: "forms", label: "Formularios" },
  { id: "feedback", label: "Badges" },
  { id: "overlays", label: "Overlays" },
  { id: "data", label: "Datos" },
  { id: "blocks", label: "Block registry" },
];

const SWATCHES: { token: string; hex: string; role: string }[] = [
  { token: "--background", hex: "#050505", role: "Aplicación (canvas)" },
  { token: "--gray-0d", hex: "#0D0D0D", role: "Superficie / card / popover" },
  { token: "--gray-11", hex: "#111111", role: "Superficie interna / muted" },
  { token: "--gray-1c", hex: "#1C1C1C", role: "Hover / separación / border-subtle" },
  { token: "--gray-3", hex: "#333333", role: "Borde interactivo / input" },
  { token: "--gray-4", hex: "#444444", role: "Borde hover" },
  { token: "--foreground", hex: "#FFFFFF", role: "Texto principal" },
  { token: "--gray-c", hex: "#C0C0C0", role: "Texto secundario" },
  { token: "--gray-a", hex: "#A0A0A0", role: "Texto muted" },
  { token: "--gray-7", hex: "#777777", role: "Texto subtle / placeholder" },
  { token: "--destructive", hex: "#FF0033", role: "Acento / focus / crítico" },
];

const SPACING = [
  ["1", "4px"],
  ["2", "8px"],
  ["3", "12px"],
  ["4", "16px"],
  ["5", "20px"],
  ["6", "24px"],
  ["8", "32px"],
  ["10", "40px"],
  ["12", "48px"],
  ["16", "64px"],
  ["20", "80px"],
  ["24", "96px"],
] as const;

const MOTION = [
  ["--motion-fast", "fast · 120ms"],
  ["--motion-normal", "normal · 180ms"],
  ["--motion-medium", "medium · 240ms"],
  ["--motion-slow", "slow · 400ms"],
] as const;

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-(--gray-1c) pt-6">
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      {note && (
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          {note}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Swatch({ token, hex, role }: { token: string; hex: string; role: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="size-10 shrink-0 rounded-md border border-(--gray-3)"
        style={{ background: `var(${token})` }}
      />
      <div className="min-w-0">
        <p className="truncate font-mono text-[12px] text-foreground">
          {token} <span className="text-muted-foreground">· {hex}</span>
        </p>
        <p className="truncate text-[12px] text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

export default function DesignSystem() {
  const [open, setOpen] = useState(false);
  const [play, setPlay] = useState(0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </Link>
          <span className="mono-label text-muted-foreground">
            MOONØ.LAB — fuente visual de verdad
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="grid gap-10 lg:grid-cols-[180px_minmax(0,1fr)]">
          <nav aria-label="Secciones" className="hidden lg:block">
            <ul className="sticky top-8 space-y-1">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-10">
            <div>
              <h1 className="text-3xl font-light tracking-tight">Design System</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                Tokens, primitivas y estados reales del laboratorio. Cada ejemplo
                usa los mismos componentes y variables CSS que la aplicación, así
                que esta página nunca diverge del sistema que documenta.
              </p>
            </div>

            <Section
              id="color"
              title="Color"
              note="Jerarquía estricta #050505 → #0D0D0D → #111111 → #1C1C1C, bordes #333333. El rojo es señal: focus, acento y crítico. Nunca superficies grandes."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {SWATCHES.map((s) => (
                  <Swatch key={s.token} {...s} />
                ))}
              </div>
            </Section>

            <Section
              id="typography"
              title="Tipografía"
              note="Inter + JetBrains Mono. La jerarquía surge de tamaño, peso y contraste — no de pesos extremos."
            >
              <div className="space-y-4">
                <p className="text-4xl font-medium tracking-[-0.03em]">Display</p>
                <p className="text-2xl font-medium tracking-[-0.02em]">Heading</p>
                <p className="text-lg font-medium">Title</p>
                <p className="text-[15px] leading-relaxed">
                  Body — 15px/1.6. La interfaz es compacta y editorial; el texto
                  largo vive en este tamaño con color secundario cuando acompaña.
                </p>
                <p className="text-[13px] text-muted-foreground">Small · 13px</p>
                <p className="mono-label">Label · mono · 0.18em</p>
                <p className="font-mono text-[12px] text-muted-foreground">
                  Mono · JB-7F2A · 44.1kHz · Δ +0.83
                </p>
              </div>
            </Section>

            <Section
              id="spacing"
              title="Spacing"
              note="Escala 4/8px: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96."
            >
              <div className="space-y-2">
                {SPACING.map(([t, px]) => (
                  <div key={t} className="flex items-center gap-3">
                    <span className="w-16 font-mono text-[11px] text-muted-foreground">
                      {px}
                    </span>
                    <span
                      aria-hidden
                      className="h-1.5 rounded-full bg-(--gray-4)"
                      style={{ width: px }}
                    />
                  </div>
                ))}
              </div>
            </Section>

            <Section
              id="radius"
              title="Radius"
              note="4 / 6 / 8 / 12. Inputs y botones 6px, cards 8px, modales 12px, chips 4px."
            >
              <div className="flex flex-wrap gap-4">
                {[
                  ["rounded-sm", "4"],
                  ["rounded-md", "6"],
                  ["rounded-lg", "8"],
                  ["rounded-xl", "12"],
                ].map(([cls, px]) => (
                  <div key={cls} className="text-center">
                    <div
                      aria-hidden
                      className={`size-16 border border-(--gray-3) bg-(--gray-11) ${cls}`}
                    />
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                      {px}px
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              id="motion"
              title="Motion"
              note="120 / 180 / 240 / 400ms sobre opacity y transform. Respeta prefers-reduced-motion."
            >
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlay((p) => p + 1)}
                >
                  Reproducir
                </Button>
                <span className="font-mono text-[11px] text-muted-foreground">
                  remount #{play}
                </span>
              </div>
              <div className="mt-4 max-w-md space-y-3">
                {MOTION.map(([v, label]) => (
                  <div key={v} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 font-mono text-[11px] text-muted-foreground">
                      {label}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--gray-1c)">
                      <div
                        key={`${v}-${play}`}
                        className="h-full w-1/3 rounded-full bg-(--gray-4)"
                        style={{ animation: `riseIn var(${v}) ease-out both` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              id="buttons"
              title="Botones"
              note="Primary blanco, secundario con borde #333, ghost silencioso, destructive rojo. Estados: default · hover · focus · pressed · disabled · loading · success."
            >
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Primary</Button>
                  <Button>Primary md</Button>
                  <Button size="lg">Primary lg</Button>
                  <Button variant="secondary" size="sm">
                    Secondary
                  </Button>
                  <Button variant="outline" size="sm">
                    Outline
                  </Button>
                  <Button variant="ghost" size="sm">
                    Ghost
                  </Button>
                  <Button variant="destructive" size="sm">
                    Destructive
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Acción de icono">
                    <Info className="size-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" disabled>
                    Disabled
                  </Button>
                  <Button size="sm" disabled>
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading
                  </Button>
                  <Button size="sm" variant="outline">
                    <Check className="size-3.5 text-(--status-success)" />
                    Guardado
                  </Button>
                </div>
              </div>
            </Section>

            <Section
              id="forms"
              title="Formularios"
              note="Fondo #0D0D0D, borde #333333, placeholder #777777. El focus es un borde rojo con ring al 15% — sin glow."
            >
              <div className="grid max-w-xl gap-4">
                <Input placeholder="Input · escribe aquí" aria-label="Input de ejemplo" />
                <Input
                  defaultValue="Valor persistido"
                  aria-label="Input con valor"
                />
                <Input
                  placeholder="Input deshabilitado"
                  disabled
                  aria-label="Input deshabilitado"
                />
                <Input
                  placeholder="Estado inválido"
                  aria-invalid="true"
                  aria-label="Input inválido"
                />
                <Textarea
                  placeholder="Textarea · field-sizing"
                  aria-label="Textarea de ejemplo"
                />
                <Select>
                  <SelectTrigger className="w-44" aria-label="Select de ejemplo">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lunar">Lunar</SelectItem>
                    <SelectItem value="design">Diseño</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Section>

            <Section
              id="feedback"
              title="Badges"
              note="Compactos (20–24px), radius 6px. El rojo solo cuando el estado lo exige."
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge>default</Badge>
                <Badge variant="secondary">secondary</Badge>
                <Badge variant="outline">outline</Badge>
                <Badge variant="success">success</Badge>
                <Badge variant="warning">warning</Badge>
                <Badge variant="info">info</Badge>
                <Badge variant="destructive">destructive</Badge>
              </div>
            </Section>

            <Section
              id="overlays"
              title="Overlays"
              note="Modal #0D0D0D · border #333 · radius 12px. Tooltip #1C1C1C con borde. Dropdown y Sheet heredan del mismo token popover."
            >
              <div className="flex flex-wrap items-center gap-3">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Abrir modal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Superficie modal</DialogTitle>
                      <DialogDescription>
                        Header compacto, contenido y footer con acciones
                        alineadas. Entrada 200ms con fade + zoom 95→100%.
                      </DialogDescription>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      El overlay es rgba(0,0,0,0.5) — profundidad por contraste,
                      no por blur.
                    </p>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost" size="sm">
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button size="sm">Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Tooltip demo">
                        <Info className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>#1C1C1C · border #333 · 12px</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </Section>

            <Section id="data" title="Tabs y tabla" note="Tabs underline con indicador rojo; tabla técnica con header #0D0D0D y hover #111111.">
              <Tabs defaultValue="uno" className="max-w-xl">
                <TabsList>
                  <TabsTrigger value="uno">Vista</TabsTrigger>
                  <TabsTrigger value="dos">Datos</TabsTrigger>
                  <TabsTrigger value="tres">Historial</TabsTrigger>
                </TabsList>
                <TabsContent value="uno" className="pt-4 text-sm text-muted-foreground">
                  Contenido del tab activo: texto blanco, indicador #FF0033 bajo
                  el trigger, inactivo #777777.
                </TabsContent>
                <TabsContent value="dos" className="pt-4 text-sm text-muted-foreground">
                  Los tabs son Radix — navegación por flechas incluida.
                </TabsContent>
                <TabsContent value="tres" className="pt-4 text-sm text-muted-foreground">
                  Sin pills: solo texto + underline.
                </TabsContent>
              </Tabs>

              <div className="mt-6 max-w-xl overflow-hidden rounded-lg border border-(--gray-1c)">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recurso</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["Editorial 01", "RS-7F2A"],
                      ["Pack lunar", "RS-C1D4"],
                      ["Atlas lunar", "RS-09B2"],
                    ].map(([name, id]) => (
                      <TableRow key={id}>
                        <TableCell className="text-[13px]">{name}</TableCell>
                        <TableCell className="font-mono text-[12px] text-muted-foreground">
                          {id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">publicado</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Section>

            <Section
              id="blocks"
              title="Block registry"
              note={`Registro central de bloques de contenido (src/lib/block-registry.ts), espejado por los límites server-side de convex/blocks.ts: máx. ${BLOCK_LIMITS.maxBlocksPerResource} bloques por recurso · texto ${BLOCK_LIMITS.maxTextLength.toLocaleString("es")} car. · pie ${BLOCK_LIMITS.maxCaptionLength} car.`}
            >
              <div className="overflow-x-auto rounded-lg border border-(--gray-1c)">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bloque</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Requiere</TableHead>
                      <TableHead>Acepta</TableHead>
                      <TableHead>Límites</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {BLOCK_REGISTRY.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-[13px] font-medium">
                          {b.name}
                          <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                            {b.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="info">{b.category}</Badge>
                        </TableCell>
                        <TableCell className="text-[12px] text-muted-foreground">
                          {b.requires}
                        </TableCell>
                        <TableCell className="text-[12px] text-muted-foreground">
                          {b.accepts}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {Object.entries(b.limits)
                            .map(([k, v]) => `${k} ${v}`)
                            .join(" · ") || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Section>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mantenimiento</CardTitle>
                <CardDescription>
                  Esta página es la fuente visual de verdad: si cambias un token
                  o una primitiva, actualízala aquí en el mismo commit.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[13px] text-muted-foreground">
                Tokens en <code className="font-mono text-foreground">src/index.css</code>{" "}
                · primitivas en{" "}
                <code className="font-mono text-foreground">src/components/ui/*</code>{" "}
                · registro de bloques en{" "}
                <code className="font-mono text-foreground">src/lib/block-registry.ts</code>{" "}
                (test de consistencia contra{" "}
                <code className="font-mono text-foreground">convex/blocks.ts</code>).
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
