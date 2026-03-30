import { describe, it, expect } from "vitest";
import { bloom } from "@/lib/templates/bloom";
import { validateParamSchema } from "@/lib/types";

describe("bloom template", () => {
  it("has required metadata", () => {
    expect(bloom.name).toBe("Bloom");
    expect(bloom.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(bloom.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(bloom.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
