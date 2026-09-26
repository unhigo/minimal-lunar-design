/**
 * Motion tokens — beui Motion Guides (https://beui.dev/docs/motion-patterns).
 *
 * · EASE_OUT: entrances and exits that respond immediately, then settle quietly.
 * · EASE_IN_OUT: objects already on screen moving between positions.
 * · SPRING_PRESS: fast, weighted feedback for pressable surfaces.
 * · SPRING_LAYOUT: shared surfaces and indicators that preserve spatial
 *   continuity (shared layout transitions, ticks, cards that travel).
 *
 * Every consumer must stay reduced-motion safe: gate travel/scale/blur behind
 * useReducedMotion() and keep opacity/color feedback.
 */

/** Entrance/exit easing — responds at once, settles without bounce. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Symmetric easing for on-screen position changes. */
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

/** Press feedback — immediate and physical (100–160ms feel). */
export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

/** Shared-layout continuity — moves the surface, not the eye. */
export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.9,
} as const;
