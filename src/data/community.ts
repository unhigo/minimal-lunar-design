/**
 * Community data layer: creators, projects and articles.
 *
 * MVP: static demo content, every entry marked `demo: true` so the UI can
 * label it honestly. Projects and articles reference real tools by their
 * slugs in `@/data/tools`, which powers the interlinking graph
 * (tool ↔ project ↔ creator ↔ article). Shapes mirror the future database
 * models so the UI can migrate to a backend without rewrites.
 *
 * No real names, portfolios or metrics are invented: creators are demo
 * personas, and no like/view counters exist.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const CREATOR_TYPES = [
  "estudio",
  "diseño",
  "desarrollo",
  "ilustración",
  "fotografía",
  "3d",
  "motion",
] as const;

export type CreatorType = (typeof CREATOR_TYPES)[number];

export interface Creator {
  id: string;
  slug: string;
  name: string;
  username: string;
  type: CreatorType;
  bio: string;
  location: string;
  skills: string[];
  /** Tool slugs this creator works with (interlinking with /tools). */
  tools: string[];
  demo: true;
}

export const PROJECT_CATEGORIES = [
  "web",
  "identidad",
  "producto",
  "editorial",
  "app",
  "3d",
  "fotografía",
  "motion",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  story: string;
  category: ProjectCategory;
  tags: string[];
  /** Tool slugs used in this project (interlinking with /tools/:slug). */
  tools: string[];
  creatorSlug: string;
  year: number;
  /** Deterministic abstract cover (no external images in the MVP). */
  gradient: string;
  aspect: "4/3" | "1/1" | "3/4" | "16/9";
  demo: true;
}

export const ARTICLE_CATEGORIES = [
  "diseño",
  "tecnología",
  "ia",
  "ux",
  "tipografía",
  "branding",
  "herramientas",
  "recursos",
  "fotografía",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Paragraphs, in order. */
  body: string[];
  authorSlug: string;
  category: ArticleCategory;
  /** ISO date, e.g. "2026-08-12". */
  date: string;
  readingMinutes: number;
  tags: string[];
  relatedToolSlugs: string[];
  demo: true;
}

// ---------------------------------------------------------------------------
// Seeds
// ---------------------------------------------------------------------------

const G = {
  moonlight: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  dust: "linear-gradient(160deg, #2b2b33 0%, #3d3d4a 45%, #101014 100%)",
  eclipse: "linear-gradient(150deg, #0b0b10 0%, #1f1f27 55%, #2c2c36 100%)",
  terra: "linear-gradient(140deg, #16211c 0%, #22332a 50%, #0d1411 100%)",
  ember: "linear-gradient(145deg, #241a12 0%, #3d2c1c 50%, #120d08 100%)",
  sea: "linear-gradient(155deg, #0e1c24 0%, #16303e 55%, #090f14 100%)",
  violetDusk: "linear-gradient(150deg, #1c1724 0%, #2e2440 50%, #0f0c14 100%)",
  bone: "linear-gradient(140deg, #232320 0%, #37372f 50%, #121210 100%)",
  chrome: "linear-gradient(135deg, #1e2226 0%, #30373d 45%, #0c0e10 100%)",
  crimson: "linear-gradient(150deg, #251214 0%, #3c1e20 50%, #10080a 100%)",
} as const;

type CreatorSeed = Omit<Creator, "demo">;
type ProjectSeed = Omit<Project, "demo">;
type ArticleSeed = Omit<Article, "demo">;

