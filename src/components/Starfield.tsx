import { useEffect, useRef } from "react";

/**
 * Sparse, slowly twinkling starfield. Deliberately quiet — it should read as
 * texture behind the calendar, not as a scene.
 */
export function Starfield({ density = 0.12 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;

    const stars = Array.from({ length: 200 }, () => ({
      x: 0,
      y: 0,
      size: Math.random() * 1.5 + 0.2,
      alpha: Math.random(),
      speed: Math.random() * 0.003 + 0.0008,
    }));

    const seedPositions = () => {
      stars.forEach((s) => {
        s.x = Math.random() * width;
        s.y = Math.random() * height;
      });
    };

    const resize = () => {
      const parent = canvas.parentElement;
      width = canvas.width = parent?.clientWidth ?? window.innerWidth;
      height = canvas.height = parent?.clientHeight ?? window.innerHeight;
      seedPositions();
    };
    resize();

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) star.speed *= -1;
        ctx.fillStyle = `rgba(255,255,255,${Math.abs(star.alpha) * density})`;
        brightness(ctx, star);
      }
      raf = requestAnimationFrame(render);
    };

    function brightness(ctx2d: CanvasRenderingContext2D, star: (typeof stars)[number]) {
      ctx2d.beginPath();
      ctx2d.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx2d.fill();
    }

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    render();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-70"
    />
  );
}
