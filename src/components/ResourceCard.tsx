import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/catalog";

export interface ResourceCardData {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  featured?: boolean;
  createdAt: number;
  authorName: string;
  coverUrl?: string | null;
}

export function ResourceCard({ resource }: { resource: ResourceCardData }) {
  return (
    <Link
      to={`/resource/${resource._id}`}
      className="group flex flex-col overflow-hidden border border-border/60 bg-background transition-colors hover:bg-muted/40"
    >
      <div className="relative h-40 w-full overflow-hidden border-b border-border/60 bg-muted/30">
        {resource.coverUrl ? (
          <img
            src={resource.coverUrl}
            alt={resource.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
              minimal lunar
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {resource.category}
            {resource.featured && (
              <span className="ml-2 text-foreground">★ destacado</span>
            )}
          </span>
          <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <h3 className="mt-3 text-[15px] font-medium leading-snug">
          {resource.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {resource.description}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
          <span
            className={
              resource.price === 0
                ? "font-mono text-[11px] text-muted-foreground"
                : "font-mono text-[11px] text-foreground"
            }
          >
            {formatPrice(resource.price)}
          </span>
          <span className="truncate font-mono text-[10px] text-muted-foreground">
            {resource.authorName} · {timeAgo(resource.createdAt)}
          </span>
        </div>
      </div>
      </Link>
  );
}
