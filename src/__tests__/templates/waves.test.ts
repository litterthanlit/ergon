import { describe, it, expect } from "vitest";
import { waves } from "@/lib/templates/waves";
import { validateParamSchema, getDefaultValues } from "@/lib/types";

describe("waves template", () => {
  it("has required metadata", () => {
    expect(waves.name).toBe("Waves");
    expect(waves.description).toBeDefined();
    expect(typeof waves.code).toBe("string");
  });

  it("has a valid parameter schema", () => {
    expect(validateParamSchema(waves.schema)).toBe(true);
  });

  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(waves.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });

  it("has color and boolean params", () => {
    const defaults = getDefaultValues(waves.schema);
    expect(defaults).toHaveProperty("strokeColor");
    expect(typeof defaults.strokeColor).toBe("string");
    expect(defaults).toHaveProperty("fill");
    expect(typeof defaults.fill).toBe("boolean");
  });

  it("code contains ergon.params() call", () => {
    expect(waves.code).toContain("ergon.params(");
  });

  it("code contains setup and draw functions", () => {
    expect(waves.code).toContain("function setup");
    expect(waves.code).toContain("function draw");
  });
});
