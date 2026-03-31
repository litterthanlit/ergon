import { describe, it, expect } from "vitest";
import { marble } from "@/lib/templates/marble";
import { validateParamSchema } from "@/lib/types";

describe("marble template", () => {
  it("has required metadata", () => {
    expect(marble.name).toBe("Marble");
    expect(marble.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(marble.schema)).toBe(true);
  });
  it("has between 3 and 8 parameters", () => {
    const count = Object.keys(marble.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(8);
  });
});
