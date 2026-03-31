import { describe, it, expect } from "vitest";
import { particles } from "@/lib/templates/particles";
import { validateParamSchema, getDefaultValues } from "@/lib/types";

describe("particles template", () => {
  it("has required metadata", () => {
    expect(particles.name).toBe("Particles");
    expect(particles.description).toBeDefined();
    expect(typeof particles.code).toBe("string");
  });

  it("has a valid parameter schema", () => {
    expect(validateParamSchema(particles.schema)).toBe(true);
  });

  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(particles.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });

  it("has range, color, and boolean params", () => {
    const defaults = getDefaultValues(particles.schema);
    expect(defaults).toHaveProperty("sizeRange");
    const sr = defaults.sizeRange as { min: number; max: number };
    expect(typeof sr.min).toBe("number");
    expect(typeof sr.max).toBe("number");
    expect(sr.min).toBeLessThan(sr.max);

    expect(defaults).toHaveProperty("trailColor");
    expect(typeof defaults.trailColor).toBe("string");

    expect(defaults).toHaveProperty("repel");
    expect(typeof defaults.repel).toBe("boolean");
  });

  it("code contains ergon.params() call", () => {
    expect(particles.code).toContain("ergon.params(");
  });

  it("code contains setup and draw functions", () => {
    expect(particles.code).toContain("function setup");
    expect(particles.code).toContain("function draw");
  });
});
