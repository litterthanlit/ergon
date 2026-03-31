import { describe, it, expect } from "vitest";
import { createHistory } from "@/lib/history";

describe("createHistory", () => {
  it("starts with initial state and cannot undo", () => {
    const h = createHistory({ a: 1 });
    expect(h.current()).toEqual({ a: 1 });
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);
  });

  it("tracks pushes and supports undo", () => {
    const h = createHistory({ a: 1 });
    h.push({ a: 2 });
    h.push({ a: 3 });
    expect(h.current()).toEqual({ a: 3 });
    expect(h.canUndo()).toBe(true);
    const prev = h.undo();
    expect(prev).toEqual({ a: 2 });
    expect(h.canRedo()).toBe(true);
  });

  it("supports redo after undo", () => {
    const h = createHistory({ a: 1 });
    h.push({ a: 2 });
    h.undo();
    const next = h.redo();
    expect(next).toEqual({ a: 2 });
    expect(h.canRedo()).toBe(false);
  });

  it("clears redo stack on new push after undo", () => {
    const h = createHistory({ a: 1 });
    h.push({ a: 2 });
    h.push({ a: 3 });
    h.undo();
    h.push({ a: 4 });
    expect(h.canRedo()).toBe(false);
    expect(h.current()).toEqual({ a: 4 });
  });

  it("respects max size", () => {
    const h = createHistory({ a: 0 }, 3);
    h.push({ a: 1 });
    h.push({ a: 2 });
    h.push({ a: 3 });
    expect(h.current()).toEqual({ a: 3 });
    h.undo();
    h.undo();
    expect(h.canUndo()).toBe(false);
    expect(h.current()).toEqual({ a: 1 });
  });

  it("reset clears all history", () => {
    const h = createHistory({ a: 1 });
    h.push({ a: 2 });
    h.push({ a: 3 });
    h.reset({ a: 10 });
    expect(h.current()).toEqual({ a: 10 });
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);
  });
});
