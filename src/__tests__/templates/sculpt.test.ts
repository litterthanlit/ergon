import { describe, it, expect } from "vitest";
import { sculpt } from "@/lib/templates/sculpt";
import { validateParamSchema, getDefaultValues } from "@/lib/types";

describe("sculpt template", () => {
  it("has required metadata", () => {
    expect(sculpt.name).toBe("Sculpt");
    expect(sculpt.description).toBeDefined();
    expect(sculpt.code).toBeDefined();
    expect(typeof sculpt.code).toBe("string");
  });

  it("has a valid parameter schema", () => {
    expect(validateParamSchema(sculpt.schema)).toBe(true);
  });

  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(sculpt.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });

  it("has sensible default values", () => {
    const defaults = getDefaultValues(sculpt.schema);
    expect(defaults).toHaveProperty("detail");
    expect(defaults).toHaveProperty("displacement");
    expect(defaults).toHaveProperty("speed");
    expect(defaults).toHaveProperty("smoothness");
    expect(defaults).toHaveProperty("palette");
  });

  it("code contains ergon.params() call", () => {
    expect(sculpt.code).toContain("ergon.params(");
  });

  it("code contains setup and draw functions", () => {
    expect(sculpt.code).toContain("function setup");
    expect(sculpt.code).toContain("function draw");
  });

  it("uses WEBGL renderer", () => {
    expect(sculpt.code).toContain("WEBGL");
  });

  it("uses specularMaterial for 3D shading", () => {
    expect(sculpt.code).toContain("specularMaterial");
  });

  it("has composition hint", () => {
    expect(sculpt.compositionHint).toBeDefined();
    expect(sculpt.compositionHint?.blendMode).toBe("normal");
    expect(sculpt.compositionHint?.opacity).toBe(1.0);
  });
});
