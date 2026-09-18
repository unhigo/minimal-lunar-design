/**
 * Pure state transitions for the collections store (no React, no storage).
 *
 * Extracted from `use-collections.ts` so the logic can be unit-tested
 * directly and the hook can keep its `setState` updaters pure (React may
 * invoke updaters twice under StrictMode, so side effects live in the hook,
 * never here).
 */

export const COLLECTIONS_KEY = "mld.collections.v1";

export interface Collection {
  id: string;
  name: string;
  /** Informational only; membership actually lives on each saved entry. */
  items: string[];
  createdAt: number;
}

export type SaveKind =
  | "tool"
  | "resource"
  | "inspiration"
  | "project"
  | "article"
  | "creator";

export interface CollectionsState {
  saved: Record<string, { collectionId: string | null; savedAt: number }>;
  collections: Collection[];
}

export const EMPTY_COLLECTIONS: CollectionsState = {
  saved: {},
  collections: [],
};

export function entryKey(kind: SaveKind, id: string): string {
  return `${kind}:${id}`;
}

export function applySave(
  state: CollectionsState,
  kind: SaveKind,
  id: string,
  collectionId?: string,
): CollectionsState {
  return {
    ...state,
    saved: {
      ...state.saved,
      [entryKey(kind, id)]: {
        collectionId: collectionId ?? null,
        savedAt: Date.now(),
      },
    },
  };
}

export function applyUnsave(
  state: CollectionsState,
  kind: SaveKind,
  id: string,
): CollectionsState {
  const saved = { ...state.saved };
  delete saved[entryKey(kind, id)];
  return { ...state, saved };
}

export function applyToggle(
  state: CollectionsState,
  kind: SaveKind,
  id: string,
): CollectionsState {
  return state.saved[entryKey(kind, id)]
    ? applyUnsave(state, kind, id)
    : applySave(state, kind, id);
}

export function applyCreateCollection(
  state: CollectionsState,
  name: string,
): CollectionsState {
  const collection: Collection = {
    id: `c-${Date.now().toString(36)}`,
    name: name.trim() || "Nueva colección",
    items: [],
    createdAt: Date.now(),
  };
  return { ...state, collections: [...state.collections, collection] };
}

/**
 * Deleting a collection keeps its items saved: membership resets to
 * "sin colección" instead of dropping the saved entries entirely.
 */
export function applyDeleteCollection(
  state: CollectionsState,
  collectionId: string,
): CollectionsState {
  const saved = Object.fromEntries(
    Object.entries(state.saved).map(([key, value]) => [
      key,
      value.collectionId === collectionId
        ? { ...value, collectionId: null }
        : value,
    ]),
  );
  return {
    saved,
    collections: state.collections.filter((c) => c.id !== collectionId),
  };
}

export function applyMoveTo(
  state: CollectionsState,
  kind: SaveKind,
  id: string,
  collectionId: string | null,
): CollectionsState {
  const current = state.saved[entryKey(kind, id)];
  if (!current) return state;
  return {
    ...state,
    saved: {
      ...state.saved,
      [entryKey(kind, id)]: { ...current, collectionId },
    },
  };
}
