import { describe, it, expect } from "vitest";
import { contour } from "@/lib/templates/contour";
import { validateParamSchema } from "@/lib/types";

describe("contour template", () => {
  it("has required metadata", () => {
    expect(contour.name).toBe("Contour");
    expect(contour.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(contour.schema)).toBe(true);
  });
  it("has between 3 and 8 parameters", () => {
    const count = Object.keys(contour.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(8);
  });
});
