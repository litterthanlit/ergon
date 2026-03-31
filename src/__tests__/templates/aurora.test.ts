import { describe, it, expect } from "vitest";
import { aurora } from "@/lib/templates/aurora";
import { validateParamSchema, getDefaultValues } from "@/lib/types";

describe("aurora template", () => {
  it("has required metadata", () => {
    expect(aurora.name).toBe("Aurora");
    expect(aurora.description).toBeDefined();
    expect(typeof aurora.code).toBe("string");
  });

  it("has a valid parameter schema", () => {
    expect(validateParamSchema(aurora.schema)).toBe(true);
  });

  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(aurora.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });

  it("has a gradient parameter with valid defaults", () => {
    const defaults = getDefaultValues(aurora.schema);
    expect(defaults).toHaveProperty("gradient");
    const grad = defaults.gradient as Array<{ color: string; position: number }>;
    expect(Array.isArray(grad)).toBe(true);
    expect(grad.length).toBeGreaterThan(0);
    for (const stop of grad) {
      expect(typeof stop.color).toBe("string");
      expect(typeof stop.position).toBe("number");
    }
  });

  it("code contains ergon.params() call", () => {
    expect(aurora.code).toContain("ergon.params(");
  });

  it("code contains setup and draw functions", () => {
    expect(aurora.code).toContain("function setup");
    expect(aurora.code).toContain("function draw");
  });
});
