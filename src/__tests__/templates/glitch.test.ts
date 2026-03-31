import { describe, it, expect } from "vitest";
import { glitch } from "@/lib/templates/glitch";
import { validateParamSchema } from "@/lib/types";

describe("glitch template", () => {
  it("has required metadata", () => {
    expect(glitch.name).toBe("Glitch");
    expect(glitch.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(glitch.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(glitch.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
