import { describe, it, expect, vi } from "vitest";
import { createParamManager } from "@/runtime/params";

describe("createParamManager", () => {
  it("returns default values from schema", () => {
    const onSchema = vi.fn();
    const manager = createParamManager(onSchema);
    const params = manager.register({
      count: { type: "number", min: 0, max: 100, default: 50, step: 1, label: "Count" },
    });
    expect(params.count).toBe(50);
  });

  it("calls onSchema callback with the schema", () => {
    const onSchema = vi.fn();
    const manager = createParamManager(onSchema);
    const schema = {
      speed: { type: "number" as const, min: 0, max: 10, default: 5, step: 0.1, label: "Speed" },
    };
    manager.register(schema);
    expect(onSchema).toHaveBeenCalledWith(schema);
  });

  it("updates values when update() is called", () => {
    const onSchema = vi.fn();
    const manager = createParamManager(onSchema);
    const params = manager.register({
      count: { type: "number", min: 0, max: 100, default: 50, step: 1, label: "Count" },
    });
    expect(params.count).toBe(50);
    manager.update({ count: 75 });
    expect(params.count).toBe(75);
  });

  it("ignores updates for unknown keys", () => {
    const onSchema = vi.fn();
    const manager = createParamManager(onSchema);
    const params = manager.register({
      count: { type: "number", min: 0, max: 100, default: 50, step: 1, label: "Count" },
    });
    manager.update({ count: 75, unknown: 999 });
    expect(params.count).toBe(75);
    expect((params as Record<string, unknown>).unknown).toBeUndefined();
  });
});