const CREATORS_SEED: CreatorSeed[] = [
  {
    id: "c-01",
    slug: "estudio-demo-norte",
    name: "Estudio Demo Norte",
    username: "@studiodemonorte",
    type: "estudio",
    bio: "Estudio ficticio de identidad y editorial, creado como contenido de demostración de la plataforma.",
    location: "Madrid, España",
    skills: ["identidad", "editorial", "web"],
    tools: ["figma", "google-fonts", "coolors"],
  },
  {
    id: "c-02",
    slug: "lucia-demo",
    name: "Lucía Demo",
    username: "@luciademo",
    type: "diseño",
    bio: "Diseñadora de producto ficticia especializada en sistemas de diseño e iconografía.",
    location: "Barcelona, España",
    skills: ["ui", "design systems", "iconografía"],
    tools: ["figma", "lucide", "penpot"],
  },
  {
    id: "c-03",
    slug: "marco-demo",
    name: "Marco Demo",
    username: "@marcodemo",
    type: "desarrollo",
    bio: "Desarrollador front-end ficticio interesado en rendimiento y accesibilidad.",
    location: "Ciudad de México, México",
    skills: ["react", "performance", "accesibilidad"],
    tools: ["squoosh", "json-crack", "ray-so"],
  },
  {
    id: "c-04",
    slug: "ana-demo",
    name: "Ana Demo",
    username: "@anademo",
    type: "ilustración",
    bio: "Ilustradora ficticia de texturas y materia, entre lo analógico y lo digital.",
    location: "Bogotá, Colombia",
    skills: ["ilustración", "textura", "portadas"],
    tools: ["eagle", "photomosh"],
  },
  {
    id: "c-05",
    slug: "estudio-demo-sur",
    name: "Estudio Demo Sur",
    username: "@studiodemosur",
    type: "3d",
    bio: "Estudio ficticio de 3D y motion para producto y marca.",
    location: "Buenos Aires, Argentina",
    skills: ["3d", "motion", "render"],
    tools: ["spline", "blender"],
  },
  {
    id: "c-06",
    slug: "david-demo",
    name: "David Demo",
    username: "@daviddemo",
    type: "fotografía",
    bio: "Fotógrafo nocturno ficticio: larga exposición, luna y paisaje urbano.",
    location: "Sevilla, España",
    skills: ["nocturna", "larga exposición", "editorial"],
    tools: ["photo-pill", "stellarium-web", "remove-bg"],
  },
  {
    id: "c-07",
    slug: "sara-demo",
    name: "Sara Demo",
    username: "@sarademo",
    type: "motion",
    bio: "Motion designer ficticia enfocada en identidad cinética y micro-interacciones.",
    location: "Ciudad de Guatemala, Guatemala",
    skills: ["kinético", "micro-interacciones", "loops"],
    tools: ["spline", "photomosh"],
  },
  {
    id: "c-08",
    slug: "pablo-demo",
    name: "Pablo Demo",
    username: "@pablodemo",
    type: "diseño",
    bio: "Diseñador tipográfico ficticio, entre la fundición y la web.",
    location: "Valparaíso, Chile",
    skills: ["tipografía", "pares", "editorial"],
    tools: ["google-fonts", "fontshare", "typewolf"],
  },
];

