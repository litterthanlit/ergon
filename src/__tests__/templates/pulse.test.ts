import { describe, it, expect } from "vitest";
import { pulse } from "@/lib/templates/pulse";
import { validateParamSchema } from "@/lib/types";

describe("pulse template", () => {
  it("has required metadata", () => {
    expect(pulse.name).toBe("Pulse");
    expect(pulse.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(pulse.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(pulse.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
