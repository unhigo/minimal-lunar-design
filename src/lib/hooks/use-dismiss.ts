/**
 * useDismiss — outside-tap + Escape dismissal for ephemeral UI.
 *
 * While `active`, the next pointerdown outside `rootRef` (and the Escape key)
 * invokes `onDismiss`. Pointerdown — not click — so the consumer's own
 * click/tap handling elsewhere still receives the event: the dismissal
 * "stands in for the pointer leaving" without swallowing the tap.
 */
import { type RefObject, useEffect } from "react";

export function useDismiss(
  active: boolean,
  onDismiss: () => void,
  rootRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        onDismiss();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, onDismiss, rootRef]);
}
