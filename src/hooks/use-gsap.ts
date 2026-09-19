import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP reveal-up: children marked [data-reveal] inside the returned ref slide
 * up and fade in as they enter the viewport. Optionally staggers siblings.
 *
 * Respects prefers-reduced-motion and falls back to visible state.
 */
export function useGsapReveal<T extends HTMLElement>(stagger = 0.08) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (targets.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger,
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [stagger]);

  return ref;
}

/**
 * GSAP parallax: the image inside the returned ref drifts vertically as the
 * user scrolls, while the container clips it (overflow-hidden). Also exposes
 * the grayscale→color hover via classes, so callers keep one consistent effect.
 *
 * Respects prefers-reduced-motion.
 */
export function useGsapParallax<T extends HTMLElement>(strength = 14) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const img = el.querySelector<HTMLElement>("[data-parallax-image]");
    if (!img) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        img,
        { yPercent: -strength },
        {
          yPercent: strength,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [strength]);

  return ref;
}
