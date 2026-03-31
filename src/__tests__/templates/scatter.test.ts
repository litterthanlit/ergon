import { describe, it, expect } from "vitest";
import { scatter } from "@/lib/templates/scatter";
import { validateParamSchema } from "@/lib/types";

describe("scatter template", () => {
  it("has required metadata", () => {
    expect(scatter.name).toBe("Scatter");
    expect(scatter.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(scatter.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(scatter.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
