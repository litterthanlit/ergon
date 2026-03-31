import { describe, it, expect } from "vitest";
import { spiral } from "@/lib/templates/spiral";
import { validateParamSchema, getDefaultValues } from "@/lib/types";

describe("spiral template", () => {
  it("has required metadata", () => {
    expect(spiral.name).toBe("Spiral");
    expect(spiral.description).toBeDefined();
    expect(typeof spiral.code).toBe("string");
  });

  it("has a valid parameter schema", () => {
    expect(validateParamSchema(spiral.schema)).toBe(true);
  });

  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(spiral.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });

  it("has sensible default values", () => {
    const defaults = getDefaultValues(spiral.schema);
    expect(defaults).toHaveProperty("arms");
    expect(defaults).toHaveProperty("tightness");
    expect(defaults).toHaveProperty("points");
    expect(defaults).toHaveProperty("hueShift");
  });

  it("code contains ergon.params() call", () => {
    expect(spiral.code).toContain("ergon.params(");
  });

  it("code contains setup and draw functions", () => {
    expect(spiral.code).toContain("function setup");
    expect(spiral.code).toContain("function draw");
  });
});
