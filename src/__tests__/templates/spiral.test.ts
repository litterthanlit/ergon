import { describe, it, expect } from "vitest";
import { spiral } from "@/lib/templates/spiral";
import { validateParamSchema } from "@/lib/types";

describe("spiral template", () => {
  it("has required metadata", () => {
    expect(spiral.name).toBe("Spiral");
    expect(spiral.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(spiral.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(spiral.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
