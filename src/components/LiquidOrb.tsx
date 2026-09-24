import { useEffect, useMemo, useRef, useState } from "react";
import { readOrbPalette } from "@/lib/orb-theme";
import { cn } from "@/lib/utils";

/**
 * LiquidOrb — a glass-liquid orb rendered with a single-pass WebGL shader.
 *
 * Curated flow programs (presets) drive one fragment shader through uniforms:
 * domain-warped fbm fluid, resampled through a signed-distance glass shell
 * with rim refraction, spectral separation and two directional edge lights.
 * Colors come from the app's CSS variables, so the orb inherits the
 * MOONØ.LAB light/dark theme instead of hardcoding hues.
 *
 * Accessibility: the canvas is decorative (aria-hidden); reduced-motion users
 * get a single static frame; browsers without WebGL get a CSS fallback.
 */

// ── Presets ────────────────────────────────────────────────────────────────

export interface OrbPreset {
  id: string;
  label: string;
  seed: number;
  /** Domain-warp strength. */
  warp: number;
  /** Time multiplier. */
  speed: number;
  /** Spatial frequency. */
  scale: number;
  /** How much brand-ember coloring bleeds into the fluid. */
  emberMix: number;
  /** Glass shell strength (refraction + edge lights). */
  glass: number;
}

export const ORB_PRESETS: OrbPreset[] = [
  { id: "silica", label: "Silica", seed: 3.1, warp: 1.6, speed: 0.16, scale: 1.35, emberMix: 0.12, glass: 0.9 },
  { id: "ember", label: "Ember", seed: 11.7, warp: 2.1, speed: 0.3, scale: 1.8, emberMix: 0.95, glass: 0.55 },
  { id: "chrome", label: "Chrome", seed: 27.4, warp: 1.1, speed: 0.12, scale: 2.3, emberMix: 0.0, glass: 0.75 },
  { id: "mare", label: "Mare", seed: 41.2, warp: 2.6, speed: 0.09, scale: 1.05, emberMix: 0.35, glass: 0.4 },
  { id: "umbra", label: "Umbra", seed: 58.9, warp: 1.9, speed: 0.22, scale: 1.55, emberMix: 0.55, glass: 1.0 },
];

