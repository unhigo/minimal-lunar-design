import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
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
import { toast } from "sonner";
import type { Doc } from "@/convex/_generated/dataModel";
import { CATEGORY_ORDER, FOOTER_ICON_KEYS } from "@/data/footer-links";

type LinkDoc = Doc<"footerLinks">;

type FormState = {
  category: string;
  name: string;
  url: string;
  handle: string;
  description: string;
  icon: string;
  sortOrder: number;
  visible: boolean;
};

const EMPTY_FORM: FormState = {
  category: CATEGORY_ORDER[0],
  name: "",
  url: "",
  handle: "",
  description: "",
  icon: FOOTER_ICON_KEYS[0],
  sortOrder: 0,
  visible: true,
};

/** Diálogo crear/editar de un enlace del pie de página. */
function LinkFormDialog({
  initial,
  knownCategories,
  onClose,
}: {
  initial?: LinkDoc;
  knownCategories: string[];
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const create = useMutation(api.footer_links.create);
  const update = useMutation(api.footer_links.update);
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const base = {
        category: form.category.trim(),
        name: form.name.trim(),
        url: form.url.trim(),
        handle: form.handle.trim(),
        description: form.description.trim(),
        icon: form.icon,
        visible: form.visible,
      };
      if (isEdit) {
        await update({ id: initial._id, ...base, sortOrder: form.sortOrder });
        toast("Enlace actualizado");
      } else {
        await create(base);
        toast("Enlace creado");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-sm border-border/70 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-light tracking-tight">
            {isEdit ? "Editar enlace" : "Nuevo enlace del pie"}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Se muestra en la sección “Base de datos de enlaces” del footer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Categoría
            </label>
            <Input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              list="footer-link-categories"
              required
              maxLength={40}
              className="h-9 rounded-sm border-border bg-transparent"
            />
            <datalist id="footer-link-categories">
              {knownCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Nombre
              </label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                maxLength={60}
                className="h-9 rounded-sm border-border bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Handle
              </label>
              <Input
                value={form.handle}
                onChange={(e) => set("handle", e.target.value)}
                maxLength={60}
                className="h-9 rounded-sm border-border bg-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              URL
            </label>
            <Input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              type="url"
              required
              placeholder="https://…"
              className="h-9 rounded-sm border-border bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Descripción
            </label>
            <Input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={160}
              className="h-9 rounded-sm border-border bg-transparent"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Icono
              </label>
              <select
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                className="h-9 w-full rounded-sm border border-border bg-background px-2 font-mono text-[12px] outline-none focus:border-foreground/50"
              >
                {FOOTER_ICON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
            {isEdit && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Orden
                </label>
                <Input
                  value={String(form.sortOrder)}
                  onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
                  type="number"
                  className="h-9 rounded-sm border-border bg-transparent"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Visibilidad
            </label>
            <select
              value={form.visible ? "yes" : "no"}
              onChange={(e) => set("visible", e.target.value === "yes")}
              className="h-9 w-full rounded-sm border border-border bg-background px-2 font-mono text-[12px] outline-none focus:border-foreground/50"
            >
              <option value="yes">Visible en el footer</option>
              <option value="no">Oculto</option>
            </select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isEdit ? (
                "Guardar cambios"
              ) : (
                "Crear enlace"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** CRUD de la base de datos de enlaces del footer (solo administradores). */
export function AdminFooterLinksSection() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const links = useQuery(api.footer_links.listAll, isAdmin ? {} : "skip");
  const removeLink = useMutation(api.footer_links.remove);
  const setVisible = useMutation(api.footer_links.setVisible);
  const seedDefaults = useMutation(api.footer_links.seedDefaults);

  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; link: LinkDoc } | null
  >(null);
  const [busy, setBusy] = useState(false);

  const wrap = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo completar.");
    } finally {
      setBusy(false);
    }
  };

  const knownCategories = Array.from(
    new Set([...CATEGORY_ORDER, ...(links ?? []).map((l) => l.category)]),
  );

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-light tracking-tight">
          Enlaces del pie ({links?.length ?? 0})
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              void wrap(async () => {
                const r = await seedDefaults({});
                toast(
                  r.skipped
                    ? "Ya hay enlaces guardados"
                    : `Restaurados ${r.inserted} enlaces por defecto`,
                );
              })
            }
          >
            <RotateCcw className="mr-1.5 size-3.5" /> Restaurar por defecto
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setDialog({ mode: "create" })}
          >
            <Plus className="mr-1.5 size-3.5" /> Nuevo enlace
          </Button>
        </div>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Base de datos de enlaces que se renderiza en el footer público. Los
        enlaces ocultos no se muestran.
      </p>
      {links === undefined ? (
        <div className="mt-4 h-24 animate-pulse rounded-sm border border-border/60" />
      ) : links.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted-foreground">
          No hay enlaces guardados. Restaura los por defecto o crea uno nuevo.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
          {links.map((l) => (
            <li
              key={l._id}
              className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {l.name}{" "}
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    · {l.category} · icono: {l.icon} · orden {l.sortOrder}
                  </span>
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                  {l.handle} · {l.url}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {l.description}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    void wrap(() =>
                      setVisible({ id: l._id, visible: !l.visible }),
                    )
                  }
                >
                  {l.visible ? (
                    <>
                      <EyeOff className="mr-1.5 size-3.5" /> Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1.5 size-3.5" /> Mostrar
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => setDialog({ mode: "edit", link: l })}
                >
                  <Pencil className="mr-1.5 size-3.5" /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  className="text-destructive hover:text-destructive"
                  onClick={() => void wrap(() => removeLink({ id: l._id }))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {dialog && (
        <LinkFormDialog
          initial={dialog.mode === "edit" ? dialog.link : undefined}
          knownCategories={knownCategories}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  );
}
