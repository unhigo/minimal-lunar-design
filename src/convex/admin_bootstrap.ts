/**
 * Admin bootstrap primitives — pure and testable.
 *
 * The secret itself lives ONLY in the server environment
 * (ADMIN_BOOTSTRAP_SECRET, set with `npx convex env set`). Nothing here is
 * shipped to the client: this module is imported by Convex functions only.
 */

/** systemFlags key that latches the one-shot admin bootstrap. */
export const ADMIN_BOOTSTRAP_FLAG = "admin.bootstrap.used";

/**
 * Constant-time string comparison without node:crypto (Convex runtime safe).
 * Length is not leaked: the loop always walks max(a, b) characters.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
