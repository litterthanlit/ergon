import { describe, it, expect } from "vitest";
import { waves } from "@/lib/templates/waves";
import { validateParamSchema } from "@/lib/types";

describe("waves template", () => {
  it("has required metadata", () => {
    expect(waves.name).toBe("Waves");
    expect(waves.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(waves.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(waves.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