const PROJECTS_SEED: ProjectSeed[] = [
  {
    id: "p-01",
    slug: "orbital-saas",
    title: "Orbital — plataforma SaaS",
    description:
      "Interfaz y sistema visual ficticio para una plataforma de datos astronómicos.",
    story:
      "Proyecto demo que recorre el proceso completo: wireframes, paleta sobre maqueta real con Realtime Colors y entrega en Figma. Sirve para mostrar cómo una ficha de proyecto enlaza herramientas, creador y artículos relacionados.",
    category: "web",
    tags: ["saas", "dashboard", "dark"],
    tools: ["figma", "realtime-colors"],
    creatorSlug: "estudio-demo-norte",
    year: 2026,
    gradient: G.moonlight,
    aspect: "16/9",
  },
  {
    id: "p-02",
    slug: "cuaderno-tipografico",
    title: "Cuaderno tipográfico",
    description:
      "Editorial ficticio que documenta pares tipográficos con fuentes libres.",
    story:
      "Pieza demo compuesta íntegramente con tipografías de Google Fonts y Fontshare, explorando jerarquías, escalas y pares serif/sans para uso editorial en pantalla.",
    category: "editorial",
    tags: ["tipografía", "pares", "editorial"],
    tools: ["google-fonts", "fontshare"],
    creatorSlug: "pablo-demo",
    year: 2025,
    gradient: G.bone,
    aspect: "3/4",
  },
  {
    id: "p-03",
    slug: "atlas-nocturno",
    title: "Atlas nocturno — fotolibro",
    description:
      "Fotolibro ficticio de paisaje nocturno planificado con efemérides de sol y luna.",
    story:
      "Serie demo donde cada toma se planificó con PhotoPills y Stellarium Web antes de salir: fase lunar, hora azul y trayectoria. El flujo de exportación pasa por Squoosh para equilibrar peso y calidad.",
    category: "fotografía",
    tags: ["nocturna", "luna", "editorial"],
    tools: ["photo-pill", "squoosh"],
    creatorSlug: "david-demo",
    year: 2025,
    gradient: G.sea,
    aspect: "4/3",
  },
  {
    id: "p-04",
    slug: "pulsar-podcast",
    title: "Pulsar — identidad de podcast",
    description:
      "Identidad ficticia para un podcast de ciencia, construida sobre una paleta restrictiva.",
    story:
      "Ejercicio demo de marca sonora y visual: la paleta se generó con Coolors y se verificó con las reglas de armonía de Adobe Color antes de fijar el sistema.",
    category: "identidad",
    tags: ["marca", "paleta", "audio"],
    tools: ["coolors", "adobe-color"],
    creatorSlug: "estudio-demo-sur",
    year: 2026,
    gradient: G.ember,
    aspect: "1/1",
  },
  {
    id: "p-05",
    slug: "umbral-posters",
    title: "Umbral — tienda de pósters",
    description:
      "Tienda de una página ficticia con catálogo reducido y foco tipográfico.",
    story:
      "Demo de comercio ligero: el diseño se trabaja en Figma y Penpot para comparar flujos open source y propietarios, y las imágenes de producto se optimizan con Squoosh antes de publicar.",
    category: "web",
    tags: ["e-commerce", "landing", "tipografía"],
    tools: ["figma", "penpot", "squoosh"],
    creatorSlug: "lucia-demo",
    year: 2026,
    gradient: G.dust,
    aspect: "4/3",
  },
  {
    id: "p-06",
    slug: "gres-renders",
    title: "Gres — renders de producto",
    description:
      "Serie de renders ficticia de cerámica con materiales mate y luz de estudio.",
    story:
      "Demo 3D: modelado rápido y materiales en Spline, con una pasada de calidad en Blender para el render final. Muestra cómo se enlazan herramientas de 3D con proyectos y creadores del directorio.",
    category: "3d",
    tags: ["producto", "cerámica", "render"],
    tools: ["spline", "blender"],
    creatorSlug: "estudio-demo-sur",
    year: 2025,
    gradient: G.chrome,
    aspect: "4/3",
  },
  {
    id: "p-07",
    slug: "bruma-kit-iconos",
    title: "Bruma — kit de iconos",
    description:
      "Sistema de iconos ficticio de trazo fino sobre retícula de 24 px.",
    story:
      "Ejercicio demo de iconografía: se dibuja sobre la retícula de Lucide y se revisa la cobertura conceptual comparando con Iconify antes de cerrar el set.",
    category: "producto",
    tags: ["iconos", "sistema", "svg"],
    tools: ["figma", "lucide", "iconify"],
    creatorSlug: "lucia-demo",
    year: 2025,
    gradient: G.dust,
    aspect: "1/1",
  },
  {
    id: "p-08",
    slug: "ruido-generativo",
    title: "Ruido — instalación generativa",
    description:
      "Pieza audiovisual ficticia que genera texturas de glitch en tiempo real.",
    story:
      "Demo de arte generativo: las texturas se prueban en Photomosh y los fotogramas de documentación se presentan con marcos de ray.so. Pensado para enlazar herramientas de imagen con motion.",
    category: "motion",
    tags: ["generativo", "glitch", "instalación"],
    tools: ["photomosh", "ray-so"],
    creatorSlug: "marco-demo",
    year: 2026,
    gradient: G.violetDusk,
    aspect: "16/9",
  },
  {
    id: "p-09",
    slug: "cartografia-de-humo",
    title: "Cartografía de humo — serie",
    description:
      "Serie ilustrada ficticia sobre niebla, grano y memoria.",
    story:
      "Serie demo de ilustración y textura: la biblioteca de referencias se organiza en Eagle y los tratamientos de distorsión se exploran en Photomosh antes del acabado final.",
    category: "editorial",
    tags: ["ilustración", "textura", "serie"],
    tools: ["eagle", "photomosh"],
    creatorSlug: "ana-demo",
    year: 2024,
    gradient: G.crimson,
    aspect: "3/4",
  },
  {
    id: "p-10",
    slug: "tempo-microinteracciones",
    title: "Tempo — micro-interacciones",
    description:
      "Colección ficticia de micro-interacciones para interfaces de música.",
    story:
      "Demo de motion UI: prototipos de transiciones y estados hechos en Figma, con escenas 3D ligeras embebidas desde Spline para el reproductor.",
    category: "motion",
    tags: ["micro", "música", "prototipo"],
    tools: ["figma", "spline"],
    creatorSlug: "sara-demo",
    year: 2026,
    gradient: G.eclipse,
    aspect: "1/1",
  },
];

