import { describe, it, expect } from "vitest";
import { constellation } from "@/lib/templates/constellation";
import { validateParamSchema } from "@/lib/types";

describe("constellation template", () => {
  it("has required metadata", () => {
    expect(constellation.name).toBe("Constellation");
    expect(constellation.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(constellation.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(constellation.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
