import { describe, it, expect } from "vitest";
import { glyphs } from "@/lib/templates/glyphs";
import { validateParamSchema } from "@/lib/types";

describe("glyphs template", () => {
  it("has required metadata", () => {
    expect(glyphs.name).toBe("Glyphs");
    expect(glyphs.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(glyphs.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(glyphs.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
