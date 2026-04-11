import { describe, it, expect } from "vitest";
import { organism } from "@/lib/templates/organism";
import { validateParamSchema } from "@/lib/types";

describe("organism template", () => {
  it("has required metadata", () => {
    expect(organism.name).toBe("Organism");
    expect(organism.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(organism.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(organism.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
  it("uses WEBGL canvas", () => {
    expect(organism.code).toContain("WEBGL");
  });
  it("has a compositionHint", () => {
    expect(organism.compositionHint).toBeDefined();
    expect(organism.compositionHint?.blendMode).toBe("screen");
  });
});
