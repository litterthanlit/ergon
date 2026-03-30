import { describe, it, expect } from "vitest";
import { aurora } from "@/lib/templates/aurora";
import { validateParamSchema } from "@/lib/types";

describe("aurora template", () => {
  it("has required metadata", () => {
    expect(aurora.name).toBe("Aurora");
    expect(aurora.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(aurora.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(aurora.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
