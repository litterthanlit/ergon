import { describe, expect, it } from "vitest";
import {
  applyTextureCommand,
  compileTexturePatch,
  countPersistentBuffers,
  createTextureEdge,
  createTextureNode,
  getTextureOperator,
  listTextureOperators,
  textureRecipes,
  validateTexturePatch,
} from "@/lib/texture-patch";
import { detectTextureRuntimeCapabilities } from "@/lib/texture-runtime";

describe("texture patch", () => {
  it("registers the required TOP operators", () => {
    const types = listTextureOperators().map((operator) => operator.type);
    expect(types).toEqual(expect.arrayContaining([
      "noise",
      "gradient",
      "voronoi",
      "shape",
      "curl-noise",
      "reaction-diffusion",
      "transform",
      "blur",
      "displace",
      "fluid-advection",
      "raymarch-glass",
      "levels",
      "colorize",
      "bloom",
      "chromatic-aberration",
      "film-grain",
      "color-grade",
      "composite",
      "feedback",
      "null",
      "out",
    ]));
    expect(getTextureOperator("feedback")?.supportsFeedback).toBe(true);
    expect(getTextureOperator("reaction-diffusion")?.persistentBuffer).toBe("simulation");
  });

  it("detects runtime capabilities without requiring a browser GPU", () => {
    const capabilities = detectTextureRuntimeCapabilities();
    expect(capabilities.preferredBackend).toMatch(/webgpu|webgl2/);
    expect(typeof capabilities.webgpu).toBe("boolean");
    expect(typeof capabilities.webgl2).toBe("boolean");
  });

  it("validates required output and invalid cables", () => {
    const patch = textureRecipes[0].create();
    const missingOut = { ...patch, nodes: patch.nodes.filter((node) => node.type !== "out") };
    expect(validateTexturePatch(missingOut).valid).toBe(false);

    const invalidCable = { ...patch, edges: [...patch.edges, createTextureEdge("missing", "out-1")] };
    expect(validateTexturePatch(invalidCable).errors.join(" ")).toContain("Invalid cable");
  });

  it("rejects circular cables and keeps feedback as an operator pass", () => {
    const patch = textureRecipes[0].create();
    const cyclic = { ...patch, edges: [...patch.edges, createTextureEdge("out-1", "noise-1")] };
    expect(validateTexturePatch(cyclic).valid).toBe(false);

    const reaction = compileTexturePatch(textureRecipes[3].create()).passes.find((pass) => pass.type === "reaction-diffusion");
    expect(getTextureOperator("feedback")?.persistentBuffer).toBe("feedback");
    expect(reaction?.persistentBuffer).toBe("simulation");
  });

  it("orders render passes by dependency into Out TOP", () => {
    const patch = textureRecipes[0].create();
    const plan = compileTexturePatch(patch);
    expect(plan.passes.map((pass) => pass.nodeId)).toEqual([
      "curl-1",
      "advection-1",
      "glass-1",
      "bloom-1",
      "grade-1",
      "grain-1",
      "out-1",
    ]);
    expect(plan.rendererBackend).toBe("webgpu");
  });

  it("applies local commands deterministically", () => {
    const patch = textureRecipes[0].create();
    const originalBloom = patch.nodes.find((node) => node.type === "bloom");
    const boosted = applyTextureCommand(patch, "increase-bloom");
    const bloom = boosted.nodes.find((node) => node.type === "bloom");
    expect(bloom?.params.strength).toBeGreaterThan(originalBloom?.params.strength as number);

    const glass = applyTextureCommand(textureRecipes[4].create(), "add-glass-refraction");
    expect(glass.nodes.some((node) => node.type === "raymarch-glass")).toBe(true);
  });

  it("marks persistent simulation buffers in the render plan", () => {
    const plan = compileTexturePatch(textureRecipes[3].create());
    expect(countPersistentBuffers(plan)).toBe(1);
    expect(plan.passes.some((pass) => pass.type === "reaction-diffusion" && pass.usesFeedback)).toBe(true);
  });

  it("creates nodes with operator defaults", () => {
    const node = createTextureNode("curl-noise", { x: 10, y: 20 });
    expect(node.label).toBe("Curl Noise TOP");
    expect(node.params.scale).toBe(8.5);
  });
});
