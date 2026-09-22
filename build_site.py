#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_site.py — Convierte el directorio monolítico (index.html) en un sitio
multi-página estático: 1 portada + 16 artículos (1 URL real por herramienta).

Uso:
    python build_site.py

Requisitos:
  - Este script colocado JUNTO a tu index.html monolítico final
    (el de tarjetas + 16 artículos + ASSET_DB).
  - Solo librería estándar de Python. Sin dependencias.

Resultado (carpeta site/):
    site/index.html                  → directorio con tarjetas
    site/articulos/<slug>.html       → 16 artículos de blog independientes
    site/assets/style.css            → estilos (extraídos del original)
    site/sitemap.xml                 → mapa del sitio para buscadores
"""

import html
import json
import re
import sys
from pathlib import Path
from string import Template

# ── Configuración ──────────────────────────────────────────────────────────
SRC      = Path("index.html")     # archivo fuente (versión monolítica final)
OUT      = Path("site")           # carpeta de salida
SITE_URL = ""                     # ej. "https://tudominio.com" (sin / final)
                                  # Vacío = sitemap con rutas relativas

# ── Extracción de bloques JS del archivo fuente ───────────────────────────

def find_block(text: str, name: str):
    """Localiza  const NAME = {...|...};  y devuelve el literal completo,
    respetando strings (para no cortar dentro de comillas)."""
    m = re.search(rf"const\s+{name}\s*=\s*", text)
    if not m:
        return None
    i = m.end()
    open_ch, close_ch = text[i], ("]" if text[i] == "[" else "}")
    depth, in_str, esc = 0, False, False
    for j in range(i, len(text)):
        c = text[j]
        if in_str:
            if esc:                esc = False
            elif c == "\\":        esc = True
            elif c == '"':         in_str = False
        elif c == '"':             in_str = True
        elif c == open_ch:         depth += 1
        elif c == close_ch:
            depth -= 1
            if depth == 0:
                return text[i:j + 1]
    raise SystemExit(f"[x] El bloque '{name}' no está cerrado en {SRC}.")

KEY_RE = re.compile(r"([{,]\s*)([A-Za-z_]\w*)\s*:")

def js_to_json(s: str) -> str:
    """Objeto JS (claves sin comillas) → JSON válido, sin tocar los strings.
    Elimina también comentarios de línea // fuera de strings."""
    s = re.sub(r"(?m)^\s*//.*$", "", s)
    out, i, n, in_str, esc = [], 0, len(s), False, False
    while i < n:
        c = s[i]
        if in_str:
            out.append(c)
            if esc:            esc = False
            elif c == "\\":    esc = True
            elif c == '"':     in_str = False
            i += 1
            continue
        if c == '"':
            in_str = True; out.append(c); i += 1; continue
        m = KEY_RE.match(s, i)
        if m:
            out.append(f'{m.group(1)}"{m.group(2)}":')
            i = m.end()
            continue
        out.append(c); i += 1
    return "".join(out)

# ── Utilidades ─────────────────────────────────────────────────────────────

def slugify(s: str) -> str:
    """Slug ASCII: minúsculas, guiones, sin acentos (para URLs limpias)."""
    MAP = {"á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ü": "u",
           "ñ": "n", "à": "a", "è": "e", "ì": "i", "ò": "o", "ù": "u",
           "ç": "c", "â": "a", "ê": "e", "î": "i", "ô": "o", "û": "u"}
    s = "".join(MAP.get(ch, ch) for ch in s.lower())
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "articulo"

def parse_items(raw, kind: str) -> list:
    """Convierte un literal JS en lista de dicts. Los objetos JSON puros
    se interpretan directamente; arrays de strings se tratan como nombres
    (o pares "Titulo|URL") según el tipo de bloque."""
    if raw is None:
        return []
    data = json.loads(js_to_json(raw))
    if isinstance(data, dict):                    # objeto tipo slug → item
        items = []
        for k, v in data.items():
            item = dict(v) if isinstance(v, dict) else {"name": str(v)}
            item.setdefault("slug", k)
            items.append(item)
        return items
    if data and isinstance(data[0], str):         # array de strings
        items = []
        for s in data:
            if "|" in s:
                name, url = s.split("|", 1)
                items.append({"name": name.strip(), "url": url.strip()})
            else:
                items.append({"name": s.strip()})
        return items
    return data

def base(href: str, depth: int) -> str:
    """Href relativo desde la página actual (depth 0 = raíz, 1 = /articulos/)."""
    if href.startswith(("http://", "https://", "mailto:", "#")):
        return href
    prefix = "../" * depth
    return prefix + href

# ── Plantillas (mismo estilo: fondo #070709, acento violeta #8b5cf6) ──────

