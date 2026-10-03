import {
  Bot,
  CreditCard,
  Dribbble,
  Layers,
  Moon,
  Sparkles,
  Ticket,
  Twitch,
  type LucideIcon,
} from "lucide-react";

/**
 * Base de datos de enlaces externos del pie de página.
 * Fuente única: CSV de contacto MOONØ.LAB (categoría, nombre, URL, handle, descripción).
 * Los iconos de marca (Dribbble, Twitch) vienen de lucide; el resto, iconos semánticos.
 */
export type FooterContactLink = {
  name: string;
  url: string;
  handle: string;
  description: string;
  icon: LucideIcon;
};

export type FooterLinkGroup = {
  category: string;
  links: FooterContactLink[];
};

export const FOOTER_LINK_GROUPS: FooterLinkGroup[] = [
  {
    category: "Portafolio",
    links: [
      {
        name: "Dribbble",
        url: "https://dribbble.com/UnhigoStudio",
        handle: "@UnhigoStudio",
        description: "Estudio de diseño y UI/UX",
        icon: Dribbble,
      },
    ],
  },
  {
    category: "Redes Sociales",
    links: [
      {
        name: "Twitch",
        url: "https://www.twitch.tv/unhigomakers",
        handle: "@unhigomakers",
        description: "Directos de desarrollo y maker",
        icon: Twitch,
      },
    ],
  },
  {
    category: "Monetización",
    links: [
      {
        name: "Stripe",
        url: "https://stripe.com",
        handle: "@juananguirao",
        description: "Pasarela de pagos y monetización",
        icon: CreditCard,
      },
    ],
  },
  {
    category: "Inteligencia Artificial",
    links: [
      {
        name: "Claude Sonnet 5.5 (Poe)",
        url: "https://poe.com/Claude-Sonnet-5.5",
        handle: "Claude Sonnet 5.5",
        description: "Modelo LLM avanzado en Poe",
        icon: Sparkles,
      },
      {
        name: "Invitación Poe",
        url: "https://poe.com/invite/c27d7e81ac184e2e88bf21c1e5ca0913",
        handle: "Poe Invite",
        description: "Enlace de invitación a plataforma Poe",
        icon: Ticket,
      },
    ],
  },
  {
    category: "Referidos",
    links: [
      {
        name: "Manus AI",
        url: "https://manus.im/invitation/MZHUIKIINNGC?utm_source=invitation&utm_medium=social&utm_campaign=copy_link",
        handle: "Manus Invites",
        description: "Acceso de invitación a plataforma de agentes IA",
        icon: Bot,
      },
      {
        name: "Lunar Cyber",
        url: "https://lunarcyber.com/?affID=LN7PZP3FSN",
        handle: "Lunar Cyber",
        description: "Enlace de afiliado y cyber herramientas",
        icon: Moon,
      },
      {
        name: "FreeBuff",
        url: "https://freebuff.com/?ref=ref-0777a7f6-c9df-4df2-80d0-dc6a1628b34e",
        handle: "FreeBuff",
        description: "Plataforma de recursos y herramientas",
        icon: Layers,
      },
    ],
  },
];

/**
 * Widgets e incrustados oficiales — badges externos con dimensiones fijas
 * para evitar saltos de layout (CLS). Render con loading="lazy".
 */
export type OfficialBadge = {
  id: string;
  label: string;
  href: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  imgClassName: string;
};

export const OFFICIAL_BADGES: OfficialBadge[] = [
  {
    id: "product-hunt",
    label: "Product Hunt — Follow",
    href: "https://www.producthunt.com/products/generador-de-calendarios-lunares?utm_source=badge-follow&utm_medium=badge",
    src: "https://api.producthunt.com/widgets/embed-image/v1/follow.svg?product_id=1169144&theme=dark",
    alt: "Generador de Calendarios Lunares - Product Hunt",
    width: 230,
    height: 50,
    imgClassName: "h-[50px] w-[230px]",
  },
  {
    id: "peerpush-lunacal",
    label: "LunaCal on PeerPush",
    href: "https://peerpush.com/p/lunacal-generate-a-moon-calendars",
    src: "https://peerpush.com/p/lunacal-generate-a-moon-calendars/badge.png",
    alt: "LunaCal on PeerPush",
    width: 220,
    imgClassName: "w-[220px] h-auto",
  },
  {
    id: "dang",
    label: "Verified on DANG!",
    href: "https://dang.ai/tool/lunar-phase-editor-lunar-calendar-generator",
    src: "https://pbs.twimg.com/media/HTHGO5NWwAAb-PN?format=png&name=900x900",
    alt: "Verified on DANG!",
    height: 80,
    imgClassName: "h-20 w-auto",
  },
];

/** Muzli Picks — insignia verificada sin markup de imagen (chip de texto). */
export const MUZLI_PICKS = {
  label: "Muzli Picks",
  href: "https://muz.li/picks/",
} as const;

/** Botón de chat directo por WhatsApp. */
export const WHATSAPP = {
  label: "Chat directo",
  phone: "+34 613 57 30 82",
  href: "https://wa.me/34613573082",
} as const;
