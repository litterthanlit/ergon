import { describe, it, expect } from "vitest";
import { terrain } from "@/lib/templates/terrain";
import { validateParamSchema } from "@/lib/types";

describe("terrain template", () => {
  it("has required metadata", () => {
    expect(terrain.name).toBe("Terrain");
    expect(terrain.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(terrain.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(terrain.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
