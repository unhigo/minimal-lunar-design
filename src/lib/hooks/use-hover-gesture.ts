/**
 * useHoverGesture — hover enter/leave that respects pointer capabilities.
 *
 * A finger cannot hover: touch pointers must never set a hover state (their
 * "leave" fires on lift, which would instantly clear a tick the tap chose).
 * Mouse and pen hover normally; the hook also tolerates browsers that do not
 * report `hover` media support by trusting the pointer type alone.
 */
import { useCallback } from "react";

export interface HoverLeaveEvent {
  pointerType?: string;
}

export interface HoverEnterEvent {
  pointerType?: string;
}

export function useHoverGesture() {
  const isHoverPointer = useCallback((pointerType?: string) => {
    // Pen and mouse hover; touch (and unknown) does not.
    return pointerType === "mouse" || pointerType === "pen";
  }, []);

  /** True when this enter event should set a hover state. */
  const enter = useCallback(
    (event: HoverEnterEvent) => isHoverPointer(event.pointerType),
    [isHoverPointer],
  );

  /**
   * True when this leave event should clear a hover state. Touch leave
   * (finger lift) never clears — the outside-tap dismissal owns that path.
   */
  const leave = useCallback(
    (event: HoverLeaveEvent) => isHoverPointer(event.pointerType),
    [isHoverPointer],
  );

  return { enter, leave };
}
