/**
 * Brand source of truth — MOONØ.LAB™ (brand guidelines §1–§38).
 * Change it here and every page, meta tag and footer follows.
 */
export const BRAND = {
  name: "MOONØ.LAB",
  mark: "MOONØ.LAB™",
  /** §11 principal tagline. */
  tagline: "Observe. Explore. Create.",
  /** §10/§31 brand statement (hero subhead). */
  statement: "A digital laboratory for tools, data and creative technology.",
  statementEs:
    "Un laboratorio digital para explorar herramientas, datos y tecnología creativa.",
  /** §36 manifesto lines — short, verb-first copy style (§27). */
  manifesto: [
    { verb: "Observe.", line: "Look closer." },
    { verb: "Explore.", line: "Follow the pattern." },
    { verb: "Experiment.", line: "Test the idea." },
    { verb: "Create.", line: "Turn it into a tool." },
    { verb: "Connect.", line: "Build the system." },
  ],
  /** §34 master description (long, ES) — used in meta/footer contexts. */
  description:
    "MOONØ.LAB es un laboratorio digital centrado en la curiosidad, la observación y la experimentación. Herramientas digitales, datos, cartografía, astronomía, diseño y tecnología creativa para explorar, visualizar y comprender sistemas complejos.",
  footerLine: "MOONØ.LAB™ · Observe. Explore. Create.",
  /** Default page title used by index.html and meta fallbacks. */
  defaultTitle: "MOONØ.LAB™ — Digital Laboratory",
  descriptionShort:
    "Laboratorio digital de herramientas, datos, tecnología creativa y experimentación.",
} as const;
