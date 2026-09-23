/**
 * Pure helpers for the lunar tools directory. Kept free of Convex/React
 * imports so both the backend functions and unit tests can use them.
 */

/** Lowercase, strip accents, collapse separators, cap at 60 chars. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Map the /submit wizard pricing ids to directory pricing values. */
export function pricingFromSubmitCategory(
  submitPricing: string,
): "free" | "freemium" | "open-source" | "paid" {
  switch (submitPricing) {
    case "free":
      return "free";
    case "freemium":
      return "freemium";
    case "one-time":
    case "subscription":
    default:
      return "paid";
  }
}

/** Map submit wizard categories to directory categories. */
export function mapSubmitCategoryToDirectory(category: string): string {
  if (category === "ai") return "ia";
  return category;
}

/**
 * Map the curated static catalog categories (UI/UX, AI, Iconos…) onto the
 * directory's canonical category set so seeded tools respond to the
 * /tools category filters.
 */
const SEED_CATEGORY_MAP: Record<string, string> = {
  "AI": "ia",
  "Diseño": "diseño",
  "UI/UX": "diseño",
  "Color": "color",
  "Tipografía": "tipografía",
  "Iconos": "diseño",
  "Imagen": "imagen",
  "Motion": "diseño",
  "3D": "3d",
  "Astronomía": "astronomía",
  "Fotografía": "fotografía",
  "Código": "código",
  "No-code": "no-code",
  "Productividad": "productividad",
};

export function mapSeedCategoryToDirectory(category: string): string {
  return SEED_CATEGORY_MAP[category] ?? category.toLowerCase();
}
