import { describe, it, expect } from "vitest";
import { compositeLayersToDataUrl } from "@/lib/compositor";

describe("compositor", () => {
  it("compositeLayersToDataUrl is a function", () => {
    expect(typeof compositeLayersToDataUrl).toBe("function");
  });
});
