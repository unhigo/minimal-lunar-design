/**
 * Navigation manifest — MOONØ.LAB.
 *
 * One source of truth for the menubar (desktop) and the mobile panel: every
 * page, subpage, category and subcategory of the lab, reorganized into five
 * sections. All links point at existing routes; query params map to the real
 * filters each page honors:
 *
 * · /discover?q=      → global search (Discover reads `q`)
 * · /directory?s=     → directory section (see Directory deep-link wiring)
 * · /inspiration?tag= → inspiration category filter
 * · /catalog?cat=     → catalog category filter
 */

export interface NavLinkDef {
  label: string;
  to: string;
  /** Right-aligned mono hint (usually the route). */
  hint?: string;
}

/** A flyout submenu inside a group (shadcn menubar-04 pattern). */
export interface NavSubDef {
  label: string;
  links: NavLinkDef[];
}

export interface NavGroupDef {
  label: string;
  links: NavLinkDef[];
  subs?: NavSubDef[];
}

export interface NavSectionDef {
  id: string;
  label: string;
  groups: NavGroupDef[];
}

/**
 * Does `href` cover the current `pathname`? Exact match, or the pathname
 * lives *under* the link (prefix + "/") — so a second-segment link like
 * /tools/:slug lights the section that owns /tools, while sibling routes
 * (/tools vs /tools-archive) never cross-light. Query strings are ignored.
 */
export function isNavPathActive(pathname: string, href: string): boolean {
  const base = href.split("?")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

const DIRECTORY_SECTIONS: NavLinkDef[] = [
  { label: "Ver todo el directorio", to: "/directory", hint: "/directory" },
  { label: "Tools", to: "/directory?s=tools" },
  { label: "Resources", to: "/directory?s=resources" },
  { label: "Framer", to: "/directory?s=framer" },
  { label: "Inspiration", to: "/directory?s=inspiration" },
];

const INSPIRATION_CATEGORIES: NavLinkDef[] = [
  { label: "Todas las categorías", to: "/inspiration", hint: "/inspiration" },
  { label: "Web", to: "/inspiration?tag=web" },
  { label: "UI", to: "/inspiration?tag=ui" },
  { label: "UX", to: "/inspiration?tag=ux" },
  { label: "Branding", to: "/inspiration?tag=branding" },
  { label: "Tipografía", to: "/inspiration?tag=tipografía" },
  { label: "Motion", to: "/inspiration?tag=motion" },
  { label: "3D", to: "/inspiration?tag=3d" },
  { label: "Ilustración", to: "/inspiration?tag=ilustración" },
  { label: "Fotografía", to: "/inspiration?tag=fotografía" },
  { label: "Arte digital", to: "/inspiration?tag=arte digital" },
];

const CATALOG_CATEGORIES: NavLinkDef[] = [
  { label: "Todos los recursos", to: "/catalog", hint: "/catalog" },
  { label: "Mockups", to: "/catalog?cat=mockups" },
  { label: "Fuentes", to: "/catalog?cat=fuentes" },
  { label: "Iconos", to: "/catalog?cat=iconos" },
  { label: "Texturas", to: "/catalog?cat=texturas" },
  { label: "Plantillas", to: "/catalog?cat=plantillas" },
  { label: "3D", to: "/catalog?cat=3d" },
  { label: "Fotografía", to: "/catalog?cat=fotografia" },
  { label: "Ilustración", to: "/catalog?cat=ilustracion" },
];

export const NAV_SECTIONS: NavSectionDef[] = [
  {
    id: "secciones",
    label: "Secciones",
    groups: [
      {
        label: "Laboratorio",
        links: [
          { label: "Inicio", to: "/", hint: "/" },
          { label: "Lab — UI generativa", to: "/lab", hint: "/lab" },
          { label: "Estudio lunar", to: "/studio", hint: "/studio" },
        ],
      },
      {
        label: "Comunidad",
        links: [
          { label: "Proyectos", to: "/projects", hint: "/projects" },
          { label: "Creadores", to: "/creators", hint: "/creators" },
          { label: "Artículos", to: "/articles", hint: "/articles" },
          { label: "Colecciones", to: "/collections", hint: "/collections" },
          { label: "Enviar propuesta", to: "/submit", hint: "/submit" },
        ],
      },
      {
        label: "Tu espacio",
        links: [
          { label: "Mi espacio", to: "/dashboard", hint: "/dashboard" },
          { label: "Publicar recurso", to: "/upload", hint: "/upload" },
          { label: "Administración", to: "/admin", hint: "/admin" },
        ],
      },
    ],
  },
  {
    id: "explorar",
    label: "Explorar",
    groups: [
      {
        label: "Discover — búsqueda global",
        links: [
          { label: "Buscar todo", to: "/discover", hint: "/discover" },
          { label: "Luna", to: "/discover?q=luna" },
          { label: "Mapa", to: "/discover?q=mapa" },
          { label: "Color", to: "/discover?q=color" },
          { label: "Figma", to: "/discover?q=figma" },
        ],
        subs: [
          {
            label: "Directorio — 224 entradas",
            links: DIRECTORY_SECTIONS,
          },
          {
            label: "Inspiración — categorías",
            links: INSPIRATION_CATEGORIES,
          },
        ],
      },
    ],
  },
  {
    id: "catalogo",
    label: "Catálogo",
    groups: [
      {
        label: "Recursos",
        links: CATALOG_CATEGORIES,
      },
      {
        label: "Herramientas",
        links: [
          { label: "Directorio de herramientas", to: "/tools", hint: "/tools" },
          { label: "Enviar herramienta", to: "/submit" },
        ],
      },
    ],
  },
  {
    id: "comunidad",
    label: "Comunidad",
    groups: [
      {
        label: "Publica",
        links: [
          { label: "Enviar herramienta", to: "/submit", hint: "/submit" },
          { label: "Publicar recurso", to: "/upload", hint: "/upload" },
        ],
      },
      {
        label: "Sigue el trabajo",
        links: [
          { label: "Proyectos", to: "/projects", hint: "/projects" },
          { label: "Creadores", to: "/creators", hint: "/creators" },
          { label: "Artículos", to: "/articles", hint: "/articles" },
          { label: "Colecciones", to: "/collections", hint: "/collections" },
          { label: "Lab — UI generativa", to: "/lab", hint: "/lab" },
        ],
      },
    ],
  },
  {
    id: "estudio",
    label: "Estudio",
    groups: [
      {
        label: "Herramientas del laboratorio",
        links: [
          { label: "Estudio lunar", to: "/studio", hint: "/studio" },
          { label: "Lab — UI generativa", to: "/lab", hint: "/lab" },
          { label: "Mi espacio", to: "/dashboard", hint: "/dashboard" },
          { label: "Publicar recurso", to: "/upload", hint: "/upload" },
          { label: "Administración", to: "/admin", hint: "/admin" },
        ],
      },
    ],
  },
];
