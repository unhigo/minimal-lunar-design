/**
 * Tool directory data layer.
 *
 * MVP: static, structured TypeScript data, clearly separated from the UI so it
 * can later move to a database/API without touching the interface.
 *
 * Only real tools with official URLs. No invented pricing or features —
 * `pricingDetails` is either an official free-tier fact or a pointer to the
 * official site.
 */

export interface Tool {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  website: string;
  category: ToolCategory;
  tags: string[];
  /** Official, verifiable pricing facts only ("free tier", "open source"). */
  pricing: "free" | "freemium" | "open-source" | "paid";
  pricingDetails: string;
  platforms: string[];
  features: string[];
  pros: string[];
  cons: string[];
  /** Slugs of related tools — powers the interlinking graph. */
  alternatives: string[];
  verified: boolean;
  featured: boolean;
  trending: boolean;
  createdAt: number;
}

export const TOOL_CATEGORIES = [
  "AI",
  "Diseño",
  "UI/UX",
  "Color",
  "Tipografía",
  "Iconos",
  "Imagen",
  "Motion",
  "3D",
  "Astronomía",
  "Fotografía",
  "Código",
  "No-code",
  "Productividad",
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

const day = 86_400_000;

/**
 * Curated seed of real tools. Descriptions are factual summaries of what the
 * product is officially described as; pricing notes avoid invented numbers.
 */
export const TOOLS: Tool[] = [
  {
    id: "t-01",
    slug: "figma",
    name: "Figma",
    shortDescription: "Editor de diseño colaborativo en el navegador.",
    description:
      "Figma es un editor de interfaces colaborativo que funciona íntegramente en el navegador: varios usuarios editan el mismo archivo en tiempo real, con prototipado, componentes reutilizables y modos de desarrollo para traspasar el diseño a código.",
    website: "https://www.figma.com",
    category: "UI/UX",
    tags: ["interfaces", "prototipos", "colaboración", "design systems"],
    pricing: "freemium",
    pricingDetails: "Plan gratuito disponible; planes de pago en figma.com/pricing.",
    platforms: ["web", "macOS", "Windows"],
    features: [
      "Edición colaborativa en tiempo real",
      "Prototipado con interacciones",
      "Componentes y variables de diseño",
      "Modo desarrollador con inspección de código",
    ],
    pros: ["Colaboración fluida sin instalar nada", "Ecosistema enorme de plugins y comunidades"],
    cons: ["Requiere conexión para el flujo completo", "Las funciones avanzadas quedan en planes de pago"],
    alternatives: ["penpot", "sketch", "excalidraw"],
    verified: true,
    featured: true,
    trending: true,
    createdAt: Date.now() - 30 * day,
  },
  {
    id: "t-02",
    slug: "penpot",
    name: "Penpot",
    shortDescription: "Alternativa de diseño colaborativo open source.",
    description:
      "Penpot es la plataforma de diseño y prototipado open source orientada a equipos de diseño y desarrollo: funciona en el navegador, usa SVG como formato nativo y se puede autoalojar.",
    website: "https://penpot.app",
    category: "UI/UX",
    tags: ["open source", "interfaces", "prototipos", "svg"],
    pricing: "open-source",
    pricingDetails: "Código abierto (MPL 2.0); instancia en la nube gratuita y opción de autoalojamiento.",
    platforms: ["web", "autoalojado"],
    features: [
      "Formato nativo SVG",
      "Autoalojamiento (Docker)",
      "Componentes y bibliotecas compartidas",
      "Integración con flujos de desarrollo",
    ],
    pros: ["Código abierto y autoalojable", "Sin coste para equipos pequeños"],
    cons: ["Ecosistema de plugins más joven que el de sus alternativas comerciales"],
    alternatives: ["figma", "sketch"],
    verified: true,
    featured: false,
    trending: true,
    createdAt: Date.now() - 28 * day,
  },
  {
    id: "t-03",
    slug: "coolors",
    name: "Coolors",
    shortDescription: "Generador de paletas de color rápido.",
    description:
      "Coolors genera paletas de color a partir de una tecla: explora combinaciones, ajústalas con controles de tono y saturación, extrae colores de una imagen y comparte o exporta la paleta en varios formatos.",
    website: "https://coolors.co",
    category: "Color",
    tags: ["paletas", "color", "generador"],
    pricing: "freemium",
    pricingDetails: "Generador gratuito; funciones extra y exports avanzados en el plan premium.",
    platforms: ["web", "iOS", "Android"],
    features: [
      "Generación de paletas con espacio/teclado",
      "Extracción de color desde imágenes",
      "Exportar a múltiples formatos",
      "Explorar paletas de la comunidad",
    ],
    pros: ["Muy rápido para iterar paletas", "Extracción desde imagen muy práctica"],
    cons: ["Algunas utilidades quedan tras el login o el plan premium"],
    alternatives: ["realtime-colors", "adobe-color"],
    verified: true,
    featured: true,
    trending: false,
    createdAt: Date.now() - 27 * day,
  },
  {
    id: "t-04",
    slug: "adobe-color",
    name: "Adobe Color",
    shortDescription: "Rueda de color y reglas armónicas de Adobe.",
    description:
      "Adobe Color combina una rueda cromática con reglas de armonía (análoga, complementaria, tríada…), extracción de paletas desde imágenes y acceso a tendencias de color, sincronizándose con las librerías de Adobe Creative Cloud.",
    website: "https://color.adobe.com",
    category: "Color",
    tags: ["paletas", "armonía", "tendencias"],
    pricing: "free",
    pricingDetails: "Uso gratuito con cuenta de Adobe.",
    platforms: ["web"],
    features: [
      "Reglas de armonía sobre rueda cromática",
      "Extracción de paleta desde imagen",
      "Tendencias de color por sectores",
      "Sincronización con librerías CC",
    ],
    pros: ["Reglas armónicas clásicas muy didácticas", "Integra con el flujo de Adobe"],
    cons: ["Menos ágil para iteración rápida que generadores dedicados"],
    alternatives: ["coolors", "realtime-colors"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 26 * day,
  },
  {
    id: "t-05",
    slug: "realtime-colors",
    name: "Realtime Colors",
    shortDescription: "Prueba paletas sobre un sitio real en vivo.",
    description:
      "Realtime Colors aplica paletas de color y tipografías sobre una maqueta de página web en tiempo real, para juzgar contraste y jerarquía en contexto antes de tocar código. Exporta la paleta con tokens listos para CSS.",
    website: "https://www.realtimecolors.com",
    category: "Color",
    tags: ["paletas", "web", "contraste", "tokens"],
    pricing: "freemium",
    pricingDetails: "Herramienta base gratuita; extras para equipos en planes de pago.",
    platforms: ["web"],
    features: [
      "Vista previa sobre maqueta web en vivo",
      "Combinar paleta + tipografía",
      "Exportar tokens de color y tipografía",
      "Comprobación rápida de contraste",
    ],
    pros: ["Evaluar color en contexto real, no en aislado", "Exporta tokens listos para usar"],
    cons: ["Orientado a web, menos útil para print"],
    alternatives: ["coolors", "adobe-color"],
    verified: true,
    featured: false,
    trending: true,
    createdAt: Date.now() - 25 * day,
  },
  {
    id: "t-06",
    slug: "google-fonts",
    name: "Google Fonts",
    shortDescription: "Catálogo de tipografías libres para web y productos.",
    description:
      "Google Fonts es un catálogo de más de mil familias tipográficas de código abierto, con previsualización de texto propio, comparación de pares y servicio de hosting de fuentes optimizado para web.",
    website: "https://fonts.google.com",
    category: "Tipografía",
    tags: ["fuentes", "web", "open source"],
    pricing: "free",
    pricingDetails: "Fuentes de código abierto, servicio de hosting gratuito.",
    platforms: ["web", "api"],
    features: [
      "Catálogo completo de fuentes open source",
      "Previsualizar con tu propio texto",
      "Comparador de pares tipográficos",
      "API de fuentes para web",
    ],
    pros: ["Licencias abiertas sin coste", "Hosting rápido con optimizaciones automáticas"],
    cons: ["Selección muy usada: menos diferenciación frente a opciones premium"],
    alternatives: ["fontshare", "fontpair"],
    verified: true,
    featured: true,
    trending: false,
    createdAt: Date.now() - 24 * day,
  },
  {
    id: "t-07",
    slug: "fontshare",
    name: "Fontshare",
    shortDescription: "Tipografías profesionales gratuitas de Indian Type Foundry.",
    description:
      "Fontshare distribuye familias tipográficas profesionales desarrolladas por Indian Type Foundry con licencia gratuita para uso personal y comercial, incluyendo pares y colecciones curadas.",
    website: "https://www.fontshare.com",
    category: "Tipografía",
    tags: ["fuentes", "gratis", "comercial"],
    pricing: "free",
    pricingDetails: "Licencia Fontshare gratuita para uso personal y comercial.",
    platforms: ["web"],
    features: [
      "Familias profesionales de ITF",
      "Licencia comercial gratuita",
      "Pares y colecciones curadas",
      "Descarga directa sin registro",
    ],
    pros: ["Calidad de fundición con licencia permisiva", "Curación notable"],
    cons: ["Catálogo más pequeño que el de Google Fonts"],
    alternatives: ["google-fonts", "fontpair"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 23 * day,
  },
  {
    id: "t-08",
    slug: "fontpair",
    name: "Fontpair",
    shortDescription: "Pares tipográficos de Google Fonts ya combinados.",
    description:
      "Fontpair recopila combinaciones de tipografías de Google Fonts que funcionan bien juntas, organizadas por estilos (serif + sans, display + texto…), con previsualización y descarga directa de las fuentes.",
    website: "https://www.fontpair.co",
    category: "Tipografía",
    tags: ["pares", "google fonts", "combinaciones"],
    pricing: "free",
    pricingDetails: "Herramienta gratuita; todas las fuentes son de Google Fonts (open source).",
    platforms: ["web"],
    features: [
      "Pares preseleccionados por estilo",
      "Vista previa en titulares y párrafos",
      "Enlace directo a Google Fonts",
    ],
    pros: ["Ahorra el ensayo y error de emparejar fuentes", "Solo con fuentes open source"],
    cons: ["Colección limitada a pares ya decididos"],
    alternatives: ["google-fonts", "fontshare"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 22 * day,
  },
  {
    id: "t-09",
    slug: "lucide",
    name: "Lucide",
    shortDescription: "Biblioteca de iconos SVG open source (la de esta app).",
    description:
      "Lucide es una biblioteca de iconos SVG de código abierto, fork de Feather Icons, con cientos de trazos consistentes, paleta editable y paquetes oficiales para React, Vue, Svelte y más. Es la que utiliza Minimal Lunar Design.",
    website: "https://lucide.dev",
    category: "Iconos",
    tags: ["svg", "open source", "react"],
    pricing: "open-source",
    pricingDetails: "Código abierto, licencia ISC.",
    platforms: ["web", "react", "vue", "svelte"],
    features: [
      "Cientos de iconos de trazo consistente",
      "Paquetes oficiales para frameworks",
      "Tamaño de trazo y color personalizables",
      "SVG ligeros, sin dependencia en runtime",
    ],
    pros: ["Estética minimalista encaja con estilos limpios", "Tree-shaking en React"],
    cons: ["Menos iconos rellenos/duotono que otras bibliotecas"],
    alternatives: ["iconify", "heroicons"],
    verified: true,
    featured: true,
    trending: false,
    createdAt: Date.now() - 21 * day,
  },
  {
    id: "t-10",
    slug: "heroicons",
    name: "Heroicons",
    shortDescription: "Iconos SVG del equipo de Tailwind CSS.",
    description:
      "Heroicons ofrece iconos SVG hechos a mano por los creadores de Tailwind CSS, en variantes outline, solid y mini, diseñados para funcionar con las interfaces de Tailwind UI.",
    website: "https://heroicons.com",
    category: "Iconos",
    tags: ["svg", "tailwind", "gratis"],
    pricing: "open-source",
    pricingDetails: "Código abierto, licencia MIT.",
    platforms: ["web", "react", "vue"],
    features: [
      "Variantes outline, solid y mini (20px)",
      "Copiar SVG desde la web",
      "Paquetes para React y Vue",
    ],
    pros: ["Calidad de diseño muy alta", "Coordina con estilos Tailwind"],
    cons: ["Menor variedad que bibliotecas tipo Iconify"],
    alternatives: ["lucide", "iconify"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 20 * day,
  },
  {
    id: "t-11",
    slug: "iconify",
    name: "Iconify",
    shortDescription: "Agregador de más de 200 sets de iconos con una API.",
    description:
      "Iconify unifica más de 200 colecciones de iconos open source bajo una API y componentes comunes: busca en todos los sets a la vez y usa el que necesites sin instalar paquetes independientes.",
    website: "https://iconify.design",
    category: "Iconos",
    tags: ["svg", "agregador", "api"],
    pricing: "open-source",
    pricingDetails: "Proyecto open source; API pública gratuita.",
    platforms: ["web", "react", "vue", "svelte", "figma"],
    features: [
      "Búsqueda unificada en 200+ sets",
      "Componentes para frameworks",
      "Plugin de Figma",
      "API pública de iconos",
    ],
    pros: ["Acceso a prácticamente todos los iconos desde un solo sitio", "Carga bajo demanda"],
    cons: ["Dependes de un índice externo si no empaquetas los SVG"],
    alternatives: ["lucide", "heroicons"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 19 * day,
  },
  {
    id: "t-12",
    slug: "unblast",
    name: "Unblast",
    shortDescription: "Directorio de mockups y recursos gratuitos.",
    description:
      "Unblast recopila mockups, plantillas, fuentes e iconos gratuitos organizados por categoría, enlazando a los sitios originales de descarga y verificando las licencias de lo que publica.",
    website: "https://unblast.com",
    category: "Diseño",
    tags: ["mockups", "recursos", "gratis"],
    pricing: "free",
    pricingDetails: "Directorio gratuito; los recursos enlazan a sus sitios originales.",
    platforms: ["web"],
    features: [
      "Mockups PSD por categoría",
      "Curación con verificación de licencia",
      "Secciones de fuentes, iconos y plantillas",
    ],
    pros: ["Buena fuente para mockups gratuitos", "Enlaza siempre al origen"],
    cons: ["Calidad variable porque agrega de terceros"],
    alternatives: ["lunacy"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 18 * day,
  },
  {
    id: "t-13",
    slug: "lunacy",
    name: "Lunacy",
    shortDescription: "Editor compatible con Sketch, gratuito y offline.",
    description:
      "Lunacy es un editor de diseño gratuito de Icons8 que abre archivos de Sketch de forma nativa y funciona offline en Windows, macOS y Linux, con bibliotecas de assets integradas y colaboración opcional.",
    website: "https://icons8.com/lunacy",
    category: "Diseño",
    tags: ["editor", "sketch", "offline"],
    pricing: "freemium",
    pricingDetails: "Gratuito con funciones completas de edición; servicios en la nube de pago.",
    platforms: ["windows", "macOS", "linux"],
    features: [
      "Abre .sketch de forma nativa",
      "Funciona sin conexión",
      "Bibliotecas de assets integradas",
      "Multiplataforma incluido Linux",
    ],
    pros: ["Gratis y sin requisitos de conexión", "Único buen cliente .sketch en Linux"],
    cons: ["Colaboración menos madura que la de las suites web"],
    alternatives: ["figma", "penpot"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 17 * day,
  },
  {
    id: "t-14",
    slug: "remove-bg",
    name: "remove.bg",
    shortDescription: "Elimina fondos de imágenes automáticamente.",
    description:
      "remove.bg separa el sujeto del fondo en segundos con un modelo de IA, funciona desde el navegador o su API, y permite sustituir el fondo por otro color, imagen o dejarlo transparente.",
    website: "https://www.remove.bg",
    category: "Imagen",
    tags: ["ia", "fondo", "recorte"],
    pricing: "freemium",
    pricingDetails: "Previsualizaciones gratuitas; descargas en resolución completa vía créditos o API.",
    platforms: ["web", "api", "escritorio"],
    features: [
      "Recorte de fondo automático",
      "API para integraciones",
      "Reemplazo de fondo por color o imagen",
    ],
    pros: ["Resultado muy limpio en retratos y producto", "API estable"],
    cons: ["La resolución completa es de pago"],
    alternatives: ["upscale-media"],
    verified: true,
    featured: true,
    trending: true,
    createdAt: Date.now() - 16 * day,
  },
  {
    id: "t-15",
    slug: "upscale-media",
    name: "Upscale.media",
    shortDescription: "Amplía imágenes con IA manteniendo el detalle.",
    description:
      "Upscale.media aumenta la resolución de imágenes con modelos de IA, reconstruyendo detalle en lugar de interpolar, con opciones de 2x a 4x y corrección de compresión.",
    website: "https://www.upscale.media",
    category: "Imagen",
    tags: ["ia", "upscale", "resolución"],
    pricing: "freemium",
    pricingDetails: "Uso básico gratuito; lotes y resoluciones mayores en planes de pago.",
    platforms: ["web", "android", "ios"],
    features: [
      "Ampliación 2x–4x con IA",
      "Reducción de artefactos de compresión",
      "Procesamiento por lotes",
    ],
    pros: ["Salvaguarda imágenes pequeñas para print", "Interfaz muy simple"],
    cons: ["Límites de tamaño en el uso gratuito"],
    alternatives: ["remove-bg"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 15 * day,
  },
  {
    id: "t-16",
    slug: "spline",
    name: "Spline",
    shortDescription: "Diseño 3D colaborativo accesible desde el navegador.",
    description:
      "Spline acerca el 3D a diseñadores sin formación técnica: modela, aplica materiales y anima escenas en el navegador, y expórtalas interactivas para web con React o como imagen/vídeo.",
    website: "https://spline.design",
    category: "3D",
    tags: ["3d", "web", "interactivo"],
    pricing: "freemium",
    pricingDetails: "Plan gratuito personal; proyectos y funciones de equipo en planes de pago.",
    platforms: ["web", "macOS", "windows"],
    features: [
      "Modelado y materiales en el navegador",
      "Animación de escenas",
      "Exportar interactivos para web/React",
      "Colaboración en archivos",
    ],
    pros: ["Curva de aprendizaje suave para 3D", "Exportación web interactiva única"],
    cons: ["Modelado avanzado limitado frente a DCC profesionales"],
    alternatives: ["blender"],
    verified: true,
    featured: true,
    trending: true,
    createdAt: Date.now() - 14 * day,
  },
  {
    id: "t-17",
    slug: "blender",
    name: "Blender",
    shortDescription: "Suite 3D open source completa: modelado, render, VFX.",
    description:
      "Blender es una suite 3D de código abierto que cubre modelado, esculturado, materiales, animación, simulación, render (EEVEE/Cycles) y edición de vídeo, con un ecosistema enorme de addons.",
    website: "https://www.blender.org",
    category: "3D",
    tags: ["3d", "open source", "render", "animación"],
    pricing: "open-source",
    pricingDetails: "Código abierto, licencia GPL. Gratuito al 100%.",
    platforms: ["windows", "macOS", "linux"],
    features: [
      "Modelado poligonal y esculturado",
      "Motores de render EEVEE y Cycles",
      "Simulaciones de física",
      "Compositor y edición de vídeo",
    ],
    pros: ["Impensable lo que ofrece siendo gratuito", "Comunidad y tutoriales enormes"],
    cons: ["Curva de aprendizaje empinada"],
    alternatives: ["spline"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 13 * day,
  },
  {
    id: "t-18",
    slug: "photomosh",
    name: "Photomosh",
    shortDescription: "Efectos glitch y distorsión de vídeo e imagen.",
    description:
      "Photomosh aplica efectos de glitch, scans, ruido y distorsión digital a imágenes y vídeos desde el navegador, con exportación en varios formatos incluyendo GIF y vídeo.",
    website: "https://photomosh.com",
    category: "Imagen",
    tags: ["glitch", "efectos", "generativo"],
    pricing: "freemium",
    pricingDetails: "Versión web gratuita; app de escritorio de pago con más resolución.",
    platforms: ["web", "escritorio"],
    features: [
      "Efectos glitch en directo",
      "Entrada de imagen y vídeo",
      "Exportación a GIF/vídeo",
    ],
    pros: ["Resultados llamativos en segundos", "Todo en el navegador"],
    cons: ["Control fino limitado; resolución máxima en la app de pago"],
    alternatives: [],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 12 * day,
  },
  {
    id: "t-19",
    slug: "stellarium-web",
    name: "Stellarium Web",
    shortDescription: "Planetario en el navegador, versión web de Stellarium.",
    description:
      "Stellarium Web muestra el cielo en tiempo real desde cualquier ubicación: constelaciones, planetas, fases lunares y eventos, con la precisión del proyecto Stellarium sin instalar nada.",
    website: "https://stellarium-web.org",
    category: "Astronomía",
    tags: ["cielo", "luna", "constelaciones"],
    pricing: "free",
    pricingDetails: "Gratuito; el proyecto es open source.",
    platforms: ["web"],
    features: [
      "Cielo en tiempo real por ubicación",
      "Fases lunares y trayectoria",
      "Constelaciones y catálogos de estrellas",
    ],
    pros: ["Sin instalación y con datos serios", "Encaja con la temática lunar de la app"],
    cons: ["La versión de escritorio ofrece mucho más control"],
    alternatives: [],
    verified: true,
    featured: false,
    trending: true,
    createdAt: Date.now() - 11 * day,
  },
  {
    id: "t-20",
    slug: "photo-pill",
    name: "PhotoPill",
    shortDescription: "Planificación de capturas con sol y luna.",
    description:
      "PhotoPills es una herramienta de planificación fotográfica: calcula la posición del sol y la luna, la hora dorada/azul y la profundidad de campo, y permite planificar encuadres sobre un mapa con realidad aumentada.",
    website: "https://www.photopills.com",
    category: "Fotografía",
    tags: ["planificación", "sol", "luna"],
    pricing: "paid",
    pricingDetails: "App de pago único; todos los detalles en photopills.com.",
    platforms: ["ios", "android"],
    features: [
      "Planificador de sol y luna con AR",
      "Calculadoras de exposición y DoF",
      "Notificaciones de eventos",
    ],
    pros: ["La referencia para planificar luz natural", "Todo offline en el móvil"],
    cons: ["Es de pago y solo móvil"],
    alternatives: ["stellarium-web"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 10 * day,
  },
  {
    id: "t-21",
    slug: "excalidraw",
    name: "Excalidraw",
    shortDescription: "Pizarra de diagramas con estética dibujada a mano.",
    description:
      "Excalidraw es una pizarra virtual open source para diagramas y wireframes con estética de boceto, colaboración en tiempo real mediante enlaces y biblioteca de elementos reutilizables.",
    website: "https://excalidraw.com",
    category: "UI/UX",
    tags: ["wireframes", "diagramas", "open source"],
    pricing: "open-source",
    pricingDetails: "Código abierto (MIT); la app web es gratuita.",
    platforms: ["web"],
    features: [
      "Estética de boceto a mano",
      "Colaboración por enlace",
      "Biblioteca de elementos",
      "Funciona offline (PWA)",
    ],
    pros: ["Ideal para ideas tempranas sin pulir", "Sin cuenta para empezar"],
    cons: ["No es un editor de UI final"],
    alternatives: ["figma", "tldv"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 9 * day,
  },
  {
    id: "t-22",
    slug: "whimsical",
    name: "Whimsical",
    shortDescription: "Wireframes, mapas mentales y flujos en un lienzo.",
    description:
      "Whimsical combina wireframes, diagramas de flujo, mapas mentales y documentos en un solo lienzo colaborativo, con componentes unificados para pasar de la idea al flujo sin cambiar de herramienta.",
    website: "https://whimsical.com",
    category: "UI/UX",
    tags: ["wireframes", "flujos", "mapas mentales"],
    pricing: "freemium",
    pricingDetails: "Plan gratuito con límite de documentos; equipos en planes de pago.",
    platforms: ["web", "macOS", "windows"],
    features: [
      "Wireframes con componentes unificados",
      "Diagramas de flujo y mapas mentales",
      "Colaboración en tiempo real",
    ],
    pros: ["Pasos rápidos de idea a flujo", "Muy ordenado visualmente"],
    cons: ["Límite de elementos gratuitos"],
    alternatives: ["excalidraw", "figma"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 8 * day,
  },
  {
    id: "t-23",
    slug: "json-crack",
    name: "JSON Crack",
    shortDescription: "Visualiza y explora JSON como grafo.",
    description:
      "JSON Crack convierte estructuras JSON en grafos navegables, con búsqueda, formateo, conversión a otros formatos y generación de tipos, útil para entender APIs y payloads complejos.",
    website: "https://jsoncrack.com",
    category: "Código",
    tags: ["json", "visualización", "api"],
    pricing: "freemium",
    pricingDetails: "Uso básico gratuito; funciones avanzadas en la versión de pago.",
    platforms: ["web", "vscode"],
    features: [
      "Grafo interactivo de JSON",
      "Conversión entre formatos",
      "Extensión de VS Code",
    ],
    pros: ["Hace legibles payloads enormes", "Modo offline en VS Code"],
    cons: ["Solo JSON y derivados"],
    alternatives: [],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 7 * day,
  },
  {
    id: "t-24",
    slug: "ray-so",
    name: "ray.so",
    shortDescription: "Capturas de código con marcos y gradientes elegantes.",
    description:
      "ray.so convierte fragmentos de código en imágenes compartibles con resaltado de sintaxis, marcos de ventana y fondos con gradiente, con controles de tema, padding y proporción.",
    website: "https://ray.so",
    category: "Código",
    tags: ["código", "compartir", "imagen"],
    pricing: "free",
    pricingDetails: "Gratuito.",
    platforms: ["web"],
    features: [
      "Resaltado de sintaxis con muchos lenguajes",
      "Temas y fondos configurables",
      "Exportación PNG",
    ],
    pros: ["Perfecto para documentación y redes", "Rápido y sin registro"],
    cons: ["Solo exporta imagen, no editable como texto"],
    alternatives: [],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 6 * day,
  },
  {
    id: "t-25",
    slug: "carrd",
    name: "Carrd",
    shortDescription: "Webs de una página sencillas y rápidas.",
    description:
      "Carrd permite construir sitios de una página con editor visual, plantillas y dominio propio, enfocado a perfiles, landings y portfolios ligeros que publicar en minutos.",
    website: "https://carrd.co",
    category: "No-code",
    tags: ["landing", "una página", "web"],
    pricing: "freemium",
    pricingDetails: "Hasta 3 sitios gratuitos; dominio propio y más sitios en planes de pago.",
    platforms: ["web"],
    features: [
      "Editor visual de una página",
      "Plantillas responsivas",
      "Formularios y widgets",
      "Dominio propio en planes de pago",
    ],
    pros: ["Publicar una landing lleva minutos", "Precio bajo si se necesita más"],
    cons: ["Solo una página; sin CMS"],
    alternatives: [],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 5 * day,
  },
  {
    id: "t-26",
    slug: "relume",
    name: "Relume",
    shortDescription: "Wireframes y sitemaps de sitios asistidos por IA.",
    description:
      "Relume genera sitemaps y wireframes de sitios web a partir de una descripción breve, con una biblioteca de componentes conectada a Webflow y Figma para acelerar la fase estructural.",
    website: "https://www.relume.io",
    category: "AI",
    tags: ["ia", "wireframes", "sitemap"],
    pricing: "freemium",
    pricingDetails: "Plan gratuito limitado; proyectos completos en planes de pago.",
    platforms: ["web", "figma", "webflow"],
    features: [
      "Generación de sitemap por IA",
      "Wireframes con biblioteca de componentes",
      "Exportación a Figma y Webflow",
    ],
    pros: ["Acelera la estructura inicial de un sitio", "Puente directo con Webflow/Figma"],
    cons: ["La generación necesita revisión de diseño"],
    alternatives: ["whimsical"],
    verified: true,
    featured: false,
    trending: true,
    createdAt: Date.now() - 4 * day,
  },
  {
    id: "t-27",
    slug: "squoosh",
    name: "Squoosh",
    shortDescription: "Comprime imágenes en el navegador sin subir nada.",
    description:
      "Squoosh, del equipo Chrome DevRel, comprime y convierte imágenes localmente en el navegador: compara resultados lado a lado en varios formatos (WebP, AVIF, MozJPEG…) sin subir la imagen a ningún servidor.",
    website: "https://squoosh.app",
    category: "Imagen",
    tags: ["compresión", "webp", "avif"],
    pricing: "open-source",
    pricingDetails: "Código abierto (Apache-2.0), gratuito.",
    platforms: ["web"],
    features: [
      "Compresión 100% local en el navegador",
      "Comparador lado a lado",
      "Códecs modernos (AVIF, WebP, JPEG XL)",
    ],
    pros: ["Privacidad total: nada sale del navegador", "Control fino por códec"],
    cons: ["Una imagen a la vez, sin lotes"],
    alternatives: [],
    verified: true,
    featured: true,
    trending: false,
    createdAt: Date.now() - 3 * day,
  },
  {
    id: "t-28",
    slug: "noun-project",
    name: "The Noun Project",
    shortDescription: "Millones de iconos de creadores de todo el mundo.",
    description:
      "Noun Project ofrece millones de iconos creados por diseñadores de todo el mundo, con búsqueda por concepto, colecciones temáticas y API; los usos requieren revisar la licencia de cada icono.",
    website: "https://thenounproject.com",
    category: "Iconos",
    tags: ["iconos", "colecciones", "api"],
    pricing: "freemium",
    pricingDetails: "Descargas gratuitas con atribución; suscripción para licencias ampliadas.",
    platforms: ["web", "api", "macOS", "windows"],
    features: [
      "Millones de iconos por concepto",
      "Colecciones temáticas",
      "API para productos",
    ],
    pros: ["Cobertura conceptual inigualable", "Ideal para metáforas raras"],
    cons: ["Revisar licencia icono a icono en el uso gratuito"],
    alternatives: ["lucide", "iconify"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 2 * day,
  },
  {
    id: "t-29",
    slug: "typewolf",
    name: "Typewolf",
    shortDescription: "Tendencias y parejas tipográficas en sitios reales.",
    description:
      "Typewolf documenta qué tipografías se usan en la web real: guías de tendencias anuales, pares recomendados y un índice de fuentes con ejemplos de uso en sitios reconocidos.",
    website: "https://www.typewolf.com",
    category: "Tipografía",
    tags: ["tendencias", "pares", "inspiración"],
    pricing: "freemium",
    pricingDetails: "Guías gratuitas; PDFs y playbooks de pago.",
    platforms: ["web"],
    features: [
      "Sitios del mes con sus tipografías",
      "Guías de tendencias anuales",
      "Índice con alternativas a cada fuente",
    ],
    pros: ["Muestra tipografía en uso real, no en teoría", "Detecta tendencias temprano"],
    cons: ["Contenido premium de pago"],
    alternatives: ["fontpair", "google-fonts"],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now() - 1 * day,
  },
  {
    id: "t-30",
    slug: "eagle",
    name: "Eagle",
    shortDescription: "Organizador de assets y referencias visual.",
    description:
      "Eagle es un gestor de bibliotecas visuales: organiza imágenes, vídeos, fuentes y enlaces en carpetas y etiquetas con previsualización rápida, pensado para moodboards y bibliotecas de referencia locales.",
    website: "https://eagle.cool",
    category: "Productividad",
    tags: ["assets", "moodboard", "organización"],
    pricing: "paid",
    pricingDetails: "Licencia de pago único con prueba gratuita; detalles en eagle.cool.",
    platforms: ["windows", "macOS"],
    features: [
      "Bibliotecas locales con etiquetas y carpetas inteligentes",
      "Previsualización masiva de imágenes y vídeos",
      "Captura desde navegador",
    ],
    pros: ["La mejor gestión local de referencias visuales", "Búsquedas y filtros potentes"],
    cons: ["De pago y sin versión web"],
    alternatives: [],
    verified: true,
    featured: false,
    trending: false,
    createdAt: Date.now(),
  },
];

// ---------------------------------------------------------------------------

export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolById(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function relatedTools(tool: Tool, limit = 4): Tool[] {
  const sameCategory = TOOLS.filter(
    (t) => t.id !== tool.id && t.category === tool.category,
  );
  const linked = tool.alternatives
    .map((slug) => getToolBySlug(slug))
    .filter((t): t is Tool => Boolean(t) && t!.id !== tool.id);
  const merged: Tool[] = [];
  for (const t of [...linked, ...sameCategory]) {
    if (merged.length >= limit) break;
    if (!merged.some((m) => m.id === t.id)) merged.push(t);
  }
  return merged;
}

export function trendingTools(limit = 6): Tool[] {
  return TOOLS.filter((t) => t.trending).slice(0, limit);
}

export function featuredTools(limit = 6): Tool[] {
  return TOOLS.filter((t) => t.featured).slice(0, limit);
}

export function searchTools(query: string, category?: string): Tool[] {
  const needle = query.trim().toLowerCase();
  let result = TOOLS;
  if (category && category !== "all") {
    result = result.filter((t) => t.category === category);
  }
  if (!needle) return result;
  return result.filter(
    (t) =>
      t.name.toLowerCase().includes(needle) ||
      t.shortDescription.toLowerCase().includes(needle) ||
      t.description.toLowerCase().includes(needle) ||
      t.tags.some((tag) => tag.toLowerCase().includes(needle)),
  );
}
