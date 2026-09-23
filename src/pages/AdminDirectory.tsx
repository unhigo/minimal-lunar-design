import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Plus, Star, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Doc } from "@/convex/_generated/dataModel";

type ToolDoc = Doc<"tools">;

const STATUSES: ToolDoc["status"][] = ["published", "pending", "rejected"];

const STATUS_LABEL: Record<ToolDoc["status"], string> = {
  published: "publicada",
  pending: "pendiente",
  rejected: "rechazada",
};

const CATEGORIES = [
  "astronomía",
  "cartografía",
  "geoespacial",
  "ciencia",
  "diseño",
  "imagen",
  "color",
  "tipografía",
  "3d",
  "código",
  "no-code",
  "productividad",
  "ia",
  "fotografía",
] as const;

/** Create dialog for a new directory tool. */
function CreateToolDialog({ onClose }: { onClose: () => void }) {
  const create = useMutation(api.tools.create);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [pricing, setPricing] = useState<ToolDoc["pricing"]>("free");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await create({
        name: name.trim(),
        slug: "",
        shortDescription: shortDescription.trim(),
        description: shortDescription.trim(),
        website: website.trim(),
        category,
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 6),
        pricing,
        pricingDetails: "",
        platforms: ["web"],
        features: [],
        featured: false,
        trending: false,
        verified: false,
        status: "published",
      });
      toast("Herramienta creada");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-sm border-border/70 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-light tracking-tight">
            Nueva herramienta
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            El slug se genera automáticamente desde el nombre.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Nombre
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={60}
              className="h-9 rounded-sm border-border bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              URL oficial
            </label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              type="url"
              required
              placeholder="https://…"
              className="h-9 rounded-sm border-border bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Descripción corta
            </label>
            <Textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              required
              minLength={10}
              maxLength={200}
              className="min-h-16 rounded-sm border-border bg-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 rounded-sm border border-border bg-background px-2 text-sm outline-none focus:border-foreground/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Precio
              </label>
              <select
                value={pricing}
                onChange={(e) => setPricing(e.target.value as ToolDoc["pricing"])}
                className="h-9 rounded-sm border border-border bg-background px-2 text-sm outline-none focus:border-foreground/50"
              >
                <option value="free">gratis</option>
                <option value="freemium">freemium</option>
                <option value="open-source">open source</option>
                <option value="paid">de pago</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Tags (separados por coma, máx. 6)
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="luna, mapas, open source"
              className="h-9 rounded-sm border-border bg-transparent font-mono"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={busy}
              className="rounded-sm text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="rounded-sm">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Admin section: directory tools management. */
export function AdminDirectorySection() {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const update = useMutation(api.tools.update);
  const remove = useMutation(api.tools.remove);

  const wrap = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-light tracking-tight">Directorio</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            CRUD completo: estado, destacadas, tendencia y borrado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar…"
            className="h-8 w-32 rounded-sm border-border bg-transparent font-mono text-[12px]"
          />
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm"
            onClick={() => setCreating(true)}
          >
            <Plus className="mr-1.5 size-3.5" /> Nueva
          </Button>
        </div>
      </div>

      <AdminDirectoryList
        filter={filter}
        busy={busy}
        wrap={wrap}
        update={update}
        remove={remove}
        deleting={deleting}
        setDeleting={setDeleting}
      />

      {creating && <CreateToolDialog onClose={() => setCreating(false)} />}
      {deleting !== null && (
        <Dialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
        >
          <DialogContent className="rounded-sm border-border/70 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-light tracking-tight">
                Eliminar herramienta
              </DialogTitle>
              <DialogDescription className="text-[13px]">
                Se borrarán también sus votos y favoritos. No se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setDeleting(null)}
                disabled={busy}
                className="rounded-sm text-muted-foreground"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  const id = deleting;
                  setDeleting(null);
                  if (id) void wrap(() => remove({ id: id as never }));
                }}
                className="rounded-sm"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

function AdminDirectoryList({
  filter,
  busy,
  wrap,
  update,
  remove,
  deleting,
  setDeleting,
}: {
  filter: string;
  busy: boolean;
  wrap: (fn: () => Promise<unknown>) => Promise<void>;
  update: ReturnType<typeof useMutation<typeof api.tools.update>>;
  remove: ReturnType<typeof useMutation<typeof api.tools.remove>>;
  deleting: string | null;
  setDeleting: (id: string | null) => void;
}) {
  const tools = useQuery(api.tools.listAllForAdmin, {}) ?? [];
  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(needle) ||
          t.category.toLowerCase().includes(needle),
      )
    : tools;

  if (tools.length === 0) {
    return (
      <p className="mt-4 text-[13px] text-muted-foreground">
        El directorio está vacío. Ejecuta el seed o crea la primera herramienta.
      </p>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
      {visible.map((t) => (
        <li
          key={t._id}
          className="flex flex-col gap-3 py-3.5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {t.name}{" "}
              <span className="ml-1 font-mono text-[10px] uppercase text-muted-foreground">
                · {t.category} · ▲ {t.votes} · {STATUS_LABEL[t.status]}
              </span>
            </p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
              /tools/{t.slug}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {/* Status */}
            <select
              value={t.status}
              disabled={busy}
              onChange={(e) =>
                void wrap(() =>
                  update({
                    id: t._id,
                    status: e.target.value as ToolDoc["status"],
                  }),
                )
              }
              aria-label={`Estado de ${t.name}`}
              className="h-8 rounded-sm border border-border bg-background px-2 font-mono text-[11px] outline-none focus:border-foreground/50"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            {/* Featured */}
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              title={t.featured ? "Quitar destacada" : "Marcar destacada"}
              onClick={() =>
                void wrap(() => update({ id: t._id, featured: !t.featured }))
              }
            >
              <Star
                className={t.featured ? "size-3.5 fill-current" : "size-3.5"}
              />
            </Button>
            {/* Trending */}
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              title={t.trending ? "Quitar tendencia" : "Marcar tendencia"}
              onClick={() =>
                void wrap(() => update({ id: t._id, trending: !t.trending }))
              }
            >
              <span className="font-mono text-[12px]">↑</span>
            </Button>
            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(t._id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
