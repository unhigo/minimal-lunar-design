import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Image as ImageIcon,
  ImagePlus,
  Images,
  Link2,
  Loader2,
  Maximize2,
  FileText,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  Video,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageEditor, { type EditedImage } from "@/components/ImageEditor";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES as _CATEGORIES } from "@/lib/catalog";
import {
  ASPECT_RATIOS,
} from "@/lib/blocks";
import type { ResourceBlock } from "@/lib/blocks";
import { BlockMetaLine } from "@/components/ResourceBlocks";
import {
  IMAGE_ACCEPT,
  MAX_CAPTION_LENGTH,
  MAX_TEXT_LENGTH,
  VIDEO_ACCEPT,
} from "@/lib/blocks";
import { uploadImage } from "@/lib/upload";

/**
 * Open-lab block editor.
 *
 * Composition section: any signed-in user can add blocks (image, video,
 * text, gallery, slider), reorder them, caption them and delete them.
 * Ownership section: only the resource author can edit the resource meta
 * (title, description, external URL, category, price, cover image).
 */

type Busy =
  | { kind: "none" }
  | { kind: "upload" }
  | { kind: "block"; id: string }
  | { kind: "meta" };

const TEXT_SUGGESTIONS = [
  "Qué incluye este recurso y cómo usarlo",
  "Notas de versión y cambios",
  "Instrucciones de montaje o instalación",
];

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-light tracking-tight">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </h2>
  );
}

