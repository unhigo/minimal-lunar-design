import{j as b}from"./framer-motion-DmE6IFl9.js";import{r as v}from"./react-vendor-Cq11W_rJ.js";import{c as k}from"./index-CTiHrZlk.js";function y(r){return typeof window>"u"||typeof document>"u"?"":getComputedStyle(document.documentElement).getPropertyValue(r).trim()}function A(r){const o=r.trim();if(!o)return null;const a=o.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.-]+)(?:deg)?\s*\)/i);if(a){let l=parseFloat(a[1]);a[1].endsWith("%")&&(l/=100);const s=parseFloat(a[2]),f=parseFloat(a[3])*Math.PI/180,m=Math.cos(f)*s,h=Math.sin(f)*s;return Y(l,m,h)}if(o.startsWith("#")){const l=o.slice(1),s=l.length===3?l.split("").map(f=>f+f).join(""):l.slice(0,6);return s.length!==6?null:[parseInt(s.slice(0,2),16)/255,parseInt(s.slice(2,4),16)/255,parseInt(s.slice(4,6),16)/255]}const t=o.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);return t?[Number(t[1])/255,Number(t[2])/255,Number(t[3])/255]:null}function Y(r,o,a){const t=r+.3963377774*o+.2158037573*a,l=r-.1055613458*o-.0638541728*a,s=r-.0894841775*o-1.291485548*a,f=t*t*t,m=l*l*l,h=s*s*s,P=4.0767416621*f-3.3077115913*m+.2309699292*h,_=-1.2684380046*f+2.6097574011*m-.3413193965*h,n=-.0041960863*f-.7034186147*m+1.707614701*h;return[q(P),q(_),q(n)]}function q(r){const o=Math.min(Math.max(r,0),1);return o<=.0031308?12.92*o:1.055*Math.pow(o,1/2.4)-.055}function V(){const r=typeof document<"u"&&document.documentElement.classList.contains("dark"),o=A(y("--foreground"))??[.96,.96,.96],a=A(y("--background"))??[.13,.13,.13],t=A(y("--ring"))??A(y("--destructive"))??[1,0,.2];return{ink:o,ember:t,void_:a,dark:r}}const g=[{id:"silica",label:"Silica",seed:3.1,warp:1.6,speed:.16,scale:1.35,emberMix:.12,glass:.9},{id:"ember",label:"Ember",seed:11.7,warp:2.1,speed:.3,scale:1.8,emberMix:.95,glass:.55},{id:"chrome",label:"Chrome",seed:27.4,warp:1.1,speed:.12,scale:2.3,emberMix:0,glass:.75},{id:"mare",label:"Mare",seed:41.2,warp:2.6,speed:.09,scale:1.05,emberMix:.35,glass:.4},{id:"umbra",label:"Umbra",seed:58.9,warp:1.9,speed:.22,scale:1.55,emberMix:.55,glass:1}],X=`
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`,K=`
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
`;function H(r,o,a){const t=r.createShader(o);return t?(r.shaderSource(t,a),r.compileShader(t),r.getShaderParameter(t,r.COMPILE_STATUS)?t:(console.warn("[LiquidOrb] shader compile failed:",r.getShaderInfoLog(t)),r.deleteShader(t),null)):null}function J({preset:r=g[0],interactive:o=!0,className:a}){const t=v.useRef(null),l=v.useRef(typeof r=="string"?g.find(n=>n.id===r)??g[0]:r),s=v.useRef(o);l.current=typeof r=="string"?g.find(n=>n.id===r)??g[0]:r,s.current=o;const[f,m]=v.useState(!1),[h,P]=v.useState(()=>typeof window<"u"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);v.useEffect(()=>{const n=window.matchMedia("(prefers-reduced-motion: reduce)"),e=()=>P(n.matches);return n.addEventListener("change",e),()=>n.removeEventListener("change",e)},[]),v.useEffect(()=>{const n=t.current;if(!n)return;const e=n.getContext("webgl",{alpha:!0,antialias:!0,premultipliedAlpha:!1});if(!e){m(!0);return}const L=H(e,e.VERTEX_SHADER,X),F=H(e,e.FRAGMENT_SHADER,K),p=L&&F?e.createProgram():null;if(!p||!L||!F){m(!0);return}if(e.attachShader(p,L),e.attachShader(p,F),e.linkProgram(p),!e.getProgramParameter(p,e.LINK_STATUS)){console.warn("[LiquidOrb] link failed:",e.getProgramInfoLog(p)),m(!0);return}e.useProgram(p);const D=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,D),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);const C=e.getAttribLocation(p,"aPos");e.enableVertexAttribArray(C),e.vertexAttribPointer(C,2,e.FLOAT,!1,0,0),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA);const u=c=>e.getUniformLocation(p,c),d={res:u("uRes"),time:u("uTime"),pointer:u("uPointer"),ink:u("uInk"),ember:u("uEmber"),void_:u("uVoid"),seed:u("uSeed"),warp:u("uWarp"),speed:u("uSpeed"),scale:u("uScale"),emberMix:u("uEmberMix"),glass:u("uGlass")};let R=V(),I=0,N=!0,T=!1;const S={current:h},E=c=>{if(T)return;const i=l.current;e.uniform2f(d.res,n.width,n.height),e.uniform1f(d.time,c/1e3),e.uniform2f(d.pointer,x.x,x.y),e.uniform3fv(d.ink,R.ink),e.uniform3fv(d.ember,R.ember),e.uniform3fv(d.void_,R.void_),e.uniform1f(d.seed,i.seed),e.uniform1f(d.warp,i.warp),e.uniform1f(d.speed,i.speed),e.uniform1f(d.scale,i.scale),e.uniform1f(d.emberMix,i.emberMix),e.uniform1f(d.glass,i.glass),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.drawArrays(e.TRIANGLES,0,3)},O=new MutationObserver(()=>{R=V(),S.current&&E(performance.now())});O.observe(document.documentElement,{attributes:!0,attributeFilter:["class"]});const M={x:0,y:0},x={x:0,y:0},U=c=>{if(!s.current||S.current)return;const i=n.getBoundingClientRect();M.x=(c.clientX-i.left)/i.width*2-1,M.y=-((c.clientY-i.top)/i.height*2-1)},w=n.parentElement??n;w.addEventListener("pointermove",U);const j=Math.min(window.devicePixelRatio||1,2),z=()=>{const c=Math.max(1,Math.round((w.clientWidth||n.clientWidth)*j)),i=Math.max(1,Math.round((w.clientHeight||n.clientHeight)*j));(n.width!==c||n.height!==i)&&(n.width=c,n.height=i,e.viewport(0,0,c,i),S.current&&E(performance.now()))},W=c=>{T||(N&&!document.hidden&&(x.x+=(M.x-x.x)*.06,x.y+=(M.y-x.y)*.06,E(c)),I=requestAnimationFrame(W))},B=new IntersectionObserver(c=>{N=c.some(i=>i.isIntersecting)});B.observe(n);const G=new ResizeObserver(z);return G.observe(w),z(),S.current?E(performance.now()):I=requestAnimationFrame(W),()=>{T=!0,cancelAnimationFrame(I),B.disconnect(),G.disconnect(),O.disconnect(),w.removeEventListener("pointermove",U)}},[h]);const _=v.useMemo(()=>({background:"radial-gradient(circle at 36% 32%, var(--foreground) 0%, color-mix(in oklab, var(--foreground) 35%, var(--background)) 34%, var(--background) 72%)"}),[]);return f?b.jsx("div",{"aria-hidden":!0,className:k("pointer-events-none size-full rounded-full",a),style:_}):b.jsx("canvas",{ref:t,"aria-hidden":!0,className:k("block size-full",a)})}function ee({className:r}){const[o,a]=v.useState(g[0].id);return b.jsxs("div",{className:k("flex flex-col items-center",r),children:[b.jsx("div",{className:"relative flex aspect-square w-full items-center justify-center rounded-full border border-border/70",children:b.jsx(J,{preset:o,className:"absolute inset-0 rounded-full"})}),b.jsx("div",{role:"group","aria-label":"Estilo del orbe líquido",className:"mt-4 flex flex-wrap items-center justify-center gap-1.5",children:g.map(t=>b.jsx("button",{type:"button","aria-pressed":o===t.id,onClick:()=>a(t.id),className:k("min-h-8 rounded-sm border px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",o===t.id?"border-foreground/60 text-foreground":"border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"),children:t.label},t.id))})]})}export{ee as L,J as a};
