import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowUpRight,
  Bookmark,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Palette,
  Pencil,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
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
import { Textarea } from "@/components/ui/textarea";
import ImageEditor, { type EditedImage } from "@/components/ImageEditor";
import { CATEGORIES, formatPrice, timeAgo } from "@/lib/catalog";
import { BRAND } from "@/lib/brand";
import { uploadImage } from "@/lib/upload";

const QUICK_ACTIONS = [
  {
    to: "/catalog",
    icon: Store,
    title: "Explorar catálogo",
    body: "Busca recursos de edición y diseño subidos por la comunidad.",
  },
  {
    to: "/upload",
    icon: Upload,
    title: "Subir un recurso",
    body: "Publica tus propias plantillas, fuentes, texturas y más.",
  },
  {
    to: "/studio",
    icon: Palette,
    title: "Abrir el estudio",
    body: "Compón tu calendario lunar y expórtalo listo para imprimir.",
  },
] as const;

function EditResourceDialog({
  resource,
  onClose,
}: {
  resource: {
    _id: string;
    title: string;
    description: string;
    url?: string | undefined;
    category: string;
    price: number;
    coverUrl: string | null;
    coverStorageId?: string;
  } | null;
  onClose: () => void;
}) {
  const updateResource = useMutation(api.resources.updateMine);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const attach = useMutation(api.files.attach);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(resource?.title ?? "");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [url, setUrl] = useState(resource?.url ?? "");
  const [category, setCategory] = useState(resource?.category ?? CATEGORIES[0]);
  const [priceEuros, setPriceEuros] = useState(
    ((resource?.price ?? 0) / 100).toString(),
  );
  const [cover, setCover] = useState<{
    storageId: string;
    previewUrl: string;
  } | null>(null);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!resource) return null;

  const displayCover = cover?.previewUrl ?? resource.coverUrl ?? null;

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setEditorFile(file);
  };

  const handleEditorSave = async (result: EditedImage | null) => {
    setEditorFile(null);
    if (!result) return;
    setCoverBusy(true);
    setError(null);
    try {
      const ext = result.type === "image/png" ? "png" : "jpg";
      const file = new File([result.blob], `portada.${ext}`, {
        type: result.type,
      });
      const uploaded = await uploadImage(generateUploadUrl, attach, file);
      setCover({
        storageId: uploaded.storageId as unknown as string,
        previewUrl: URL.createObjectURL(result.blob),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo subir la portada.",
      );
    } finally {
      setCoverBusy(false);
    }
  };

  const handleClearCover = () => {
    if (cover) URL.revokeObjectURL(cover.previewUrl);
    setCover(null);
    // Sending an empty string clears the cover server-side.
    void updateResource({
      id: resource._id as never,
      title: title.trim(),
      description: description.trim(),
      url: url.trim() || undefined,
      category,
      price: Math.round(parseFloat(priceEuros || "0") * 100),
      coverStorageId: "" as never,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const cents = Math.round(parseFloat(priceEuros || "0") * 100);
      if (Number.isNaN(cents) || cents < 0) {
        throw new Error("Introduce un precio válido.");
      }
      await updateResource({
        id: resource._id as never,
        title: title.trim(),
        description: description.trim(),
        url: url.trim() || undefined,
        category,
        price: cents,
        ...(cover ? { coverStorageId: cover.storageId as never } : {}),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-sm border-border/70 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-light tracking-tight">
            Editar recurso
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Los cambios se aplican en el catálogo al instante.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Cover */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Portada
            </label>
            {displayCover ? (
              <div className="flex items-center gap-3">
                <img
                  src={displayCover}
                  alt="Portada"
                  className="h-16 w-24 rounded-sm border border-border/60 object-cover"
                />
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-sm"
                    disabled={coverBusy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {coverBusy ? (
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                    ) : (
                      <Pencil className="mr-1.5 size-3" />
                    )}
                    Cambiar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-sm text-destructive hover:text-destructive"
                    disabled={coverBusy}
                    onClick={handleClearCover}
                  >
                    <Trash2 className="mr-1.5 size-3" /> Quitar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-sm border border-dashed border-border/70 px-4 py-6 text-[13px] text-muted-foreground transition-colors hover:border-foreground/40"
              >
                {coverBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                Añadir portada (se abrirá el editor)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={handlePick}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Título
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={80}
              className="h-9 rounded-sm border-border bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Descripción
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              maxLength={600}
              className="min-h-20 rounded-sm border-border bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Enlace externo (opcional)
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              placeholder="https://…"
              className="h-9 rounded-sm border-border bg-transparent"
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
                Precio (€, 0 = gratis)
              </label>
              <Input
                value={priceEuros}
                onChange={(e) => setPriceEuros(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="h-9 rounded-sm border-border bg-transparent font-mono"
              />
            </div>
          </div>
          {error && <p className="text-[12px] text-destructive">{error}</p>}
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
            <Button type="submit" disabled={busy || coverBusy} className="rounded-sm">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {editorFile && (
        <ImageEditor
          file={editorFile}
          onClose={() => setEditorFile(null)}
          onSave={(result) => void handleEditorSave(result)}
        />
      )}
    </Dialog>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const purchases = useQuery(api.resources.myPurchases);
  const myResources = useQuery(api.resources.listMine);
  const mySubmissions = useQuery(api.submissions.listMine);
  const myFavorites = useQuery(api.tools.myFavorites, {});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const removeResource = useMutation(api.resources.removeMine);
  const [editing, setEditing] = useState<
    | {
        _id: string;
        title: string;
        description: string;
        url?: string | undefined;
        category: string;
        price: number;
        coverUrl: string | null;
        coverStorageId?: string;
      }
    | null
  >(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await removeResource({ id: deleting as never });
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async (r: { _id: string }) => {
    const link = `${window.location.origin}/resource/${r._id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(r._id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Clipboard unavailable — silently ignore.
    }
  };

  const completed = (purchases ?? []).filter((p) => p.status === "completed");
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full border border-foreground/40">
              <span className="size-2 rounded-full bg-foreground/70" />
            </span>
            <span className="text-sm font-medium uppercase tracking-[0.22em]">
              {BRAND.name}
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/catalog"
              className="hidden px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Catálogo
            </Link>
            <Link
              to="/upload"
              className="hidden px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Subir
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ShieldCheck className="size-3.5" />
                Admin
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => void handleSignOut()}
            >
              Salir
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Tu espacio
        </p>
        <h1 className="mt-3 h1-editorial tracking-tight">
          Hola{user?.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
          Todo lo que has comprado y publicado, en un solo sitio.
        </p>

        {/* Quick actions */}
        <div className="mt-10 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group bg-background p-6 transition-colors hover:bg-muted/40"
            >
              <a.icon className="size-4 text-muted-foreground" />
              <h2 className="mt-4 flex items-center gap-1.5 text-[15px] font-medium">
                {a.title}
                <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {a.body}
              </p>
            </Link>
          ))}
        </div>

        {/* My resources */}
        <section className="mt-14">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-light tracking-tight">
                Mis recursos
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {myResources === undefined
                  ? "Cargando…"
                  : myResources.length === 0
                    ? "Todavía no has publicado nada."
                    : `${myResources.length} ${myResources.length === 1 ? "recurso publicado" : "recursos publicados"}.`}
              </p>
            </div>
            <Link
              to="/upload"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Subir otro
            </Link>
          </div>

          {myResources === undefined ? (
            <div className="mt-6 h-20 animate-pulse rounded-sm border border-border/60" />
          ) : myResources.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
              <Upload className="size-5 text-muted-foreground" />
              <p className="max-w-sm text-[13px] text-muted-foreground">
                Comparte plantillas, fuentes o texturas con la comunidad: sube
                tu primer recurso.
              </p>
              <Link
                to="/upload"
                className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Publicar algo
              </Link>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-border/60 border-y border-border/60">
              {myResources.map((r) => (
                <li
                  key={r._id}
                  className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {r.coverUrl ? (
                      <img
                        src={r.coverUrl}
                        alt=""
                        className="h-10 w-14 shrink-0 rounded-sm border border-border/60 object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.title}{" "}
                        {r.status === "hidden" && (
                          <span className="ml-1 font-mono text-[10px] uppercase text-muted-foreground">
                            · oculto
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {r.category} · {formatPrice(r.price)} ·{" "}
                        {r.sales === 1
                          ? "1 venta"
                          : `${r.sales} ventas`} · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Copiar enlace público"
                      onClick={() => void handleCopy(r)}
                    >
                      {copiedId === r._id ? (
                        <Copy className="size-3.5 text-foreground" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                    {(r.fileUrl || r.url) && (
                      <a
                        href={r.fileUrl ?? r.url ?? "#"}
                        download={
                          r.fileUrl
                            ? r.fileMeta?.name ?? "recurso"
                            : undefined
                        }
                        target={r.fileUrl ? undefined : "_blank"}
                        rel={r.fileUrl ? undefined : "noopener noreferrer"}
                        title="Descargar"
                        className="inline-flex h-8 items-center rounded-sm px-2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Download className="size-3.5" />
                      </a>
                    )}
                    <Link
                      to={`/resource/${r._id}`}
                      className="inline-flex h-8 items-center rounded-sm border border-border px-3 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Ver
                    </Link>
                    <Link
                      to={`/resource/${r._id}/edit`}
                      className="inline-flex h-8 items-center rounded-sm border border-border px-3 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Bloques
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(r)}
                    >
                      <Pencil className="mr-1.5 size-3.5" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(r._id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* My submissions (directory proposals) */}
        {mySubmissions !== undefined && mySubmissions.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-light tracking-tight">Mis envíos</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {mySubmissions.length === 1
                    ? "1 propuesta en el directorio."
                    : `${mySubmissions.length} propuestas en el directorio.`}
                </p>
              </div>
              <Link
                to="/submit"
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Enviar otra
              </Link>
            </div>
            <ul className="mt-6 divide-y divide-border/60 border-y border-border/60">
              {mySubmissions.map((s) => (
                <li key={s._id} className="flex items-center gap-4 py-3.5">
                  <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px]">{s.title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {s.category} · {timeAgo(s.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                    {s.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Directory favorites */}
        <section className="mt-14">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-light tracking-tight">
                Herramientas guardadas
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {myFavorites === undefined
                  ? "Cargando…"
                  : myFavorites.length === 0
                    ? "Guarda herramientas del directorio para tenerlas aquí."
                    : `${myFavorites.length} ${myFavorites.length === 1 ? "favorito" : "favoritos"} del directorio.`}
              </p>
            </div>
            <Link
              to="/tools"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Explorar directorio
            </Link>
          </div>

          {myFavorites === undefined ? (
            <div className="mt-6 h-16 animate-pulse rounded-sm border border-border/60" />
          ) : myFavorites.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-sm border border-dashed border-border/70 px-6 py-10 text-center">
              <Bookmark className="size-5 text-muted-foreground" />
              <p className="max-w-sm text-[13px] text-muted-foreground">
                Marca herramientas con el icono de guardado en /tools y
                aparecerán aquí.
              </p>
              <Link
                to="/tools"
                className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Ir al directorio
              </Link>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-border/60 border-y border-border/60">
              {myFavorites.map((f) => (
                <li key={f._id} className="flex items-center gap-4 py-3.5">
                  <Bookmark className="size-3.5 shrink-0 fill-current text-foreground" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/tools/${f.slug}`}
                      className="truncate text-[14px] transition-colors hover:text-muted-foreground"
                    >
                      {f.name}
                    </Link>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      {f.category} · {f.shortDescription}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {timeAgo(f.favoritedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Purchases */}
        <section className="mt-14">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-light tracking-tight">
                Tus descargas
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {completed.length === 0
                  ? "Aún no has adquirido ningún recurso."
                  : `${completed.length} ${completed.length === 1 ? "recurso" : "recursos"} disponibles.`}
              </p>
            </div>
            <Link
              to="/catalog"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver catálogo
            </Link>
          </div>

          {purchases === undefined ? (
            <div className="mt-6 h-20 animate-pulse rounded-sm border border-border/60" />
          ) : completed.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-sm border border-dashed border-border/70 px-6 py-12 text-center">
              <Download className="size-5 text-muted-foreground" />
              <p className="max-w-sm text-[13px] text-muted-foreground">
                Cuando adquieras un recurso aparecerá aquí, listo para
                descargar.
              </p>
              <Link
                to="/catalog"
                className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Explorar recursos
              </Link>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-border/60 border-y border-border/60">
              {completed.map((p) => (
                <li
                  key={p._id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.resourceTitle}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {formatPrice(p.amount)} · {timeAgo(p.createdAt)}
                    </p>
                  </div>
                  {p.fileUrl || p.resourceUrl ? (
                    <a
                      href={p.fileUrl ?? p.resourceUrl ?? "#"}
                      download={
                        p.fileUrl ? undefined : undefined
                      }
                      target={p.fileUrl ? undefined : "_blank"}
                      rel={p.fileUrl ? undefined : "noopener noreferrer"}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 self-start rounded-sm border border-border px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
                    >
                      <Download className="size-3" />
                      Descargar
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Delete confirmation */}
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent className="rounded-sm border-border/70 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-light tracking-tight">
              Eliminar recurso
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              Se borrará junto con sus comentarios y compras. Esta acción no se
              puede deshacer.
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
              onClick={() => void handleDelete()}
              disabled={busy}
              className="rounded-sm"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">
            {BRAND.footerLine}
          </p>
        </div>
      </footer>

      {editing && (
        <EditResourceDialog
          resource={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
