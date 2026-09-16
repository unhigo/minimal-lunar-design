import { useState } from "react";
import { Link } from "react-router";
import { LogOut, Moon, SlidersHorizontal } from "lucide-react";
import { ControlPanel } from "@/components/ControlPanel";
import { StudioStage } from "@/components/StudioStage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LunarProvider, useLunar } from "@/hooks/use-lunar-context";
import { DEFAULT_LUNAR_STATE } from "@/lib/lunar";

function PhaseChip() {
  const { state } = useLunar();
  const now = new Date();
  const sameYear = state.year === now.getFullYear();
  return (
    <span className="hidden items-center gap-2 font-mono text-[11px] text-muted-foreground lg:flex">
      <Moon className="size-3" />
      {state.year}
      {sameYear ? ` · ${state.hemisphere === "N" ? "N" : "S"} · live` : ""}
    </span>
  );
}

function StudioWorkspace() {
  const { state } = useLunar();
  const [panelOpen, setPanelOpen] = useState(false);

  // "Unsaved" badge: true while the user has strayed from the default palette/layout.
  const isDefault =
    state.bgColor === DEFAULT_LUNAR_STATE.bgColor &&
    state.layout === DEFAULT_LUNAR_STATE.layout;
  const customized = !isDefault;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-[320px] shrink-0 border-r border-border/60 lg:block xl:w-[350px]">
        <ControlPanel />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="left" className="w-[86%] max-w-[360px] p-0">
          <ControlPanel onNavigate={() => setPanelOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Slim header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-3 sm:px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPanelOpen(true)}
              className="flex min-h-9 items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <SlidersHorizontal className="size-3.5" />
              Controls
            </button>
            <PhaseChip />
          </div>
          <div className="flex items-center gap-2">
            {customized ? (
              <span className="hidden rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                sin guardar
              </span>
            ) : null}
            <Link
              to="/dashboard"
              className="hidden text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Mi espacio
            </Link>
          </div>
        </header>

        <StudioStage onOpenPanel={() => setPanelOpen(true)} />
      </div>
    </div>
  );
}

export default function Studio() {
  return (
    <LunarProvider>
      <StudioWorkspace />
    </LunarProvider>
  );
}