const ARTICLES_SEED: ArticleSeed[] = [
  {
    id: "a-01",
    slug: "licencias-recursos-diseno",
    title: "Guía mínima de licencias para recursos de diseño",
    excerpt:
      "Qué significa realmente «gratis» en un mockup o una fuente, y las cuatro preguntas que conviene hacerse antes de usar cualquier recurso ajeno.",
    body: [
      "Un recurso gratuito no es lo mismo que un recurso libre. La mayoría de mockups, fuentes y texturas que circulan por directorios tienen una licencia concreta que define dónde y cómo puedes usarlos.",
      "Las cuatro preguntas mínimas: ¿puedo usarlo en proyectos comerciales?, ¿puedo redistribuirlo o modificarlo?, ¿debo atribuir al autor?, ¿hay límite de unidades o de audiencia? Si la web del recurso no responde a las cuatro, asume que no está claro y busca la licencia original.",
      "Los directorios que verifican licencias —como los que agregan mockups gratuitos o iconos de creadores— ayudan, pero siempre enlazan a un origen que conviene revisar. En el caso de iconos por unidades, la licencia puede cambiar de un icono al siguiente.",
      "Regla práctica para este catálogo: cada recurso de la comunidad declara su precio y su origen, y la verificación de la licencia es responsabilidad de quien publica. Esta guía es contenido demo y no sustituye asesoría legal.",
    ],
    authorSlug: "lucia-demo",
    category: "recursos",
    date: "2026-08-12",
    readingMinutes: 6,
    tags: ["licencias", "recursos", "gratis"],
    relatedToolSlugs: ["unblast", "noun-project"],
  },
  {
    id: "a-02",
    slug: "paleta-sin-gradiente",
    title: "Cómo elegir una paleta sin caer en el gradiente",
    excerpt:
      "Generar una paleta es fácil; que funcione en contexto es otra historia. Un método corto para decidir con la interfaz delante.",
    body: [
      "Los generadores de paletas producen combinaciones agradables en aislamiento, pero una paleta no vive en un carrusel: vive sobre botones, textos y fondos con jerarquía.",
      "El método corto: elige un color dominante y un acento, y reserva el resto para neutros. Después, prueba la paleta sobre una maqueta real de página antes de decidir. Es la diferencia entre evaluar color en teoría y evaluarlo en uso.",
      "Las reglas de armonía clásicas —análoga, complementaria, tríada— siguen siendo útiles como punto de partida cuando la intuición se bloquea, y los comprobadores de contraste evitan combinaciones elegantes pero ilegibles.",
      "Si el resultado solo funciona con un gradiente de fondo, probablemente la paleta necesita un neutro más oscuro. Esta pieza es contenido demo de la plataforma; las herramientas citadas existen y son las del directorio.",
    ],
    authorSlug: "estudio-demo-norte",
    category: "diseño",
    date: "2026-07-03",
    readingMinutes: 5,
    tags: ["color", "paletas", "web"],
    relatedToolSlugs: ["coolors", "adobe-color", "realtime-colors"],
  },
  {
    id: "a-03",
    slug: "moodboard-al-sistema",
    title: "Del moodboard al sistema: guardar bien la inspiración",
    excerpt:
      "Guardar referencias es el paso uno. Que sigan encontrándose seis meses después es lo que convierte un moodboard en material de trabajo.",
    body: [
      "El problema de la inspiración no es encontrarla, es recuperarlas. Una carpeta de capturas sin estructura se convierte en un archivo muerto a las pocas semanas.",
      "Tres hábitos que funcionan: guardar con contexto (qué te interesa de la referencia, no solo la imagen completa), etiquetar por disciplina y por uso previsto, y revisar el archivo con periodicidad para descartar.",
      "Las colecciones de esta plataforma siguen esa idea: cada guardado conserva su tipo y su origen, y puedes moverlo entre colecciones cuando cambia de propósito —de «inspiración general» a «sistema de iconos», por ejemplo.",
      "Los organizadores locales de referencias hacen lo mismo a mayor escala, y las pizarras de boceto sirven para pasar del archivo al primer borrador. Artículo demo; el flujo que describe es el que implementa la app.",
    ],
    authorSlug: "sara-demo",
    category: "ux",
    date: "2026-06-18",
    readingMinutes: 7,
    tags: ["inspiración", "colecciones", "método"],
    relatedToolSlugs: ["eagle", "excalidraw"],
  },
  {
    id: "a-04",
    slug: "planificar-foto-luna",
    title: "Tres formas de planificar una foto de luna",
    excerpt:
      "Del planetario en el navegador a la planificación con realidad aumentada: tres herramientas reales y cuándo usar cada una.",
    body: [
      "Fotografiar la luna es, en gran parte, un problema de planificación: saber dónde estará, a qué altura y con qué fase en el momento exacto del disparo.",
      "La primera vía es el planetario web: ver el cielo en tiempo real desde cualquier ubicación, con trayectorias y fases, sin instalar nada. Perfecto para explorar y para decidir la fecha.",
      "La segunda es la planificación sobre mapa con realidad aumentada: calculadores de posición de sol y luna, hora dorada y azul, y profundidad de campo. Es el paso previo al encuadre cuando la ubicación ya está decidida.",
      "La tercera es la comprobación local: leer fase e iluminación directamente en tu propia app —el estudio lunar de esta plataforma calcula la fase del día en vivo— y ajustar exposición en consecuencia. Artículo demo; las herramientas citadas son reales y están en el directorio.",
    ],
    authorSlug: "david-demo",
    category: "fotografía",
    date: "2026-05-30",
    readingMinutes: 4,
    tags: ["luna", "nocturna", "planificación"],
    relatedToolSlugs: ["stellarium-web", "photo-pill"],
  },
  {
    id: "a-05",
    slug: "tipografia-variable",
    title: "Tipografía variable: qué son y cuándo usarlas",
    excerpt:
      "Un solo archivo con muchos estilos. Dónde ganan las variables y dónde sigue teniendo sentido una familia estática.",
    body: [
      "Una tipografía variable empaqueta varios estilos en un único archivo, con ejes que interpolan pesos, anchuras u ópticas de forma continua. En la web se traduce en menos peticiones y transiciones tipográficas posibles.",
      "Dónde ganan: interfaces con muchos pesos intermedios, titulares que animan su peso al interactuar y proyectos donde cada kilobyte cuenta. Los catálogos libres permiten filtrar por fuentes variables.",
      "Dónde conviene prudencia: cuando la familia elegida solo existe en variable con soporte de ejes incompleto en algunos navegadores, o cuando el equipo necesita estilos con nombre y cierre —un «Book» y un «Bold»— para mantener consistencia editorial.",
      "Para elegir, el paso práctico es el mismo en ambos casos: probar la fuente con tu propio texto y comprobar los pares con la jerarquía real del proyecto. Pieza demo de la plataforma.",
    ],
    authorSlug: "pablo-demo",
    category: "tipografía",
    date: "2026-04-21",
    readingMinutes: 6,
    tags: ["tipografía", "variable", "web"],
    relatedToolSlugs: ["google-fonts", "fontshare", "typewolf"],
  },
  {
    id: "a-06",
    slug: "exportar-para-web",
    title: "Exportar para web: formatos de imagen sin perder calidad",
    excerpt:
      "PNG, WebP, AVIF o JPEG: una decisión corta si se piensa en tipo de imagen, y una comparación lado a lado antes de publicar.",
    body: [
      "La elección de formato se reduce a tres preguntas: ¿la imagen tiene transparencia?, ¿es fotográfica o gráfica plana?, ¿necesitas la máxima compresión aunque el códec sea más reciente?",
      "Reglas de bolsillo: gráficos planos y transparencia van en PNG o WebP; fotografía en WebP, AVIF o JPEG bien ajustado; y cuando el peso manda, compara los códecs modernos con la imagen delante, no a ciegas.",
      "El paso que más se olvida es la comparación: ver original y comprimido lado a lado, con el peso resultante, antes de decidir. Hacerlo en el navegador y sin subir el archivo evita tanto la espera como la copia innecesaria en servidores.",
      "Cuando la imagen original es pequeña y hace falta ampliarla, el reescalado con IA reconstruye detalle mejor que la interpolación clásica, aunque conviene revisar texturas. Artículo demo; herramientas reales del directorio.",
    ],
    authorSlug: "marco-demo",
    category: "herramientas",
    date: "2026-03-14",
    readingMinutes: 5,
    tags: ["imagen", "webp", "compresión"],
    relatedToolSlugs: ["squoosh", "upscale-media"],
  },
];

