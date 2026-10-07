/**
 * ThemeChrome — chrome global del tema (main.tsx, fuera del router):
 *  · Notification bar de cookies (options_global_notification_bar=1, blur=1,
 *    icon=1, expires=360 días).
 *  · Subscribe popup slide-in derecho (options_global_subscribe_popup_switch=1,
 *    position=slidein_right, trigger=time, delay=5s, expires=1 día, width=400).
 * Persistencia en localStorage: cada pieza recuerda su descarte por su TTL.
 */
import { useEffect, useState, type FormEvent } from "react";
import { Cookie, Mail, X } from "lucide-react";

const COOKIE_KEY = "moon0.cookie-consent";
const SUBSCRIBE_KEY = "moon0.subscribe-dismissed";

function expired(key: string): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return true;
    const until = Number(raw);
    return Number.isNaN(until) || Date.now() >= until;
  } catch {
    return true;
  }
}

function remember(key: string, days: number) {
  try {
    window.localStorage.setItem(
      key,
      String(Date.now() + days * 24 * 60 * 60 * 1000),
    );
  } catch {
    /* storage no disponible — el aviso volverá en cada carga. */
  }
}

/** Barra de cookies — fija abajo, blur sobre el fondo (notification_blur=1). */
function CookieBar({ onAccept }: { onAccept: () => void }) {
  return (
    <aside
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[80] animate-slide-in-right border-t border-border/70 bg-background/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-3">
        <Cookie className="size-4 shrink-0 text-[var(--signal-red)]" aria-hidden />
        <p className="min-w-0 flex-1 text-[12px] leading-snug text-muted-foreground">
          Este sitio almacena cookies en tu ordenador.{" "}
          <a href="#" className="link-editorial whitespace-nowrap">
            Política de cookies
          </a>
        </p>
        <button
          type="button"
          onClick={onAccept}
          className="btn-solid h-8 shrink-0 px-3 text-[11px] uppercase tracking-[0.12em]"
        >
          Entendido
        </button>
      </div>
    </aside>
  );
}

/** Popup de suscripción — panel 400px slide-in desde la derecha. */
function SubscribePopup({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
    window.setTimeout(onClose, 1800);
  }

  return (
    <aside
      role="dialog"
      aria-label="Suscripción al boletín"
      className="animate-slide-in-right fixed right-4 bottom-4 z-[85] w-[min(400px,calc(100vw-2rem))] overflow-hidden rounded-sm border border-border/70 bg-popover/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar suscripción"
        className="absolute top-2.5 right-2.5 z-10 inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <div className="border-b border-border/60 bg-[var(--signal-red)] px-5 py-3 text-white">
        <p className="font-display text-[13px] font-bold uppercase tracking-[0.08em]">
          Keep up with the lab
        </p>
      </div>
      <div className="px-5 py-4">
        <p className="text-[13px] leading-snug text-foreground">
          Mantente al día con los boletines diarios y semanales del
          laboratorio.
        </p>
        {done ? (
          <p className="mt-4 flex items-center gap-2 text-[13px] text-[var(--signal-red)]">
            <Mail className="size-4" aria-hidden /> ¡Gracias! Revisa tu correo.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              aria-label="Correo electrónico"
              className="h-9 min-w-0 flex-1 rounded-sm border border-border bg-background px-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--signal-red)]"
            />
            <button type="submit" className="btn-solid h-9 px-3 text-[12px]">
              Suscribirme
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}

export function ThemeChrome() {
  // Lazy init lee localStorage en el primer render (sin setState en effect).
  const [cookieOpen, setCookieOpen] = useState(() => expired(COOKIE_KEY));
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  useEffect(() => {
    // trigger=time, delay=5s (options_global_delay_subcribe_popup=5).
    const t = window.setTimeout(() => {
      if (expired(SUBSCRIBE_KEY)) setSubscribeOpen(true);
    }, 5000);
    return () => window.clearTimeout(t);
  }, []);

  function acceptCookies() {
    // options_global_notification_expires=360.
    remember(COOKIE_KEY, 360);
    setCookieOpen(false);
  }
  function dismissSubscribe() {
    // options_global_subscribe_popup_expires=1.
    remember(SUBSCRIBE_KEY, 1);
    setSubscribeOpen(false);
  }

  return (
    <>
      {cookieOpen && <CookieBar onAccept={acceptCookies} />}
      {subscribeOpen && <SubscribePopup onClose={dismissSubscribe} />}
    </>
  );
}