export function BlockEditor({ resourceId }: { resourceId: Id<"resources"> }) {
  const { user } = useAuth();
  const resource = useQuery(api.resources.getMineForEdit, { id: resourceId });
  const blocks = useQuery(api.blocks.list, { resourceId }) ?? [];

  const addBlock = useMutation(api.blocks.add);
  const updateBlock = useMutation(api.blocks.update);
  const moveBlock = useMutation(api.blocks.move);
  const removeBlock = useMutation(api.blocks.remove);
  const updateMine = useMutation(api.resources.updateMine);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const attach = useMutation(api.files.attach);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const sliderInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState<Busy>({ kind: "none" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<{ file: File; target: "image" | "cover" } | null>(null);

  // Text block composer
  const [textDraft, setTextDraft] = useState("");
  // Link composer (video embed or gallery cover link)
  const [linkDraft, setLinkDraft] = useState("");
  const [linkType, setLinkType] = useState<"video" | "gallery">("video");
  // Per-block editing state
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [textEditDraft, setTextEditDraft] = useState("");

  const isAuthor = resource !== null && resource !== undefined && user !== null && user !== undefined && resource.authorId === user._id;

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of blocks) counts[b.type] = (counts[b.type] ?? 0) + 1;
    return counts;
  }, [blocks]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  };

  const guard = (err: unknown) => {
    setError(err instanceof Error ? err.message : "Algo salió mal.");
    window.setTimeout(() => setError(null), 4000);
  };

  /** Upload a File through Convex storage and return its storage id. */
  const persistFile = async (file: File): Promise<Id<"_storage">> => {
    const uploaded = await uploadImage(generateUploadUrl, attach, file);
    return uploaded.storageId;
  };

  const run = async (fn: () => Promise<void>, busyState: Busy) => {
    setBusy(busyState);
    setError(null);
    try {
      await fn();
    } catch (err) {
      guard(err);
    } finally {
      setBusy({ kind: "none" });
    }
  };

  const handlePick = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "image" | "video" | "gallery" | "slider" | "cover",
  ) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    if (target === "video") {
      const file = files[0]!;
      const okType = file.type === "video/mp4" || file.type === "video/webm";
      if (!okType || file.size > 8 * 1024 * 1024) {
        guard(new Error("Video no válido. Usa MP4 o WebM de hasta 8 MB."));
        return;
      }
      void run(async () => {
        const storageId = await persistFile(file);
        await addBlock({
          resourceId,
          type: "video",
          storageId,
          meta: {
            name: file.name,
            type: file.type,
            size: file.size,
            muted: true,
            autoplay: false,
            loop: false,
          },
        });
        flash("Video añadido.");
      }, { kind: "upload" });
      return;
    }

    if (target === "gallery" || target === "slider") {
      void run(async () => {
        for (const file of files.slice(0, 8)) {
          if (file.size > 8 * 1024 * 1024) {
            throw new Error(`${file.name} supera el límite de 8 MB.`);
          }
          const storageId = await persistFile(file);
          await addBlock({
            resourceId,
            type: target,
            storageId,
            meta: { name: file.name, type: file.type, size: file.size },
          });
        }
        flash(files.length > 1 ? `${files.length} imágenes añadidas.` : "Imagen añadida.");
      }, { kind: "upload" });
      return;
    }

    // Single image (standalone block) or resource cover — both go through the editor.
    const file = files[0]!;
    if (target === "cover") {
      setEditingFile({ file, target: "cover" });
    } else {
      setEditingFile({ file, target: "image" });
    }
  };

  const handleEditorSave = (result: EditedImage | null) => {
    const target = editingFile?.target;
    setEditingFile(null);
    if (!result || !target) return;
    const ext = result.type === "image/png" ? "png" : "jpg";
    const fileName = `bloque.${ext}`;
    void run(async () => {
      const file = new File([result.blob], fileName, { type: result.type });
      if (target === "cover") {
        if (!resource) return;
        await updateMine({
          id: resourceId,
          title: resource!.title,
          description: resource!.description,
          url: resource!.url ?? undefined,
          category: resource!.category,
          price: resource!.price,
          coverStorageId: (await persistFile(file)) as never,
        });
        flash("Portada actualizada.");
        return;
      }
      const storageId = await persistFile(file);
      await addBlock({
        resourceId,
        type: "image",
        storageId,
        meta: {
          name: fileName,
          type: result.type,
          size: result.blob.size,
          width: result.width,
          height: result.height,
        },
      });
      flash("Imagen añadida.");
    }, { kind: "upload" });
  };

  // ------------------------------------------------------------------ blocks

  const handleAddText = () =>
    void run(async () => {
      await addBlock({ resourceId, type: "text", text: textDraft.trim() });
      setTextDraft("");
      flash("Nota añadida.");
    }, { kind: "upload" });

  const handleAddLink = () =>
    void run(async () => {
      const url = linkDraft.trim();
      if (!/^https?:\/\//i.test(url)) {
        throw new Error("Introduce un enlace http(s) válido.");
      }
      if (linkType === "video") {
        await addBlock({ resourceId, type: "video", url });
      } else {
        await addBlock({
          resourceId,
          type: "gallery",
          url,
          meta: { caption: "Enlace" },
        });
      }
      setLinkDraft("");
      flash("Bloque por enlace añadido.");
    }, { kind: "upload" });

  const openEdit = (block: ResourceBlock) => {
    setOpenPanel(openPanel === block._id ? null : block._id);
    setCaptionDraft(block.meta?.caption ?? "");
    setTextEditDraft(block.text ?? "");
  };

  return (
    <div className="flex flex-col gap-12">
      {/* ------------------------------------------------------------ preview */}
      <section>
        <SectionTitle icon={<ImageIcon className="size-4" />}>
          Composición{" "}
          <span className="font-mono text-[11px] font-normal text-muted-foreground">
            ({blocks.length})
          </span>
        </SectionTitle>
        {blocks.length === 0 ? (
          <p className="mt-4 border border-dashed border-border/70 p-6 text-[13px] text-muted-foreground">
            Todavía no hay bloques. Añade imágenes, video, notas, galerías o
            sliders con los controles de abajo.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col divide-y divide-border/60 border border-border/60">
            {blocks.map((b, i) => (
              <li key={b._id} className="flex items-start gap-4 p-4">
                {/* thumbnail */}
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border/60 bg-muted/20">
                  {b.url && (b.type === "image" || b.type === "gallery" || b.type === "slider") ? (
                    <img src={b.url} alt="" className="h-full w-full object-cover" />
                  ) : b.type === "video" ? (
                    <Video className="size-5 text-muted-foreground" />
                  ) : (
                    <FileText className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")} ·{" "}
                      {b.type === "text" ? "Nota" : b.type === "image" ? "Imagen" : b.type === "video" ? "Video" : b.type === "gallery" ? "Galería" : "Slider"}
                    </span>
                    {b.meta?.caption && (
                      <span className="truncate text-[12px] text-muted-foreground">
                        “{b.meta.caption}”
                      </span>
                    )}
                  </div>
                  {b.type === "text" ? (
                    <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
                      {b.text}
                    </p>
                  ) : (
                    <BlockMetaLine block={b} />
                  )}

                  {/* per-block panel */}
                  {openPanel === b._id && (
                    <div className="mt-3 flex flex-col gap-3 rounded-sm border border-border/60 bg-muted/10 p-3">
                      {(b.type === "image" || b.type === "video" || b.type === "gallery" || b.type === "slider") && (
                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Pie de foto / título
                          </label>
                          <Input
                            value={captionDraft}
                            onChange={(e) => setCaptionDraft(e.target.value)}
                            maxLength={MAX_CAPTION_LENGTH}
                            placeholder="Describe la pieza (opcional)"
                            className="h-8 rounded-sm border-border bg-transparent text-[13px]"
                          />
                        </div>
                      )}
                      {b.type === "text" && (
                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Contenido de la nota
                          </label>
                          <Textarea
                            value={textEditDraft}
                            onChange={(e) => setTextEditDraft(e.target.value)}
                            maxLength={MAX_TEXT_LENGTH}
                            className="min-h-20 rounded-sm border-border bg-transparent text-[13px]"
                          />
                        </div>
                      )}
                      {(b.type === "video") && (
                        <div className="grid grid-cols-3 gap-3">
                            {(
                            [
                              ["autoplay", "Auto"],
                              ["loop", "Bucle"],
                              ["muted", "Silencio"],
                            ] as const
                          ).map(([key, label]) => (
                            <label key={key} className="flex items-center justify-between gap-2 rounded-sm border border-border/60 px-2.5 py-1.5">
                              <span className="text-[12px] text-muted-foreground">{label}</span>
                              <Switch
                                checked={b.meta?.[key] ?? false}
                                onCheckedChange={(v) =>
                                  void run(async () => {
                                    if (key === "autoplay") {
                                      await updateBlock({ id: b._id, autoplay: v });
                                    } else if (key === "loop") {
                                      await updateBlock({ id: b._id, loop: v });
                                    } else {
                                      await updateBlock({ id: b._id, muted: v });
                                    }
                                  }, { kind: "block", id: b._id })
                                }
                                aria-label={label}
                              />
                            </label>
                          ))}
                        </div>
                      )}
                      {(b.type === "video" || b.type === "gallery" || b.type === "slider") && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Proporción
                          </span>
                          {ASPECT_RATIOS.map((r) => (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() =>
                                void run(async () => {
                                  await updateBlock({ id: b._id, ratio: r.value });
                                }, { kind: "block", id: b._id })
                              }
                              className={`rounded-sm border px-2 py-1 font-mono text-[10px] transition-colors ${
                                (b.meta?.ratio ?? "16/9") === r.value
                                  ? "border-foreground/60 text-foreground"
                                  : "border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 rounded-sm"
                          onClick={() =>
                            void run(async () => {
                              if (b.type === "text") {
                                await updateBlock({ id: b._id, text: textEditDraft });
                              } else {
                                await updateBlock({ id: b._id, caption: captionDraft });
                              }
                              setOpenPanel(null);
                              flash("Bloque actualizado.");
                            }, { kind: "block", id: b._id })
                          }
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* actions */}
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    aria-label="Subir bloque"
                    disabled={i === 0 || busy.kind !== "none"}
                    onClick={() =>
                      void run(async () => {
                        await moveBlock({ id: b._id, to: i - 1 });
                      }, { kind: "block", id: b._id })
                    }
                    className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Bajar bloque"
                    disabled={i === blocks.length - 1 || busy.kind !== "none"}
                    onClick={() =>
                      void run(async () => {
                        await moveBlock({ id: b._id, to: i + 1 });
                      }, { kind: "block", id: b._id })
                    }
                    className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Editar bloque"
                    onClick={() => openEdit(b)}
                    className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar bloque"
                    disabled={busy.kind !== "none"}
                    onClick={() => {
                      if (!window.confirm("¿Eliminar este bloque?")) return;
                      void run(async () => {
                        await removeBlock({ id: b._id });
                        flash("Bloque eliminado.");
                      }, { kind: "block", id: b._id });
                    }}
                    className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------- adders */}
      <section>
        <SectionTitle icon={<Plus className="size-4" />}>Añadir bloques</SectionTitle>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* image */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={busy.kind === "upload"}
            className="flex flex-col items-start gap-2 rounded-sm border border-border/60 p-4 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
          >
            <ImageIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Imagen</span>
            <span className="text-[12px] leading-relaxed text-muted-foreground">
              Sube una imagen y recórtala en el editor integrado.
            </span>
          </button>
          {/* video file */}
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={busy.kind === "upload"}
            className="flex flex-col items-start gap-2 rounded-sm border border-border/60 p-4 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
          >
            <Video className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Video (archivo)</span>
            <span className="text-[12px] leading-relaxed text-muted-foreground">
              MP4 o WebM hasta 8 MB, con auto, bucle y silencio.
            </span>
          </button>
          {/* text */}
          <div className="flex flex-col items-start gap-2 rounded-sm border border-border/60 p-4">
            <FileText className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Nota</span>
            <Textarea
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              maxLength={MAX_TEXT_LENGTH}
              placeholder={TEXT_SUGGESTIONS[0]}
              className="min-h-16 rounded-sm border-border bg-transparent text-[13px]"
            />
            <div className="flex flex-wrap gap-1">
              {TEXT_SUGGESTIONS.slice(1).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTextDraft(s)}
                  className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              className="mt-auto h-8 self-end rounded-sm"
              disabled={!textDraft.trim() || busy.kind !== "none"}
              onClick={handleAddText}
            >
              Añadir nota
            </Button>
          </div>
          {/* gallery */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={busy.kind === "upload"}
            className="flex flex-col items-start gap-2 rounded-sm border border-border/60 p-4 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
          >
            <Images className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Galería</span>
            <span className="text-[12px] leading-relaxed text-muted-foreground">
              Sube varias imágenes (hasta 8) como una cuadrícula con lightbox.
            </span>
          </button>
          {/* slider */}
          <button
            type="button"
            onClick={() => sliderInputRef.current?.click()}
            disabled={busy.kind === "upload"}
            className="flex flex-col items-start gap-2 rounded-sm border border-border/60 p-4 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
          >
            <Maximize2 className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Slider</span>
            <span className="text-[12px] leading-relaxed text-muted-foreground">
              Varias imágenes como carrusel con controles y puntos.
            </span>
          </button>
          {/* link */}
          <div className="flex flex-col items-start gap-2 rounded-sm border border-border/60 p-4">
            <Link2 className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Por enlace</span>
            <div className="flex w-full gap-1.5">
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as "video" | "gallery")}
                className="h-8 rounded-sm border border-border bg-background px-2 text-[12px] outline-none"
                aria-label="Tipo de bloque por enlace"
              >
                <option value="video">Video</option>
                <option value="gallery">Imagen</option>
              </select>
              <Input
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                placeholder="https://… / YouTube"
                className="h-8 flex-1 rounded-sm border-border bg-transparent text-[12px]"
              />
            </div>
            <span className="text-[11px] leading-relaxed text-muted-foreground">
              YouTube se convierte en reproductor; MP4/WebM directo; enlaces de
              imagen entran en galería.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-auto h-8 self-end rounded-sm"
              disabled={!linkDraft.trim() || busy.kind !== "none"}
              onClick={handleAddLink}
            >
              <ExternalLink className="mr-1.5 size-3" />
              Añadir enlace
            </Button>
          </div>
        </div>

        {busy.kind === "upload" && (
          <p className="mt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Subiendo archivo…
          </p>
        )}
        {error && <p className="mt-4 text-[12px] text-destructive">{error}</p>}
        {notice && (
          <p className="mt-4 font-mono text-[11px] text-muted-foreground">{notice}</p>
        )}
      </section>

      {/* ---------------------------------------------------------- ownership */}
      {isAuthor && resource && (
        <MetaEditor
          resource={resource}
          busy={busy.kind === "meta"}
          onBusy={() => setBusy({ kind: "meta" })}
          onDone={() => setBusy({ kind: "none" })}
          onError={guard}
          onFlash={flash}
          coverInputRef={coverInputRef}
          onCoverPick={(file) => setEditingFile({ file, target: "cover" })}
          updateMine={async (args) => {
            await updateMine(args);
          }}
        />
      )}

      {/* hidden inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => handlePick(e, "image")}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept={VIDEO_ACCEPT}
        className="hidden"
        onChange={(e) => handlePick(e, "video")}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handlePick(e, "gallery")}
      />
      <input
        ref={sliderInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handlePick(e, "slider")}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => handlePick(e, "cover")}
      />

      {editingFile && (
        <ImageEditor
          file={editingFile.file}
          onClose={() => setEditingFile(null)}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta editor (author-only section)
// ---------------------------------------------------------------------------

function MetaEditor({
  resource,
  busy,
  onBusy,
  onDone,
  onError,
  onFlash,
  coverInputRef,
  onCoverPick,
  updateMine,
}: {
  resource: {
    _id: string;
    title: string;
    description: string;
    url?: string;
    category: string;
    price: number;
    coverUrl: string | null;
    coverStorageId?: Id<"_storage">;
  };
  busy: boolean;
  onBusy: () => void;
  onDone: () => void;
  onError: (err: unknown) => void;
  onFlash: (msg: string) => void;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
  onCoverPick: (file: File) => void;
  updateMine: (args: {
    id: Id<"resources">;
    title: string;
    description: string;
    url?: string;
    category: string;
    price: number;
    coverStorageId?: Id<"_storage">;
  }) => Promise<void>;
}) {
  const { CATEGORIES } = { CATEGORIES: _CATEGORIES };
  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description);
  const [url, setUrl] = useState(resource.url ?? "");
  const [category, setCategory] = useState(resource.category);
  const [priceEuros, setPriceEuros] = useState((resource.price / 100).toFixed(2));
  const [coverPreview, setCoverPreview] = useState<string | null>(resource.coverUrl);

  // Keep the preview in sync when the cover is replaced via the image editor.
  useEffect(() => {
    setCoverPreview(resource.coverUrl);
  }, [resource.coverUrl]);

  const save = async () => {
    onBusy();
    try {
      const cents = Math.round(parseFloat(priceEuros || "0") * 100);
      if (Number.isNaN(cents) || cents < 0) throw new Error("Introduce un precio válido.");
      await updateMine({
        id: resource._id as Id<"resources">,
        title: title.trim(),
        description: description.trim(),
        url: url.trim() || undefined,
        category,
        price: cents,
      });
      onFlash("Recurso actualizado.");
    } catch (err) {
      onError(err);
    } finally {
      onDone();
    }
  };

  return (
    <section className="border-t border-border/60 pt-10">
      <SectionTitle icon={<Settings2 className="size-4" />}>
        Datos del recurso{" "}
        <span className="font-mono text-[10px] font-normal uppercase tracking-[0.18em] text-muted-foreground">
          solo autor
        </span>
      </SectionTitle>
      <p className="mt-2 max-w-lg text-[13px] text-muted-foreground">
        Como autor puedes ajustar el título, la descripción, el enlace externo,
        la categoría, el precio y la portada. Cualquiera puede colaborar con
        bloques; estos campos quedan reservados.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* cover */}
        <div className="flex flex-col gap-2">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-sm border border-border/60 bg-muted/20">
            {coverPreview ? (
              <img src={coverPreview} alt="Portada" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="size-5 text-muted-foreground/60" />
              </div>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 flex-1 rounded-sm"
              onClick={() => coverInputRef.current?.click()}
            >
              <ImagePlus className="mr-1.5 size-3" /> Cambiar
            </Button>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {coverPreview ? "Portada actual" : "Sin portada"}
          </span>
        </div>

        {/* fields */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Título
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-sm border-border bg-transparent" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Descripción
            </label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-20 rounded-sm border-border bg-transparent" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Enlace externo
              </label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://…" className="h-10 rounded-sm border-border bg-transparent" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:border-foreground/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Precio (€)
              </label>
              <Input value={priceEuros} onChange={(e) => setPriceEuros(e.target.value)} type="number" min="0" step="0.01" className="h-10 rounded-sm border-border bg-transparent font-mono" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" className="h-10 rounded-sm px-6" disabled={busy} onClick={() => void save()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
