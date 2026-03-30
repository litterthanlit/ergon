import { describe, it, expect } from "vitest";
import { flowfield } from "@/lib/templates/flowfield";
import { validateParamSchema, getDefaultValues } from "@/lib/types";

describe("flowfield template", () => {
  it("has required metadata", () => {
    expect(flowfield.name).toBe("FlowField");
    expect(flowfield.description).toBeDefined();
    expect(typeof flowfield.code).toBe("string");
  });

  it("has a valid parameter schema", () => {
    expect(validateParamSchema(flowfield.schema)).toBe(true);
  });

  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(flowfield.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });

  it("has sensible default values", () => {
    const defaults = getDefaultValues(flowfield.schema);
    expect(defaults).toHaveProperty("density");
    expect(defaults).toHaveProperty("speed");
    expect(defaults).toHaveProperty("noiseScale");
    expect(defaults).toHaveProperty("palette");
  });

  it("code contains ergon.params() call", () => {
    expect(flowfield.code).toContain("ergon.params(");
  });

  it("code contains setup and draw functions", () => {
    expect(flowfield.code).toContain("function setup");
    expect(flowfield.code).toContain("function draw");
  });
});
