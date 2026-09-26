import { useState } from "react";
import { useAction } from "convex/react";
import { Renderer } from "@openuidev/react-lang";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/hooks/use-page-meta";
import { BRAND } from "@/lib/brand";
import { beuiLibrary } from "@/lib/beui-library";
import { Button } from "@/components/motion/button";

interface Turn {
  /** User prompt (null for the first generated answer). */
  prompt: string | null;
  /** OpenUI Lang emitted by the model, or null while loading/failed. */
  response: string | null;
  error?: string;
}

const SUGGESTIONS = [
  "Muestra el estado del laboratorio",
  "Resumen del directorio con métricas",
  "Explora el sistema lunar",
] as const;

export default function Lab() {
  usePageMeta({
    title: `Lab — ${BRAND.mark}`,
    description:
      "Generative UI: el modelo responde con componentes beUI reales a través de OpenUI — botones, badges y métricas animadas del laboratorio.",
    path: "/lab",
  });

  const generate = useAction(api.generative.generate);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (message: string) => {
    if (!message.trim() || busy) return;
    const history = turns
      .filter((t) => t.response)
      .flatMap((t) => [
        { role: "user" as const, content: t.prompt ?? "" },
        { role: "assistant" as const, content: t.response ?? "" },
      ])
      .filter((m) => m.content);

    setTurns((prev) => [...prev, { prompt: message, response: null }]);
    setInput("");
    setBusy(true);
    try {
      const result = await generate({
        messages: [...history, { role: "user", content: message }],
      });
      setTurns((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.response === null) {
          next[next.length - 1] = result.ok
            ? { ...last, response: result.response }
            : { ...last, error: result.reason };
        }
        return next;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Generative UI · OpenUI
        </p>
        <h1 className="mt-3 h1-editorial tracking-tight">Lab</h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
          Pide algo al laboratorio: el modelo responde con una interfaz real —
          no markdown — compuesta por componentes beUI del sistema.
        </p>

        {/* Conversation: each answer is rendered OpenUI Lang → beUI. */}
        <div className="mt-10 space-y-8">
          {turns.map((turn, i) => (
            <div key={i} className="space-y-4">
              <p className="font-mono text-[11px] text-muted-foreground">
                <span className="text-foreground">›</span> {turn.prompt}
              </p>
              {turn.error ? (
                <p className="rounded-sm border border-dashed border-border/70 px-4 py-3 text-[13px] text-muted-foreground">
                  El modelo no respondió ({turn.error}). Revisa OPENLLM_API_KEY
                  en el panel de claves.
                </p>
              ) : turn.response === null ? (
                <div className="h-20 w-full max-w-md animate-pulse border border-border/40" />
              ) : (
                <Renderer
                  response={turn.response}
                  library={beuiLibrary}
                  // A registered Button was pressed — send its message back
                  // to the model to continue the conversation.
                  onAction={(event) => send(event.humanFriendlyMessage)}
                />
              )}
            </div>
          ))}

          {turns.length === 0 && (
            <div className="rounded-sm border border-dashed border-border/70 px-6 py-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Prueba con
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-sm border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Prompt bar */}
        <form
          className="sticky bottom-4 mt-10 flex gap-2 rounded-sm border border-border bg-background/90 p-2 backdrop-blur-md"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Explora el sistema…"
            aria-label="Mensaje para el laboratorio"
            className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Generando…" : "Enviar"}
          </Button>
        </form>
      </main>
    </div>
  );
}
