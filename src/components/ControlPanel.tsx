import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Layers,
  Moon,
  Palette,
  Sparkles,
  Type as TypeIcon,
} from "lucide-react";
import { useAction } from "convex/react";
import { Input } from "@/components/ui/input";
import { WheelYear } from "@/components/ui/wheel-picker";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLunar } from "@/hooks/use-lunar-context";
import { api } from "@/convex/_generated/api";
import {
  FILTERS,
  FONT_STACKS,
  type Lang,
  type LayoutId,
  type MoonStyleId,
} from "@/lib/lunar";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "moon", label: "Moon", icon: Moon },
  { id: "style", label: "Style", icon: Palette },
  { id: "typography", label: "Type", icon: TypeIcon },
  { id: "ai", label: "AI", icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Section({
  title,
  icon: IconComponent,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border/60 py-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <IconComponent className="size-3.5" />
          {title}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
      </button>
      {open && <div className="flex flex-col gap-3.5 px-4 pb-4">{children}</div>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="shrink-0 text-[11px] text-muted-foreground sm:w-24">
        {label}
      </span>
      <div className="flex w-full flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex min-h-9 items-center justify-center rounded border px-2 py-2 text-[11px] transition-colors",
        active
          ? "border-foreground/60 bg-foreground/10 text-foreground"
          : "border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ControlPanel({ onNavigate }: { onNavigate?: () => void }) {
  const { state, updateState } = useLunar();
  const [activeTab, setActiveTab] = useState<TabId>("calendar");

  const [aiText, setAiText] = useState("");
  const [aiState, setAiState] = useState<"idle" | "loading" | "error" | "ready">(
    "idle",
  );
  const generateInsight = useAction(api.ai.lunarInsight);

  const fetchAiMoonInsight = async () => {
    setAiState("loading");
    try {
      const result = await generateInsight({
        year: state.year,
        hemisphere: state.hemisphere,
        lang: state.lang,
      });
      if (result.ok) {
        setAiText(result.text);
        setAiState("ready");
      } else {
        setAiText(
          result.reason === "missing-key"
            ? "AI key not configured. Add OPENLLM_API_KEY (or GEMINI_API_KEY) in the Keys panel."
            : "The cosmos is quiet right now — please try again in a moment.",
        );
        setAiState("error");
      }
    } catch {
      setAiText("Something went wrong reaching the cosmos. Try again.");
      setAiState("error");
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Tabs */}
      <div className="flex shrink-0 items-center justify-between gap-1 overflow-x-auto border-b border-border/60 px-2 py-1.5 custom-scrollbar">
        {TABS.map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex min-h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded px-2 py-2 text-[10px] uppercase tracking-[0.14em] transition-colors",
              activeTab === id
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <TabIcon className="size-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {activeTab === "calendar" && (
          <>
            <Section title="Time" icon={CalendarDays}>
              <Row label="Year">
                <WheelYear
                  value={state.year}
                  onChange={(year) => updateState({ year })}
                  from={1970}
                  to={2060}
                  className="w-24 shrink-0"
                />
              </Row>
              <Row label="Hemisphere">
                <div className="grid w-full grid-cols-2 gap-2">
                  <OptionButton
                    active={state.hemisphere === "N"}
                    onClick={() => updateState({ hemisphere: "N" })}
                  >
                    North
                  </OptionButton>
                  <OptionButton
                    active={state.hemisphere === "S"}
                    onClick={() => updateState({ hemisphere: "S" })}
                  >
                    South
                  </OptionButton>
                </div>
              </Row>
              <Row label="Language">
                <div className="grid w-full grid-cols-2 gap-2">
                  <OptionButton
                    active={state.lang === "ES"}
                    onClick={() => updateState({ lang: "ES" as Lang })}
                  >
                    Español
                  </OptionButton>
                  <OptionButton
                    active={state.lang === "EN"}
                    onClick={() => updateState({ lang: "EN" as Lang })}
                  >
                    English
                  </OptionButton>
                </div>
              </Row>
            </Section>

            <Section title="Structure" icon={Layers}>
              <Row label="Layout">
                <div className="grid w-full grid-cols-2 gap-2">
                  {(
                    [
                      { id: "default", label: "Grid" },
                      { id: "radial", label: "Radial" },
                      { id: "compact", label: "Compact" },
                      { id: "poster", label: "Poster" },
                    ] as const
                  ).map((l) => (
                    <OptionButton
                      key={l.id}
                      active={state.layout === l.id}
                      onClick={() => updateState({ layout: l.id as LayoutId })}
                    >
                      {l.label}
                    </OptionButton>
                  ))}
                </div>
              </Row>
              <Row label="Margin">
                <Slider
                  min={10}
                  max={150}
                  step={1}
                  value={[state.padding]}
                  onValueChange={([v]) => updateState({ padding: v })}
                />
              </Row>
              {state.layout === "radial" && (
                <Row label="Radius">
                  <Slider
                    min={50}
                    max={400}
                    step={1}
                    value={[state.radialRadius]}
                    onValueChange={([v]) => updateState({ radialRadius: v })}
                  />
                </Row>
              )}
            </Section>
          </>
        )}

        {activeTab === "moon" && (
          <Section title="Moon" icon={Moon}>
            <Row label="Style">
              <Select
                value={state.moonStyle}
                onValueChange={(v) => updateState({ moonStyle: v as MoonStyleId })}
              >
                <SelectTrigger className="h-9 w-full border-border bg-transparent text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="line">Fine line</SelectItem>
                  <SelectItem value="neon">Neon</SelectItem>
                  <SelectItem value="textured">Cratered</SelectItem>
                  <SelectItem value="mystic">Mystic</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Size">
              <Slider
                min={4}
                max={30}
                step={0.5}
                value={[state.moonSize]}
                onValueChange={([v]) => updateState({ moonSize: v })}
              />
            </Row>
            <Row label="Glow">
              <Slider
                min={0}
                max={40}
                step={1}
                value={[state.glow]}
                onValueChange={([v]) => updateState({ glow: v })}
              />
            </Row>
            <Row label="Earthshine">
              <Slider
                min={0}
                max={50}
                step={1}
                value={[state.earthshine]}
                onValueChange={([v]) => updateState({ earthshine: v })}
              />
            </Row>
          </Section>
        )}

        {activeTab === "style" && (
          <Section title="Environment" icon={Palette}>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-muted-foreground">
                Starfield
              </span>
              <Switch
                checked={state.showStars}
                onCheckedChange={(v) => updateState({ showStars: v })}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-muted-foreground">Grid</span>
              <Switch
                checked={state.grid}
                onCheckedChange={(v) => updateState({ grid: v })}
              />
            </div>
            <Row label="Photo filter">
              <Select
                value={state.filter}
                onValueChange={(v) => updateState({ filter: v })}
              >
                <SelectTrigger className="h-9 w-full border-border bg-transparent text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            <Row label="Moon opacity">
              <Slider
                min={10}
                max={100}
                step={1}
                value={[state.moonLitOpacity]}
                onValueChange={([v]) => updateState({ moonLitOpacity: v })}
              />
            </Row>
            <Row label="Brightness">
              <Slider
                min={50}
                max={150}
                step={1}
                value={[state.brightness]}
                onValueChange={([v]) => updateState({ brightness: v })}
              />
            </Row>
            <Row label="Contrast">
              <Slider
                min={50}
                max={150}
                step={1}
                value={[state.contrast]}
                onValueChange={([v]) => updateState({ contrast: v })}
              />
            </Row>
          </Section>
        )}

        {activeTab === "typography" && (
          <Section title="Typography" icon={TypeIcon}>
            <Row label="Font">
              <Select
                value={state.fontFamily}
                onValueChange={(v) => updateState({ fontFamily: v })}
              >
                <SelectTrigger className="h-9 w-full border-border bg-transparent text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_STACKS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f.split(",")[0].replace(/'/g, "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            <Row label="Weight">
              <Select
                value={state.fontWeight}
                onValueChange={(v) => updateState({ fontWeight: v })}
              >
                <SelectTrigger className="h-9 w-full border-border bg-transparent text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["300", "400", "500", "600", "700"].map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-muted-foreground">
                Month names
              </span>
              <Switch
                checked={state.showMonthNames}
                onCheckedChange={(v) => updateState({ showMonthNames: v })}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-muted-foreground">
                Month numbers
              </span>
              <Switch
                checked={state.showMonthNumbers}
                onCheckedChange={(v) => updateState({ showMonthNumbers: v })}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-muted-foreground">
                Day axis (1–31)
              </span>
              <Switch
                checked={state.showDayNumbers}
                onCheckedChange={(v) => updateState({ showDayNumbers: v })}
              />
            </div>
            <Row label="Month size">
              <Slider
                min={6}
                max={24}
                step={1}
                value={[state.monthNameSize]}
                onValueChange={([v]) => updateState({ monthNameSize: v })}
              />
            </Row>
            <Row label="Day size">
              <Slider
                min={4}
                max={18}
                step={1}
                value={[state.dayNumberSize]}
                onValueChange={([v]) => updateState({ dayNumberSize: v })}
              />
            </Row>
          </Section>
        )}

        {activeTab === "ai" && (
          <div className="flex flex-col gap-4 p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              A short, poetic line about this year's lunar cycle — generated
              quietly in the background.
            </p>
            <button
              onClick={() => void fetchAiMoonInsight()}
              disabled={aiState === "loading"}
              className="flex min-h-10 items-center justify-center gap-2 rounded border border-border px-3 py-2 text-xs text-foreground transition-colors hover:border-foreground/40 disabled:opacity-50"
            >
              {aiState === "loading" ? (
                <Sparkles className="size-3.5 animate-pulse" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {aiState === "loading" ? "Consulting…" : "Generate insight"}
            </button>
            {aiText && (
              <div
                className={cn(
                  "rounded border p-3 text-xs italic leading-relaxed",
                  aiState === "error"
                    ? "border-border bg-muted/30 text-muted-foreground"
                    : "border-border bg-muted/40 text-foreground",
                )}
              >
                “{aiText}”
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
