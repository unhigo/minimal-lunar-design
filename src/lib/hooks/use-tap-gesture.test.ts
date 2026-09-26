// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTapGesture } from "./use-tap-gesture";

describe("useTapGesture", () => {
  it("returns null before any pointerdown", () => {
    const { result } = renderHook(() => useTapGesture<boolean>());
    expect(result.current.take()).toBeNull();
  });

  it("take() consumes the record exactly once", () => {
    const { result } = renderHook(() => useTapGesture<boolean>());
    act(() => result.current.start({ pointerType: "touch" }, true));
    expect(result.current.take()).toEqual({
      pointerType: "touch",
      state: true,
    });
    expect(result.current.take()).toBeNull();
  });

  it("drop() discards a pending record (pointercancel / key activation)", () => {
    const { result } = renderHook(() => useTapGesture<boolean>());
    act(() => result.current.start({ pointerType: "touch" }));
    act(() => result.current.drop());
    expect(result.current.take()).toBeNull();
  });

  it("mouse gestures are recorded but read as non-tap by consumers", () => {
    const { result } = renderHook(() => useTapGesture<boolean>());
    act(() => result.current.start({ pointerType: "mouse" }, false));
    const gesture = result.current.take();
    expect(gesture).not.toBeNull();
    expect(gesture?.pointerType).toBe("mouse");
  });

  it("keyboard activation (no pointerdown) yields null — never a tap", () => {
    const { result } = renderHook(() => useTapGesture<boolean>());
    // No start() call: the click handler reads take() === null.
    expect(result.current.take()).toBeNull();
  });

  it("a fresh pointerdown replaces a stale record", () => {
    const { result } = renderHook(() => useTapGesture<boolean>());
    act(() => result.current.start({ pointerType: "touch" }, true));
    act(() => result.current.start({ pointerType: "pen" }, false));
    expect(result.current.take()).toEqual({
      pointerType: "pen",
      state: false,
    });
  });
});
