import { describe, it, expect } from "vitest";
import { terrain3d } from "@/lib/templates/terrain3d";
import { validateParamSchema } from "@/lib/types";

describe("terrain3d template", () => {
  it("has required metadata", () => {
    expect(terrain3d.name).toBe("Terrain3D");
    expect(terrain3d.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(terrain3d.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(terrain3d.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
  it("uses WEBGL canvas", () => {
    expect(terrain3d.code).toContain("WEBGL");
  });
  it("has a compositionHint with normal blend", () => {
    expect(terrain3d.compositionHint).toBeDefined();
    expect(terrain3d.compositionHint?.blendMode).toBe("normal");
    expect(terrain3d.compositionHint?.opacity).toBe(1.0);
  });
});