CSS = """:root{--bg:#070709;--card:#111113;--line:#27272a;--txt:#ededed;--mut:#a1a1aa;--acc:#8b5cf6}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.6 -apple-system,"Segoe UI",Inter,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:960px;margin:0 auto;padding:0 1.25rem}
header.site{border-bottom:1px solid var(--line);background:rgba(7,7,9,.9);position:sticky;top:0;z-index:10}
header.site .wrap{display:flex;align-items:center;justify-content:space-between;height:64px;gap:1rem}
.brand{color:var(--txt);font-weight:700;letter-spacing:.02em}
.brand:hover{text-decoration:none}
nav.crumbs{font-size:.85rem;color:var(--mut);margin:1.5rem 0 .5rem}
h1{font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.15;margin:.5rem 0 1rem}
h2{font-size:1.35rem;margin:2.5rem 0 .75rem;border-left:3px solid var(--acc);padding-left:.6rem}
.lead{color:var(--mut);font-size:1.05rem;max-width:60ch}
.meta{font-size:.85rem;color:var(--mut);display:flex;gap:1rem;flex-wrap:wrap;margin:0 0 2rem}
.meta .chip{border:1px solid var(--line);border-radius:999px;padding:.15rem .6rem}
section.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1rem;margin:2rem 0}
article.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1.25rem;display:flex;flex-direction:column;gap:.5rem;transition:border-color .2s,transform .2s}
article.card:hover{border-color:var(--acc);transform:translateY(-2px)}
article.card h3{margin:0;font-size:1.1rem}
article.card h3 a{color:var(--txt)}
article.card p{margin:0;color:var(--mut);font-size:.92rem;flex:1}
article.card .go{font-size:.85rem}
section.prose{max-width:70ch;margin:0 auto}
section.prose img{max-width:100%;border-radius:10px;border:1px solid var(--line)}
section.prose ol,section.prose ul{padding-left:1.4rem}
section.prose li{margin:.35rem 0}
.step{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1rem 1.25rem;margin:1rem 0}
.step b{color:var(--acc)}
.faq{border-bottom:1px solid var(--line);padding:1rem 0}
.faq h3{margin:0 0 .35rem;font-size:1.05rem}
.faq p{margin:0;color:var(--mut)}
.back{display:inline-block;margin:2.5rem 0;border:1px solid var(--line);border-radius:999px;padding:.5rem 1.1rem;color:var(--txt);font-size:.9rem}
.back:hover{border-color:var(--acc);text-decoration:none}
footer.site{border-top:1px solid var(--line);margin-top:4rem;padding:2rem 0 3rem;color:var(--mut);font-size:.9rem}
footer.site .wrap{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}
@media print{header.site,footer.site,.back{display:none}}
"""

PAGE_T = Template("""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$title</title>
<meta name="description" content="$desc">
$canonical
<meta property="og:title" content="$title">
<meta property="og:description" content="$desc">
<meta property="og:type" content="$ogtype">
<link rel="stylesheet" href="$css">
</head>
<body>
<header class="site"><div class="wrap">
  <a class="brand" href="$home">$brand</a>
  <a href="$home" style="font-size:.9rem">Ver directorio</a>
</div></header>
<main>
$body
</main>
<footer class="site"><div class="wrap">
  <span>© $year $brand — Guías y recursos de edición y diseño.</span>
  <span><a href="$sitemap_rel">sitemap.xml</a></span>
</div></footer>
</body>
</html>
""")

# ── Render: portada y artículos ────────────────────────────────────────────

def render_home(items) -> str:
    cards = []
    for it in items:
        slug = it.get("slug") or slugify(it.get("name", "articulo"))
        href = f"articulos/{slug}.html"
        cards.append(
            f'<article class="card">\n'
            f'  <h3><a href="{html.escape(href)}">{html.escape(it.get("name", ""))}</a></h3>\n'
            f'  <p>{html.escape(it.get("summary") or it.get("desc") or "")}</p>\n'
            f'  <span class="go">Leer guía →</span>\n'
            f'</article>'
        )
    body = f"""<div class="wrap">
  <nav class="crumbs">Inicio</nav>
  <h1>Directorio de herramientas de edición y diseño</h1>
  <p class="lead">Guías prácticas paso a paso para sacar el máximo partido a cada herramienta: qué hace, cómo se usa y cuándo elegir cada alternativa.</p>
  <section class="card-grid">
{chr(10).join(cards)}
  </section>
</div>"""
    return body

