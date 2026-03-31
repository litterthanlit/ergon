import { describe, it, expect } from "vitest";
import { grid } from "@/lib/templates/grid";
import { validateParamSchema } from "@/lib/types";

describe("grid template", () => {
  it("has required metadata", () => {
    expect(grid.name).toBe("Grid");
    expect(grid.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(grid.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(grid.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
