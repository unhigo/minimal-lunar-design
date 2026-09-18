/**
 * Collections (save-for-later) hook: localStorage-backed.
 *
 * State transitions live in the pure `collections-core.ts` module; this hook
 * only wires React state, persistence and cross-hook notifications around
 * them. The public API is unchanged, so no component needs edits.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COLLECTIONS_KEY,
  EMPTY_COLLECTIONS,
  entryKey,
  applySave,
  applyUnsave,
  applyCreateCollection,
  applyDeleteCollection,
  applyMoveTo,
  type CollectionsState,
  type SaveKind,
} from "./collections-core";

function load(): CollectionsState {
  if (typeof window === "undefined") return EMPTY_COLLECTIONS;
  try {
    const raw = window.localStorage.getItem(COLLECTIONS_KEY);
    if (!raw) return EMPTY_COLLECTIONS;
    const parsed = JSON.parse(raw) as CollectionsState;
    return {
      saved: parsed.saved ?? {},
      collections: parsed.collections ?? [],
    };
  } catch {
    return EMPTY_COLLECTIONS;
  }
}

function persist(state: CollectionsState) {
  try {
    window.localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — degrade silently.
  }
}

const listeners = new Set<() => void>();

export function useCollections() {
  const [state, setState] = useState<CollectionsState>(load);

  // Cross-hook sync: one instance writes, the others reload from storage.
  useEffect(() => {
    const listener = () => setState(load());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const save = useCallback(
    (kind: SaveKind, id: string, collectionId?: string) => {
      const next = applySave(load(), kind, id, collectionId);
      persist(next);
      setState(next);
      for (const l of listeners) l();
    },
    [],
  );

  const unsave = useCallback((kind: SaveKind, id: string) => {
    const next = applyUnsave(load(), kind, id);
    persist(next);
    setState(next);
    for (const l of listeners) l();
  }, []);

  const toggle = useCallback(
    (kind: SaveKind, id: string) => {
      if (state.saved[entryKey(kind, id)]) unsave(kind, id);
      else save(kind, id);
    },
    [state, save, unsave],
  );

  const isSaved = useCallback(
    (kind: SaveKind, id: string) => Boolean(state.saved[entryKey(kind, id)]),
    [state],
  );

  const createCollection = useCallback((name: string) => {
    const next = applyCreateCollection(load(), name);
    persist(next);
    setState(next);
    for (const l of listeners) l();
  }, []);

  const deleteCollection = useCallback((collectionId: string) => {
    const next = applyDeleteCollection(load(), collectionId);
    persist(next);
    setState(next);
    for (const l of listeners) l();
  }, []);

  const moveTo = useCallback(
    (kind: SaveKind, id: string, collectionId: string | null) => {
      const next = applyMoveTo(load(), kind, id, collectionId);
      persist(next);
      setState(next);
      for (const l of listeners) l();
    },
    [],
  );

  const savedCount = Object.keys(state.saved).length;

  /** Flattened saved entries, newest first, for collection pages. */
  const savedEntries = useMemo(
    () =>
      Object.entries(state.saved)
        .map(([key, value]) => {
          const [kind, ...rest] = key.split(":");
          return {
            key,
            kind: kind as SaveKind,
            id: rest.join(":"),
            collectionId: value.collectionId,
            savedAt: value.savedAt,
          };
        })
        .sort((a, b) => b.savedAt - a.savedAt),
    [state.saved],
  );

  return {
    savedCount,
    savedEntries,
    collections: state.collections,
    save,
    unsave,
    toggle,
    isSaved,
    createCollection,
    deleteCollection,
    moveTo,
  };
}
