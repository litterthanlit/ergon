import { describe, it, expect } from "vitest";
import {
  createLayer,
  type Layer,
  type BlendMode,
  BLEND_MODES,
} from "@/lib/layers";

describe("layers", () => {
  it("createLayer returns a layer with defaults", () => {
    const layer = createLayer("drift", "base", "Drift", "const params = ergon.params({});");
    expect(layer.id).toBeTruthy();
    expect(layer.templateId).toBe("drift");
    expect(layer.name).toBe("Drift");
    expect(layer.visible).toBe(true);
    expect(layer.opacity).toBe(0.7);
    expect(layer.blendMode).toBe("screen");
    expect(layer.code).toContain("ergon.params");
  });

  it("createLayer generates unique ids", () => {
    const a = createLayer("drift", "base", "Drift", "code");
    const b = createLayer("grid", "shape", "Grid", "code");
    expect(a.id).not.toBe(b.id);
  });

  it("BLEND_MODES contains expected modes", () => {
    expect(BLEND_MODES).toContain("normal");
    expect(BLEND_MODES).toContain("multiply");
    expect(BLEND_MODES).toContain("screen");
    expect(BLEND_MODES).toContain("overlay");
    expect(BLEND_MODES).toContain("difference");
    expect(BLEND_MODES.length).toBeGreaterThanOrEqual(8);
  });
});
