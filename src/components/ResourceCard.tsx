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
}

export function ResourceCard({ resource }: { resource: ResourceCardData }) {
  return (
    <Link
      to={`/resource/${resource._id}`}
      className="group flex flex-col border border-border/60 bg-background p-6 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {resource.category}
          {resource.featured && (
            <span className="ml-2 text-foreground">★ destacado</span>
          )}
        </span>
        <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="mt-4 text-[15px] font-medium leading-snug">
        {resource.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {resource.description}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
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
    </Link>
  );
}
