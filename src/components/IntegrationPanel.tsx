import { useMemo } from "react";
import { Check, Code2, Copy, Download, Link2, MessageSquareCode } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Copy-ready integration snippets for a published resource:
 * direct link, embeddable HTML, Markdown, and a download button
 * for resources stored as files.
 */
export function IntegrationPanel({
  resourceId,
  title,
  fileUrl,
  externalUrl,
  coverUrl,
}: {
  resourceId: string;
  title: string;
  fileUrl: string | null;
  externalUrl: string | null;
  coverUrl: string | null;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  // window is unavailable during SSR-less first render? It is, but keep it
  // lazy so this component is safe anywhere.
  useMemo(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const publicUrl = `${origin}/resource/${resourceId}`;
  const assetUrl = fileUrl ?? externalUrl ?? publicUrl;

  const snippets = [
    {
      id: "link",
      icon: Link2,
      label: "Enlace público",
      value: publicUrl,
    },
    {
      id: "markdown",
      icon: MessageSquareCode,
      label: "Markdown",
      value: `[${title}](${publicUrl})`,
    },
    {
      id: "html",
      icon: Code2,
      label: "HTML",
      value: `<a href="${publicUrl}">${title}</a>`,
    },
  ];

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard unavailable; ignore silently.
    }
  };

  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-light tracking-tight">
        <Link2 className="size-4 text-muted-foreground" />
        Integra este recurso
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Copia el enlace o los fragmentos listos para pegar en tu web, README o
        blog.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {snippets.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {s.label}
            </span>
            <Input
              readOnly
              value={s.value}
              onFocus={(e) => e.currentTarget.select()}
              className="h-9 flex-1 rounded-sm border-border bg-muted/30 font-mono text-[12px]"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 rounded-sm"
              onClick={() => void copy(s.id, s.value)}
            >
              {copied === s.id ? (
                <>
                  <Check className="mr-1.5 size-3.5" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 size-3.5" /> Copiar
                </>
              )}
            </Button>
          </div>
        ))}

        {assetUrl && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Descarga
            </span>
            <a
              href={assetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 flex-1 items-center gap-2 rounded-sm border border-border px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Download className="size-3.5" />
              {fileUrl ? "Descargar archivo original" : "Abrir recurso externo"}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