// ── Shaders ────────────────────────────────────────────────────────────────

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uPointer;   // lerped pointer, -1..1
uniform vec3  uInk;       // --foreground
uniform vec3  uEmber;     // brand accent
uniform vec3  uVoid;      // --background
uniform float uSeed;
uniform float uWarp;
uniform float uSpeed;
uniform float uScale;
uniform float uEmberMix;
uniform float uGlass;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += amp * vnoise(p);
    p = rot * p * 2.03;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= uRes.x / max(uRes.y, 1.0);

  float R = 0.92;
  float d = length(uv);
  vec2 dir = d > 0.0001 ? uv / d : vec2(0.0);

  // Signed-distance shell: refraction profile hugging the boundary.
  float edge = smoothstep(R - 0.55, R, d);
  float refr = pow(edge, 2.2) * (0.30 + 0.45 * uGlass);

  float t = uTime * uSpeed;
  vec2 q = uv * uScale * 1.6 + uPointer * 0.22 - dir * refr;

  vec2 w = vec2(
    fbm(q + vec2(0.0, t) + uSeed),
    fbm(q + vec2(5.2, -t * 1.3) + uSeed * 1.7)
  );
  vec2 w2 = vec2(
    fbm(q + uWarp * w + vec2(1.7, 9.2) + t * 0.6),
    fbm(q + uWarp * w + vec2(8.3, 2.8) - t * 0.4)
  );
  float f = fbm(q + uWarp * w2);

  float v = smoothstep(0.25, 0.85, f);
  float band = smoothstep(0.35, 0.78, v);

  vec3 col = mix(uVoid, uInk, band * 0.85);
  float em = smoothstep(0.55, 0.95, w2.y) * uEmberMix;
  col = mix(col, uEmber, em * band * 0.9);

  // Fake sphere normal → diffuse + rim.
  float dn = clamp((d / R) / (d / R + 0.0001), 0.0, 1.0);
  float z = sqrt(max(0.0, 1.0 - min(1.0, dn * dn)));
  vec3 n = vec3(uv / R, z);
  vec3 L = normalize(vec3(-0.45, 0.6, 0.66));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  col *= 0.55 + 0.65 * diff;
  float rim = pow(1.0 - z, 2.5);
  col += rim * 0.32 * mix(uInk, vec3(1.0), 0.35);

  // Two directional edge lights (glass highlights).
  float l1 = pow(clamp(dot(n, normalize(vec3(-0.6, 0.75, 0.3))), 0.0, 1.0), 24.0);
  float l2 = pow(clamp(dot(n, normalize(vec3(0.7, -0.55, 0.28))), 0.0, 1.0), 30.0);
  col += (l1 * 0.5 + l2 * 0.35) * uGlass;

  // Cheap spectral separation where the shell bends the field most.
  float ca = refr * 0.55;
  col.r = mix(col.r, col.g, ca * 0.6);
  col.b = mix(col.b, col.g, ca * 0.35);

  float alpha = smoothstep(R + 0.005, R - 0.012, d);
  gl_FragColor = vec4(col, alpha);
}
`;

// ── GL helpers ─────────────────────────────────────────────────────────────

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("[LiquidOrb] shader compile failed:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

// ── Component ──────────────────────────────────────────────────────────────

export interface LiquidOrbProps {
  preset?: OrbPreset | string;
  /** Pointer-parallax interaction (disabled automatically for reduced motion). */
  interactive?: boolean;
  className?: string;
}

export function LiquidOrb({ preset = ORB_PRESETS[0], interactive = true, className }: LiquidOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const presetRef = useRef<OrbPreset>(
    typeof preset === "string" ? ORB_PRESETS.find((p) => p.id === preset) ?? ORB_PRESETS[0] : preset,
  );
  const interactiveRef = useRef(interactive);
  presetRef.current = typeof preset === "string" ? ORB_PRESETS.find((p) => p.id === preset) ?? ORB_PRESETS[0] : preset;
  interactiveRef.current = interactive;

  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Reduced-motion is a dependency: a mid-session OS pref flip remounts the
  // GL context and switches between the static frame and the live loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) {
      setFailed(true);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = vs && fs ? gl.createProgram() : null;
    if (!prog || !vs || !fs) {
      setFailed(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("[LiquidOrb] link failed:", gl.getProgramInfoLog(prog));
      setFailed(true);
      return;
    }
    gl.useProgram(prog);

    // Fullscreen triangle.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const U = (name: string) => gl.getUniformLocation(prog, name);
    const u = {
      res: U("uRes"), time: U("uTime"), pointer: U("uPointer"),
      ink: U("uInk"), ember: U("uEmber"), void_: U("uVoid"),
      seed: U("uSeed"), warp: U("uWarp"), speed: U("uSpeed"),
      scale: U("uScale"), emberMix: U("uEmberMix"), glass: U("uGlass"),
    };

    // Palette from CSS variables; re-read when the .dark class flips.
    let palette = readOrbPalette();

    let raf = 0;
    let visible = true;
    let disposed = false;
    const reducedRef = { current: reduced };

    const draw = (now: number) => {
      if (disposed) return;
      const p = presetRef.current;
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, now / 1000);
      gl.uniform2f(u.pointer, pointer.x, pointer.y);
      gl.uniform3fv(u.ink, palette.ink);
      gl.uniform3fv(u.ember, palette.ember);
      gl.uniform3fv(u.void_, palette.void_);
      gl.uniform1f(u.seed, p.seed);
      gl.uniform1f(u.warp, p.warp);
      gl.uniform1f(u.speed, p.speed);
      gl.uniform1f(u.scale, p.scale);
      gl.uniform1f(u.emberMix, p.emberMix);
      gl.uniform1f(u.glass, p.glass);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const themeObserver = new MutationObserver(() => {
      palette = readOrbPalette();
      if (reducedRef.current) draw(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Pointer parallax (lerped; ignored under reduced motion).
    const target = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      if (!interactiveRef.current || reducedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      target.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      target.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const owner = canvas.parentElement ?? canvas;
    owner.addEventListener("pointermove", onPointerMove);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = Math.max(1, Math.round((owner.clientWidth || canvas.clientWidth) * dpr));
      const h = Math.max(1, Math.round((owner.clientHeight || canvas.clientHeight) * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        if (reducedRef.current) draw(performance.now());
      }
    };

    const loop = (now: number) => {
      if (disposed) return;
      if (visible && !document.hidden) {
        pointer.x += (target.x - pointer.x) * 0.06;
        pointer.y += (target.y - pointer.y) * 0.06;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
    });
    io.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(owner);
    resize();

    if (reducedRef.current) {
      // Single static frame.
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      owner.removeEventListener("pointermove", onPointerMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // Preset/interactivity flow through refs so switching styles does not
    // recycle the GL context; reduced-motion intentionally remounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const fallbackStyle = useMemo(
    () => ({
      background:
        "radial-gradient(circle at 36% 32%, var(--foreground) 0%, color-mix(in oklab, var(--foreground) 35%, var(--background)) 34%, var(--background) 72%)",
    }),
    [],
  );

  if (failed) {
    return (
      <div
        aria-hidden
        className={cn("pointer-events-none size-full rounded-full", className)}
        style={fallbackStyle}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("block size-full", className)}
    />
  );
}

// ── Stage with preset switcher ─────────────────────────────────────────────

export function LiquidOrbStage({ className }: { className?: string }) {
  const [preset, setPreset] = useState(ORB_PRESETS[0].id);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative flex aspect-square w-full items-center justify-center rounded-full border border-border/70">
        <LiquidOrb preset={preset} className="absolute inset-0 rounded-full" />
      </div>
      <div
        role="group"
        aria-label="Estilo del orbe líquido"
        className="mt-4 flex flex-wrap items-center justify-center gap-1.5"
      >
        {ORB_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={preset === p.id}
            onClick={() => setPreset(p.id)}
            className={cn(
              "min-h-8 rounded-sm border px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
              preset === p.id
                ? "border-foreground/60 text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