def render_article(it) -> str:
    name  = it.get("name", "")
    steps = it.get("steps") or []
    faqs  = it.get("faqs") or []
    url   = it.get("url", "")

    steps_html = "".join(
        f'    <div class="step"><b>Paso {n}.</b> {html.escape(s)}</div>\n'
        for n, s in enumerate(steps, 1)
    ) or "    <div class='step'>Aún no hay pasos para esta herramienta.</div>\n"

    faqs_html = "".join(
        f'  <div class="faq">\n    <h3>{html.escape(q)}</h3>\n    <p>{html.escape(a)}</p>\n  </div>\n'
        for q, a in faqs
    )
    faq_block = f"  <h2>Preguntas frecuentes</h2>\n{faqs_html}" if faqs else ""

    link_block = (
        f'  <h2>Acceso</h2>\n  <p>Entra en <a href="{html.escape(url, True)}" rel="noopener nofollow" target="_blank">{html.escape(url)}</a></p>\n'
        if url else ""
    )

    return f"""<div class="wrap">
  <nav class="crumbs"><a href="../">Inicio</a> › {html.escape(name)}</nav>
  <article class="prose">
    <h1>{html.escape(name)}</h1>
    <p class="meta"><span class="chip">Guía</span><span>{len(steps)} pasos</span></p>
    <p class="lead">{html.escape(it.get("summary") or it.get("desc") or "")}</p>
    <h2>Cómo usarla, paso a paso</h2>
{steps_html}{link_block}{faq_block}
  </article>
  <a class="back" href="../">← Volver al directorio</a>
</div>"""

# ── Sitemap ────────────────────────────────────────────────────────────────

def build_sitemap(paths) -> str:
    rows = []
    for p, prio in paths:
        loc = f"{SITE_URL}/{p}" if SITE_URL else f"/{p}"
        rows.append(
            "  <url>\n"
            f"    <loc>{html.escape(loc, True)}</loc>\n"
            f"    <priority>{prio}</priority>\n"
            "  </url>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(rows) + "\n</urlset>\n"
    )

# ── Ensamblado ─────────────────────────────────────────────────────────────

def page(title, desc, body, css_rel, home_rel, depth, ogtype="website") -> str:
    canonical = ""
    if SITE_URL:
        loc = "/" if depth == 0 else "/articulos/"
        canonical = f'<link rel="canonical" href="{SITE_URL}{loc}">'
    return PAGE_T.substitute(
        title=html.escape(title),
        desc=html.escape(desc),
        canonical=canonical,
        ogtype=ogtype,
        css=css_rel,
        home=home_rel,
        brand="MOONØ.LAB™",
        year=__import__("datetime").date.today().year,
        sitemap_rel=base("sitemap.xml", depth),
        body=body,
    )

def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"[x] No encuentro {SRC}. Coloca este script junto a tu index.html monolítico.")

    text = SRC.read_text(encoding="utf-8")

    # 1) Extraer los datos del monolito. La lista de artículos y el ASSET_DB
    #    se leen tal cual; ajusta los nombres si tu archivo usa otros.
    items = parse_items(find_block(text, "ARTICLES"), "ARTICLES")
    if not items:
        raise SystemExit("[x] No se encontró const ARTICLES = [...] en el fuente.")

    # 2) Estructura de carpetas
    (OUT / "articulos").mkdir(parents=True, exist_ok=True)
    (OUT / "assets").mkdir(parents=True, exist_ok=True)
    (OUT / "assets" / "style.css").write_text(CSS, encoding="utf-8")

    # 3) Portada
    (OUT / "index.html").write_text(
        page("MOONØ.LAB™ — Directorio de herramientas de edición y diseño",
             "Guías paso a paso de herramientas de edición y diseño.",
             render_home(items), "assets/style.css", "index.html", 0),
        encoding="utf-8",
    )

    # 4) Artículos (1 URL real por herramienta)
    sitemap = [("", "1.0")]
    for it in items:
        slug = it.get("slug") or slugify(it.get("name", "articulo"))
        it["slug"] = slug
        name = it.get("name", slug)
        (OUT / "articulos" / f"{slug}.html").write_text(
            page(f"{name} — Guía paso a paso | MOONØ.LAB™",
                 it.get("summary") or it.get("desc") or f"Cómo usar {name} paso a paso.",
                 render_article(it), "../assets/style.css", "../index.html", 1, ogtype="article"),
            encoding="utf-8",
        )
        sitemap.append((f"articulos/{slug}.html", "0.8"))

    # 5) Sitemap
    (OUT / "sitemap.xml").write_text(build_sitemap(sitemap), encoding="utf-8")

    print(f"[ok] Sitio generado en {OUT}/ — {1 + len(items)} páginas "
          f"(portada + {len(items)} artículos) + sitemap.xml")

if __name__ == "__main__":
    main()
