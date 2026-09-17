/**
 * Collections (save-for-later) MVP: localStorage-backed.
 *
 * Designed so the storage backend can later swap to Convex without changing
 * the component contract: components call `save`, `unsave`, `isSaved`,
 * `createCollection`, etc. and never touch storage directly.
 */

import { useCallback, useEffect, useState } from "react";

const KEY = "mld.collections.v1";

export interface Collection {
  id: string;
  name: string;
  /** `${kind}:${id}` entries, e.g. "tool:figma" or "inspiration:i-03". */
  items: string[];
  createdAt: number;
}

export type SaveKind = "tool" | "resource" | "inspiration" | "project" | "article";

interface CollectionsState {
  saved: Record<string, { collectionId: string | null; savedAt: number }>;
  collections: Collection[];
}

const EMPTY: CollectionsState = { saved: {}, collections: [] };

function load(): CollectionsState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CollectionsState;
    return {
      saved: parsed.saved ?? {},
      collections: parsed.collections ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function persist(state: CollectionsState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — degrade silently.
  }
}

const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function useCollections() {
  const [state, setState] = useState<CollectionsState>(load);

  useEffect(() => {
    const listener = () => setState(load());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const entryKey = (kind: SaveKind, id: string) => `${kind}:${id}`;

  const save = useCallback((kind: SaveKind, id: string, collectionId?: string) => {
    setState((prev) => {
      const k = entryKey(kind, id);
      const next: CollectionsState = {
        ...prev,
        saved: {
          ...prev.saved,
          [k]: { collectionId: collectionId ?? null, savedAt: Date.now() },
        },
      };
      persist(next);
      notify();
      return next;
    });
  }, []);

  const unsave = useCallback((kind: SaveKind, id: string) => {
    setState((prev) => {
      const k = entryKey(kind, id);
      const saved = { ...prev.saved };
      delete saved[k];
      const next: CollectionsState = { ...prev, saved };
      persist(next);
      notify();
      return next;
    });
  }, []);

  const toggle = useCallback(
    (kind: SaveKind, id: string) => {
      const k = entryKey(kind, id);
      if (state.saved[k]) unsave(kind, id);
      else save(kind, id);
    },
    [state, save, unsave],
  );

  const isSaved = useCallback(
    (kind: SaveKind, id: string) => Boolean(state.saved[entryKey(kind, id)]),
    [state],
  );

  const createCollection = useCallback((name: string) => {
    setState((prev) => {
      const collection: Collection = {
        id: `c-${Date.now().toString(36)}`,
        name: name.trim() || "Nueva colección",
        items: [],
        createdAt: Date.now(),
      };
      const next: CollectionsState = {
        ...prev,
        collections: [...prev.collections, collection],
      };
      persist(next);
      notify();
      return next;
    });
  }, []);

  const deleteCollection = useCallback((collectionId: string) => {
    setState((prev) => {
      const saved = Object.fromEntries(
        Object.entries(prev.saved).filter(
          ([, v]) => v.collectionId !== collectionId,
        ),
      );
      const next: CollectionsState = {
        saved,
        collections: prev.collections.filter((c) => c.id !== collectionId),
      };
      persist(next);
      notify();
      return next;
    });
  }, []);

  const moveTo = useCallback(
    (kind: SaveKind, id: string, collectionId: string | null) => {
      setState((prev) => {
        const k = entryKey(kind, id);
        const current = prev.saved[k];
        if (!current) return prev;
        const next: CollectionsState = {
          ...prev,
          saved: { ...prev.saved, [k]: { ...current, collectionId } },
        };
        persist(next);
        notify();
        return next;
      });
    },
    [],
  );

  const savedCount = Object.keys(state.saved).length;

  return {
    savedCount,
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
