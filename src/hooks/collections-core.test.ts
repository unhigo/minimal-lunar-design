import { describe, expect, it } from "vitest";
import {
  EMPTY_COLLECTIONS,
  applyCreateCollection,
  applyDeleteCollection,
  applyMoveTo,
  applySave,
  applyToggle,
  applyUnsave,
  entryKey,
} from "./collections-core";

const saved = (collectionId: string | null, savedAt = 1) => ({
  collectionId,
  savedAt,
});

describe("entryKey", () => {
  it("joins kind and id with a colon", () => {
    expect(entryKey("tool", "figma")).toBe("tool:figma");
    expect(entryKey("resource", "abc/def:id")).toBe("resource:abc/def:id");
  });
});

describe("applySave / applyUnsave / applyToggle", () => {
  it("save adds an entry with null collection by default", () => {
    const next = applySave(EMPTY_COLLECTIONS, "tool", "t-01");
    expect(next.saved["tool:t-01"]).toEqual({
      collectionId: null,
      savedAt: expect.any(Number),
    });
    expect(next.collections).toEqual([]);
  });

  it("save accepts a target collection", () => {
    const next = applySave(EMPTY_COLLECTIONS, "tool", "t-01", "c-1");
    expect(next.saved["tool:t-01"].collectionId).toBe("c-1");
  });

  it("unsave removes only the targeted entry", () => {
    const state = {
      saved: {
        "tool:t-01": saved(null),
        "project:p-01": saved("c-1"),
      },
      collections: [],
    };
    const next = applyUnsave(state, "tool", "t-01");
    expect(next.saved["tool:t-01"]).toBeUndefined();
    expect(next.saved["project:p-01"]).toEqual(saved("c-1"));
  });

  it("unsave on a missing entry is a no-op", () => {
    expect(applyUnsave(EMPTY_COLLECTIONS, "tool", "t-404").saved).toEqual({});
  });

  it("toggle saves an unsaved entry and unsaves a saved one", () => {
    const afterSave = applyToggle(EMPTY_COLLECTIONS, "inspiration", "i-03");
    expect(afterSave.saved["inspiration:i-03"]).toBeDefined();

    const afterToggle = applyToggle(afterSave, "inspiration", "i-03");
    expect(afterToggle.saved["inspiration:i-03"]).toBeUndefined();
  });

  it("transitions are immutable: input state is never mutated", () => {
    const state = {
      saved: { "tool:t-01": saved(null) },
      collections: [],
    };
    const snapshot = JSON.stringify(state);
    applySave(state, "tool", "t-02");
    applyUnsave(state, "tool", "t-01");
    applyToggle(state, "tool", "t-01");
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe("applyCreateCollection", () => {
  it("appends a collection with trimmed name", () => {
    const next = applyCreateCollection(EMPTY_COLLECTIONS, "  Tipografía  ");
    expect(next.collections).toHaveLength(1);
    expect(next.collections[0].name).toBe("Tipografía");
    expect(next.collections[0].id).toMatch(/^c-/);
    expect(next.collections[0].items).toEqual([]);
  });

  it("falls back to a default name for blank input", () => {
    const next = applyCreateCollection(EMPTY_COLLECTIONS, "   ");
    expect(next.collections[0].name).toBe("Nueva colección");
  });
});

describe("applyDeleteCollection", () => {
  it("keeps saved entries but clears their collection membership", () => {
    const state = {
      saved: {
        "tool:t-01": saved("c-1"),
        "tool:t-02": saved("c-2"),
        "article:a-01": saved(null),
      },
      collections: [
        { id: "c-1", name: "Una", items: [], createdAt: 1 },
        { id: "c-2", name: "Dos", items: [], createdAt: 2 },
      ],
    };
    const next = applyDeleteCollection(state, "c-1");
    expect(next.collections.map((c) => c.id)).toEqual(["c-2"]);
    // Regression guard: items must remain saved, just unmapped.
    expect(next.saved["tool:t-01"]).toEqual({ collectionId: null, savedAt: 1 });
    expect(next.saved["tool:t-02"]).toEqual({ collectionId: "c-2", savedAt: 1 });
    expect(next.saved["article:a-01"]).toEqual(saved(null));
  });

  it("deleting an unknown collection is a no-op", () => {
    const next = applyDeleteCollection(EMPTY_COLLECTIONS, "c-404");
    expect(next).toEqual(EMPTY_COLLECTIONS);
  });
});

describe("applyMoveTo", () => {
  it("moves a saved entry into a collection", () => {
    const state = { saved: { "tool:t-01": saved(null) }, collections: [] };
    const next = applyMoveTo(state, "tool", "t-01", "c-9");
    expect(next.saved["tool:t-01"].collectionId).toBe("c-9");
    expect(next.saved["tool:t-01"].savedAt).toBe(1);
  });

  it("moving an unsaved entry is a no-op", () => {
    const next = applyMoveTo(EMPTY_COLLECTIONS, "tool", "t-404", "c-1");
    expect(next).toEqual(EMPTY_COLLECTIONS);
  });
});
