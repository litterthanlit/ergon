import { describe, it, expect } from "vitest";
import { drift } from "@/lib/templates/drift";
import { validateParamSchema, getDefaultValues } from "@/lib/types";

describe("drift template", () => {
  it("has required metadata", () => {
    expect(drift.name).toBe("Drift");
    expect(drift.description).toBeDefined();
    expect(drift.code).toBeDefined();
    expect(typeof drift.code).toBe("string");
  });

  it("has a valid parameter schema", () => {
    expect(validateParamSchema(drift.schema)).toBe(true);
  });

  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(drift.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });

  it("has sensible default values", () => {
    const defaults = getDefaultValues(drift.schema);
    expect(defaults).toHaveProperty("density");
    expect(defaults).toHaveProperty("speed");
    expect(defaults).toHaveProperty("turbulence");
  });

  it("code contains ergon.params() call", () => {
    expect(drift.code).toContain("ergon.params(");
  });

  it("code contains setup and draw functions", () => {
    expect(drift.code).toContain("function setup");
    expect(drift.code).toContain("function draw");
  });
});
