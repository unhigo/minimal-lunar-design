/**
 * useTapGesture — records the pointer gesture behind a click.
 *
 * A `click` event carries no pointerType, so the `pointerdown` right before
 * it is what says whether the activation was a tap (touch/pen) or a mouse
 * click. Keyboard activation has no pointer at all.
 *
 * Semantics:
 * · start(event, state?) — record the pointer gesture (optionally noting a
 *   pre-existing state the gesture is aimed at, e.g. a tick already pinned).
 * · take() — consume the record inside `click`; returns null when there was
 *   no pointer behind the activation (keyboard) or it was already consumed.
 * · drop() — discard the record: the gesture was cancelled (pointercancel)
 *   or superseded (a key press starts an activation with no pointer behind
 *   it, and a stale record must not read as a tap of its own).
 *
 * The stored `state` lets consumers distinguish "first tap on an item with
 * state X" from "second tap on the same item" (double-tap-to-activate flows).
 */
import { useCallback, useRef } from "react";

export interface TapStartEvent {
  pointerType?: string;
}

export interface TapRecord<T> {
  pointerType: string | undefined;
  /** State captured at pointerdown (before the click handler runs). */
  state: T | null;
}

export function useTapGesture<T = unknown>() {
  const record = useRef<TapRecord<T> | null>(null);

  const start = useCallback(
    (event: TapStartEvent, state: T | null = null) => {
      record.current = { pointerType: event.pointerType, state };
    },
    [],
  );

  const take = useCallback((): TapRecord<T> | null => {
    const current = record.current;
    record.current = null;
    return current;
  }, []);

  const drop = useCallback(() => {
    record.current = null;
  }, []);

  return { start, take, drop };
}
