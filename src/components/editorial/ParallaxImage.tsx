import { type ReactNode } from "react";
import { useGsapParallax } from "@/hooks/use-gsap";

/**
 * Editorial image container: GSAP vertical parallax on the inner layer plus a
 * grayscale→color transition on hover. Accepts a CSS background (the demo
 * data uses gradients instead of external images) or arbitrary children.
 */
export function ParallaxImage({
  background,
  aspect = "4/3",
  className = "",
  children,
}: {
  background?: string;
  aspect?: "4/3" | "1/1" | "3/4" | "16/9" | "3/2";
  className?: string;
  children?: ReactNode;
}) {
  const ref = useGsapParallax<HTMLDivElement>(12);

  return (
    <div
      ref={ref}
      className={`group/parallax relative overflow-hidden rounded-sm border border-border/60 bg-muted ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <div
        data-parallax-image
        className="absolute -inset-y-[14%] inset-x-0 scale-105 bg-cover bg-center transition-[filter] duration-500 ease-out group-hover/parallax:grayscale-0"
        style={{ background, filter: "grayscale(1)" }}
      />
      {children}
    </div>
  );
}
