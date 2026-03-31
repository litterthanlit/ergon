import { describe, it, expect } from "vitest";
import { weave } from "@/lib/templates/weave";
import { validateParamSchema } from "@/lib/types";

describe("weave template", () => {
  it("has required metadata", () => {
    expect(weave.name).toBe("Weave");
    expect(weave.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(weave.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(weave.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
