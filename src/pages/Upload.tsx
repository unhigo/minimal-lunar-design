import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "convex/react";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageEditor, { type EditedImage } from "@/components/ImageEditor";
import { CATEGORIES } from "@/lib/catalog";
import { uploadImage } from "@/lib/upload";

type Stage =
  | { kind: "idle" }
  | { kind: "editing"; file: File }
  | { kind: "ready"; edited: EditedImage; storageId: string; url: string };

export default function Upload() {
  const navigate = useNavigate();
  const createResource = useMutation(api.resources.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const attach = useMutation(api.files.attach);

  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [priceEuros, setPriceEuros] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setStage({ kind: "editing", file });
  };

  /** Store the edited image in Convex storage. */
  const persist = async (edited: EditedImage): Promise<string> => {
    const ext = edited.type === "image/png" ? "png" : "jpg";
    const file = new File([edited.blob], `recurso.${ext}`, {
      type: edited.type,
    });
    const uploaded = await uploadImage(generateUploadUrl, attach, file);
    return uploaded.storageId as unknown as string;
  };

  const handleEditorSave = async (result: EditedImage | null) => {
    if (!result) {
      setStage({ kind: "idle" });
      return;
    }
    setUploadBusy(true);
    setUploadError(null);
    try {
      const storageId = await persist(result);
      setStage({
        kind: "ready",
        edited: result,
        storageId,
        url: URL.createObjectURL(result.blob),
      });
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "No se pudo subir la imagen.",
      );
      setStage({ kind: "idle" });
    } finally {
      setUploadBusy(false);
    }
  };

  const clearImage = () => {
    if (stage.kind === "ready") URL.revokeObjectURL(stage.url);
    setStage({ kind: "idle" });
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
      await createResource({
        title: title.trim(),
        description: description.trim(),
        url: url.trim() || undefined,
        category,
        price: cents,
        ...(stage.kind === "ready"
          ? {
              fileStorageId: stage.storageId as never,
              coverStorageId: stage.storageId as never,
              fileMeta: {
                name: `${title.trim() || "recurso"}.${stage.edited.type === "image/png" ? "png" : "jpg"}`,
                type: stage.edited.type,
                size: stage.edited.blob.size,
                width: stage.edited.width,
                height: stage.edited.height,
              },
            }
          : {}),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </button>
          <Link
            to="/catalog"
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Catálogo
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Publicar
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">
          Comparte un recurso
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Sube una imagen (con editor integrado), añade un enlace externo o
          ambas. Puedes ofrecerlo gratis o ponerle un precio.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
          {/* Image picker / editor entry */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Imagen del recurso
            </label>
            {stage.kind === "ready" ? (
              <div className="flex items-start gap-4 rounded-sm border border-border/70 p-4">
                <img
                  src={stage.url}
                  alt="Previsualización"
                  className="h-24 w-24 rounded-sm border border-border/60 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {stage.edited.width} × {stage.edited.height} px ·{" "}
                    {stage.edited.type === "image/png" ? "PNG" : "JPEG"} ·{" "}
                    {(stage.edited.blob.size / 1024).toFixed(0)} KB
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-sm"
                      onClick={() =>
                        setStage({
                          kind: "editing",
                          file: new File(
                            [stage.edited.blob],
                            `recurso.${stage.edited.type === "image/png" ? "png" : "jpg"}`,
                            { type: stage.edited.type },
                          ),
                        })
                      }
                    >
                      <Pencil className="mr-1.5 size-3" /> Editar de nuevo
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-sm text-destructive hover:text-destructive"
                      onClick={clearImage}
                    >
                      <Trash2 className="mr-1.5 size-3" /> Quitar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-sm border border-dashed border-border/70 px-6 py-10 text-center transition-colors hover:border-foreground/40"
              >
                {uploadBusy ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : (
                  <ImagePlus className="size-5 text-muted-foreground" />
                )}
                <span className="text-[13px] text-muted-foreground">
                  {uploadBusy
                    ? "Subiendo…"
                    : "Selecciona una imagen (PNG, JPEG, WebP, GIF o SVG · máx. 8 MB)"}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Se abrirá el editor para recortar y ajustar
                </span>
              </button>
            )}
            {uploadError && (
              <p className="text-[12px] text-destructive">{uploadError}</p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={handlePick}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Título
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pack de mockups para iPad Pro"
              required
              minLength={3}
              maxLength={80}
              className="h-10 rounded-sm border-border bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Descripción
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qué incluye, para qué sirve, formato de los archivos…"
              required
              minLength={10}
              maxLength={600}
              className="min-h-24 rounded-sm border-border bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Enlace externo (opcional)
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              placeholder="https://…"
              className="h-10 rounded-sm border-border bg-transparent"
            />
            <p className="text-[12px] text-muted-foreground">
              Enlaza una página de descarga o material complementario. Los
              compradores verán este enlace tras adquirirlo.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:border-foreground/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Precio (€, 0 = gratis)
              </label>
              <Input
                value={priceEuros}
                onChange={(e) => setPriceEuros(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="h-10 rounded-sm border-border bg-transparent font-mono"
              />
            </div>
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="flex items-center justify-between border-t border-border/60 pt-6">
            <p className="text-[12px] text-muted-foreground">
              Se publicará inmediatamente en el catálogo.
            </p>
            <Button
              type="submit"
              disabled={busy || uploadBusy}
              className="h-10 rounded-sm px-6"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <UploadIcon className="mr-2 size-4" />
                  Publicar recurso
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      {stage.kind === "editing" && (
        <ImageEditor
          file={stage.file}
          onClose={() => setStage({ kind: "idle" })}
          onSave={(result) => void handleEditorSave(result)}
        />
      )}

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-3xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">

          </p>
        </div>
      </footer>
    </div>
  );
}
