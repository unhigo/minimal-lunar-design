import { Link } from "react-router";
import { ArrowUpRight, BadgeCheck, Bookmark, TrendingUp } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface DirectoryTool {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  category: string;
  tags: string[];
  pricing: "free" | "freemium" | "open-source" | "paid";
  pricingDetails: string;
  trending: boolean;
  verified: boolean;
  featured: boolean;
  votes: number;
  favorited?: boolean;
  voted?: boolean;
}

const PRICING_LABEL: Record<DirectoryTool["pricing"], string> = {
  free: "gratis",
  freemium: "freemium",
  "open-source": "open source",
  paid: "de pago",
};

export function DirectoryCard({
  tool,
  onToggleFavorite,
  compact = false,
}: {
  tool: DirectoryTool;
  onToggleFavorite?: (tool: DirectoryTool) => void;
  compact?: boolean;
}) {
  const { isAuthenticated } = useAuth();

  const handleSave = () => {
    if (!isAuthenticated) {
      toast("Inicia sesión para guardar favoritos", {
        description: "Los favoritos y votos son para usuarios registrados.",
      });
      return;
    }
    onToggleFavorite?.(tool);
  };

  return (
    <div className="group relative flex flex-col border border-border/60 bg-background p-5 transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {tool.category}
          {tool.trending && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-foreground">
              <TrendingUp className="size-3" /> tendencia
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {tool.verified && (
            <BadgeCheck className="size-3.5 text-muted-foreground" aria-label="Verificada" />
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }}
            aria-label={tool.favorited ? "Quitar de favoritos" : "Guardar en favoritos"}
            aria-pressed={tool.favorited}
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bookmark className={`size-3.5 ${tool.favorited ? "fill-current text-foreground" : ""}`} />
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
        <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {PRICING_LABEL[tool.pricing]}
        </span>
        <div className="flex items-center gap-3">
          {!compact && (
            <span className="truncate font-mono text-[10px] text-muted-foreground">
              {tool.tags.slice(0, 2).join(" · ")}
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground"
            title={`${tool.votes} votos`}
          >
            ▲ {tool.votes}
          </span>
        </div>
      </div>
    </div>
  );
}
