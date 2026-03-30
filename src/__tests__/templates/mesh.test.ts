import { describe, it, expect } from "vitest";
import { mesh } from "@/lib/templates/mesh";
import { validateParamSchema } from "@/lib/types";

describe("mesh template", () => {
  it("has required metadata", () => {
    expect(mesh.name).toBe("Mesh");
    expect(mesh.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(mesh.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(mesh.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
