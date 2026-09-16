import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { ArrowLeft, Loader2, Upload as UploadIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/catalog";

export default function Upload() {
  const navigate = useNavigate();
  const createResource = useMutation(api.resources.create);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [priceEuros, setPriceEuros] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        url: url.trim(),
        category,
        price: cents,
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
          Publica plantillas, fuentes, texturas o lo que quieras compartir con
          la comunidad. Puedes ofrecerlo gratis o ponerle un precio.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
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
              Enlace al recurso
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              placeholder="https://…"
              required
              className="h-10 rounded-sm border-border bg-transparent"
            />
            <p className="text-[12px] text-muted-foreground">
              Enlaza el archivo o la página de descarga. Los compradores verán
              este enlace tras adquirirlo.
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
              disabled={busy}
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

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-3xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">
            Minimal Lunar Design · Recursos de edición y diseño
          </p>
        </div>
      </footer>
    </div>
  );
}
