import { BRAND } from "@/lib/brand";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Clock, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/hooks/use-page-meta";

/**
 * Submit: proposals for the directory (tools, projects, articles).
 *
 * MVP: submissions are stored locally with a `pending` status so the
 * moderation flow (pending → approved → published) is visible and testable.
 * Community *resources* have a real upload path at /upload backed by Convex;
 * this page is the future intake for editorial content.
 */

const KEY = "mld.submissions.v1";

type SubmissionType = "herramienta" | "proyecto" | "artículo";
type SubmissionStatus = "pending" | "approved" | "rejected";

interface Submission {
  id: string;
  type: SubmissionType;
  title: string;
  url: string;
  note: string;
  status: SubmissionStatus;
  createdAt: number;
}

function loadSubmissions(): Submission[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Submission[];
  } catch {
    return [];
  }
}

function persistSubmissions(list: Submission[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore storage failures
  }
}

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "pendiente de revisión",
  approved: "aprobada",
  rejected: "descartada",
};

const TYPES: { id: SubmissionType; hint: string }[] = [
  { id: "herramienta", hint: "Web oficial, licencia o precio verificable." },
  { id: "proyecto", hint: "Un trabajo propio con imagen y contexto." },
  { id: "artículo", hint: "Una guía o pieza editorial con autoría." },
];

export default function Submit() {
  usePageMeta({
    title: `Enviar — ${BRAND.mark}`,
    description:
      "Propón una herramienta, un proyecto o un artículo para el directorio. Revisión antes de publicar.",
    path: "/submit",
  });

  const [type, setType] = useState<SubmissionType>("herramienta");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>(loadSubmissions);

  // Keep multiple tabs in sync (cheap; same pattern as use-collections).
  useEffect(() => {
    const onFocus = () => setSubmissions(loadSubmissions());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const next: Submission[] = [
      {
        id: `s-${Date.now().toString(36)}`,
        type,
        title: title.trim(),
        url: url.trim(),
        note: note.trim(),
        status: "pending",
        createdAt: Date.now(),
      },
      ...submissions,
    ];
    persistSubmissions(next);
    setSubmissions(next);
    setTitle("");
    setUrl("");
    setNote("");
    toast.success("Propuesta enviada", {
      description: "Queda como pendiente de revisión (demo local).",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Colabora
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">
          Envía tu propuesta
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          El directorio crece con aportaciones revisadas. En esta fase, las
          propuestas se guardan localmente como <em>pendientes</em>; si quieres
          publicar un recurso descargable, usa{" "}
          <Link to="/upload" className="underline underline-offset-2 hover:text-foreground">
            la subida de recursos
          </Link>
          .
        </p>

        <form onSubmit={submit} className="mt-8 max-w-xl space-y-4">
          {/* Type selector */}
          <div className="grid gap-2 sm:grid-cols-3">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                aria-pressed={type === t.id}
                className={`rounded-sm border p-3 text-left transition-colors ${
                  type === t.id
                    ? "border-foreground/50 bg-muted/40"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                <span className="block text-[13px] font-medium capitalize">
                  {t.id}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                  {t.hint}
                </span>
              </button>
            ))}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la propuesta"
            aria-label="Título"
            required
            className="h-11 w-full rounded-sm border border-border bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="Enlace (web oficial, portfolio o borrador)"
            aria-label="Enlace"
            className="h-11 w-full rounded-sm border border-border bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contexto breve: qué es y por qué encaja en el directorio."
            aria-label="Contexto"
            rows={3}
            className="w-full rounded-sm border border-border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="size-4" />
            Enviar propuesta
          </button>
        </form>

        {/* Status legend — moderation flow made visible */}
        <div className="mt-10 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-3">
          {(
            [
              ["Pendiente", "Recibida y en cola de revisión."],
              ["Aprobada", "Pasa al directorio con revisión de datos."],
              ["Descartada", "No encaja; se explica el motivo."],
            ] as const
          ).map(([label, body]) => (
            <div key={label} className="bg-background p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-1.5 text-[12px] text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        {/* Submitted proposals */}
        {submissions.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-light tracking-tight">
              Tus propuestas{" "}
              <span className="font-mono text-[12px] text-muted-foreground">
                ({submissions.length})
              </span>
            </h2>
            <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
              {submissions.map((s) => (
                <li key={s.id} className="flex items-center gap-4 py-3.5">
                  <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px]">{s.title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {s.type}
                      {s.url && (
                        <>
                          {" · "}
                          <span className="break-all">{s.url}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {STATUS_LABEL[s.status]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-4xl px-5 py-6">
          <p className="font-mono text-[11px] text-muted-foreground">

          </p>
        </div>
      </footer>
    </div>
  );
}