export const CREATORS: Creator[] = CREATORS_SEED.map((c) => ({
  ...c,
  demo: true as const,
}));

export const PROJECTS: Project[] = PROJECTS_SEED.map((p) => ({
  ...p,
  demo: true as const,
}));

export const ARTICLES: Article[] = ARTICLES_SEED.map((a) => ({
  ...a,
  demo: true as const,
}));

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getCreatorBySlug(slug: string): Creator | undefined {
  return CREATORS.find((c) => c.slug === slug);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function projectsByCreator(creatorSlug: string): Project[] {
  return PROJECTS.filter((p) => p.creatorSlug === creatorSlug);
}

export function articlesByCreator(creatorSlug: string): Article[] {
  return ARTICLES.filter((a) => a.authorSlug === creatorSlug);
}

export function projectsUsingTool(toolSlug: string): Project[] {
  return PROJECTS.filter((p) => p.tools.includes(toolSlug));
}

export function articlesAboutTool(toolSlug: string): Article[] {
  return ARTICLES.filter((a) => a.relatedToolSlugs.includes(toolSlug));
}

export function creatorsUsingTool(toolSlug: string): Creator[] {
  return CREATORS.filter((c) => c.tools.includes(toolSlug));
}

export function relatedProjects(project: Project, limit = 3): Project[] {
  const sameCategory = PROJECTS.filter(
    (p) => p.slug !== project.slug && p.category === project.category,
  );
  const sharedTags = PROJECTS.filter(
    (p) =>
      p.slug !== project.slug &&
      p.category !== project.category &&
      p.tags.some((t) => project.tags.includes(t)),
  );
  return [...sameCategory, ...sharedTags].slice(0, limit);
}

export function relatedArticles(article: Article, limit = 2): Article[] {
  return ARTICLES.filter(
    (a) => a.slug !== article.slug && a.category === article.category,
  ).slice(0, limit);
}

/** "2026-08-12" → "12 ago 2026" (es-ES). */
export function formatArticleDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export function searchProjects(query: string, category?: string): Project[] {
  const needle = query.trim().toLowerCase();
  let result = PROJECTS;
  if (category && category !== "all") {
    result = result.filter((p) => p.category === category);
  }
  if (!needle) return result;
  return result.filter(
    (p) =>
      p.title.toLowerCase().includes(needle) ||
      p.description.toLowerCase().includes(needle) ||
      p.tags.some((t) => t.toLowerCase().includes(needle)),
  );
}

export function searchArticles(query: string, category?: string): Article[] {
  const needle = query.trim().toLowerCase();
  let result = ARTICLES;
  if (category && category !== "all") {
    result = result.filter((a) => a.category === category);
  }
  if (!needle) return result;
  return result.filter(
    (a) =>
      a.title.toLowerCase().includes(needle) ||
      a.excerpt.toLowerCase().includes(needle) ||
      a.tags.some((t) => t.toLowerCase().includes(needle)),
  );
}

export function searchCreators(query: string, type?: string): Creator[] {
  const needle = query.trim().toLowerCase();
  let result = CREATORS;
  if (type && type !== "all") {
    result = result.filter((c) => c.type === type);
  }
  if (!needle) return result;
  return result.filter(
    (c) =>
      c.name.toLowerCase().includes(needle) ||
      c.username.toLowerCase().includes(needle) ||
      c.bio.toLowerCase().includes(needle) ||
      c.skills.some((s) => s.toLowerCase().includes(needle)),
  );
}
