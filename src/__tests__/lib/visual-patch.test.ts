import { describe, expect, it } from "vitest";
import {
  compilePatchToRenderPlan,
  createDefaultPatch,
  interpolateKeyframes,
  validatePatch,
  type KeyframeTrack,
} from "@/lib/visual-patch";

describe("visual patch", () => {
  it("creates a valid default patch", () => {
    const patch = createDefaultPatch();
    expect(validatePatch(patch)).toBe(true);
    expect(patch.nodes.some((node) => node.kind === "output")).toBe(true);
    expect(patch.selectedNodeId).toBe("motion-1");
  });

  it("compiles connected macro nodes into render layers", () => {
    const patch = createDefaultPatch();
    const plan = compilePatchToRenderPlan(patch);
    expect(plan.layers.length).toBeGreaterThanOrEqual(4);
    expect(plan.layers[0].name).toBe("Generative Field");
    expect(plan.layers.at(-1)?.name).toBe("Particle Feedback");
  });

  it("interpolates numeric keyframes", () => {
    const track: KeyframeTrack = {
      id: "speed",
      nodeId: "motion-1",
      paramKey: "speed",
      keyframes: [
        { id: "a", time: 0, value: 0 },
        { id: "b", time: 10, value: 20 },
      ],
    };
    expect(interpolateKeyframes(track, 5)).toBe(10);
  });

  it("interpolates color keyframes", () => {
    const track: KeyframeTrack = {
      id: "color",
      nodeId: "color-1",
      paramKey: "accent",
      keyframes: [
        { id: "a", time: 0, value: "#000000" },
        { id: "b", time: 10, value: "#ffffff" },
      ],
    };
    expect(interpolateKeyframes(track, 5)).toBe("#808080");
  });
});
