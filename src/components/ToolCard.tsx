import { Link } from "react-router";
import { ArrowUpRight, BadgeCheck, Bookmark } from "lucide-react";
import type { Tool } from "@/data/tools";
import { useCollections } from "@/hooks/use-collections";

const PRICING_LABEL: Record<Tool["pricing"], string> = {
  free: "gratis",
  freemium: "freemium",
  "open-source": "open source",
  paid: "de pago",
};

export function PricingBadge({ pricing }: { pricing: Tool["pricing"] }) {
  return (
    <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {PRICING_LABEL[pricing]}
    </span>
  );
}

export function ToolCard({ tool }: { tool: Tool }) {
  const { toggle, isSaved } = useCollections();
  const saved = isSaved("tool", tool.id);

  return (
    <div className="group relative flex flex-col border border-border/60 bg-background p-5 transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {tool.category}
          {tool.trending && <span className="ml-2 text-foreground">↑ tendencia</span>}
        </span>
        <div className="flex items-center gap-1">
          {tool.verified && (
            <BadgeCheck className="size-3.5 text-muted-foreground" aria-label="Verificada" />
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle("tool", tool.id);
            }}
            aria-label={saved ? "Quitar de guardados" : "Guardar herramienta"}
            aria-pressed={saved}
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bookmark className={`size-3.5 ${saved ? "fill-current text-foreground" : ""}`} />
          </button>
        </div>
      </div>

      <Link to={`/tools/${tool.slug}`} className="mt-3 flex-1">
        <h3 className="flex items-center gap-1 text-[15px] font-medium leading-snug">
          {tool.name}
          <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {tool.shortDescription}
        </p>
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3.5">
        <PricingBadge pricing={tool.pricing} />
        <span className="truncate font-mono text-[10px] text-muted-foreground">
          {tool.tags.slice(0, 2).join(" · ")}
        </span>
      </div>
    </div>
  );
}
