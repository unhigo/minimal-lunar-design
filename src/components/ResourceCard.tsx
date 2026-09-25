import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/catalog";
import { BRAND } from "@/lib/brand";
import { badgesFor, type SubmitPayload } from "@/lib/submit-schema";

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
  productFields?: {
    tagline?: string;
    platforms: string[];
    ecosystems: string[];
    tags: string[];
    gallery: { storageId: string; caption?: string }[];
    videoUrl?: string;
    pricing?: string;
    pricingDetails?: string;
    license?: string;
    discountCode?: string;
    discountPercent?: number;
    features: string[];
    senderRole?: string;
    authorHandle?: string;
    authorLinks: string[];
  };
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
              {BRAND.name.toLowerCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {resource.category}
            {resource.featured && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-foreground">
                <span
                  aria-hidden
                  className="inline-block size-1.5 shrink-0 rounded-full bg-[#FF0033]"
                />
                destacado
              </span>
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
        {resource.productFields && (
          <div className="mt-3 flex flex-wrap gap-1">
            {badgesFor({
              category: resource.category,
              pricing: resource.productFields.pricing ?? "free",
              license: resource.productFields.license ?? "personal",
              discountCode: resource.productFields.discountCode,
              discountPercent: resource.productFields.discountPercent,
              videoUrl: resource.productFields.videoUrl,
              senderRole: (resource.productFields.senderRole ?? "curator") as SubmitPayload["senderRole"],
              platforms: resource.productFields.platforms as SubmitPayload["platforms"],
            })
              .slice(0, 3)
              .map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground"
                >
                  <span aria-hidden>{b.glyph}</span> {b.label}
                </span>
              ))}
          </div>
        )}
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
