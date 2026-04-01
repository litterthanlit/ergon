import { describe, it, expect } from "vitest";
import { fluid } from "@/lib/templates/fluid";
import { validateParamSchema, getDefaultValues } from "@/lib/types";

describe("fluid template", () => {
  it("has required metadata", () => {
    expect(fluid.name).toBe("Fluid");
    expect(fluid.description).toBeDefined();
    expect(fluid.code).toBeDefined();
    expect(typeof fluid.code).toBe("string");
  });

  it("has a valid parameter schema", () => {
    expect(validateParamSchema(fluid.schema)).toBe(true);
  });

  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(fluid.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });

  it("has sensible default values", () => {
    const defaults = getDefaultValues(fluid.schema);
    expect(defaults).toHaveProperty("resolution");
    expect(defaults).toHaveProperty("waveHeight");
    expect(defaults).toHaveProperty("speed");
    expect(defaults).toHaveProperty("viscosity");
    expect(defaults).toHaveProperty("material");
  });

  it("code contains ergon.params() call", () => {
    expect(fluid.code).toContain("ergon.params(");
  });

  it("code contains setup and draw functions", () => {
    expect(fluid.code).toContain("function setup");
    expect(fluid.code).toContain("function draw");
  });

  it("uses WEBGL renderer", () => {
    expect(fluid.code).toContain("WEBGL");
  });

  it("uses specularMaterial for reflective surface", () => {
    expect(fluid.code).toContain("specularMaterial");
  });

  it("has composition hint", () => {
    expect(fluid.compositionHint).toBeDefined();
    expect(fluid.compositionHint?.blendMode).toBe("normal");
    expect(fluid.compositionHint?.opacity).toBe(1.0);
  });
});
