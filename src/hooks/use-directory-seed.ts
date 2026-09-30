/**
 * Former visitor-triggered seed — now a no-op (security hardening).
 *
 * Seeding the directory is an explicit ADMIN action from /admin
 * (api.tools.seedAdminFromCatalog). Public pages must never write to the
 * database: any visitor could have poisoned the catalog while it was empty.
 * The hook keeps a compatible call signature so pages don't need edits.
 */
export function useDirectorySeed(): "idle" {
  return "idle";
}
