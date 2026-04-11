import { describe, it, expect, beforeEach } from "vitest";
import { useCreatorStore } from "@/lib/creator-store";

describe("creator-store 3D extensions", () => {
  beforeEach(() => {
    useCreatorStore.setState({
      renderMode: "fluid",
      postFX: {
        bloom: false,
        chromatic: false,
        vignette: false,
        dof: false,
        grain: false,
        toneMapping: false,
        motionBlur: false,
      },
      imagePlanes: [],
    });
  });

  it("has 7 render modes in RENDER_MODES", async () => {
    const { RENDER_MODES } = await import("@/lib/creator-store");
    expect(RENDER_MODES).toHaveLength(7);
    expect(RENDER_MODES.map((m) => m.id)).toEqual([
      "fluid", "nebula", "crystal", "mycelium", "plasma", "erosion", "flow",
    ]);
  });

  it("defaults all postFX to false", () => {
    const state = useCreatorStore.getState();
    expect(state.postFX).toEqual({
      bloom: false, chromatic: false, vignette: false,
      dof: false, grain: false, toneMapping: false, motionBlur: false,
    });
  });

  it("togglePostFX toggles a single effect", () => {
    useCreatorStore.getState().togglePostFX("bloom");
    expect(useCreatorStore.getState().postFX.bloom).toBe(true);
    useCreatorStore.getState().togglePostFX("bloom");
    expect(useCreatorStore.getState().postFX.bloom).toBe(false);
  });

  it("defaults imagePlanes to empty array", () => {
    expect(useCreatorStore.getState().imagePlanes).toEqual([]);
  });

  it("addImagePlane adds a plane with generated id", () => {
    useCreatorStore.getState().addImagePlane("https://example.com/img.png", [10, 20, 30]);
    const planes = useCreatorStore.getState().imagePlanes;
    expect(planes).toHaveLength(1);
    expect(planes[0].url).toBe("https://example.com/img.png");
    expect(planes[0].position).toEqual([10, 20, 30]);
    expect(planes[0].id).toBeDefined();
  });

  it("removeImagePlane removes by id", () => {
    useCreatorStore.getState().addImagePlane("https://example.com/a.png", [0, 0, 0]);
    useCreatorStore.getState().addImagePlane("https://example.com/b.png", [1, 1, 1]);
    const planes = useCreatorStore.getState().imagePlanes;
    expect(planes).toHaveLength(2);
    useCreatorStore.getState().removeImagePlane(planes[0].id);
    expect(useCreatorStore.getState().imagePlanes).toHaveLength(1);
    expect(useCreatorStore.getState().imagePlanes[0].url).toBe("https://example.com/b.png");
  });

  it("updateImagePlane updates transform fields", () => {
    useCreatorStore.getState().addImagePlane("https://example.com/img.png", [0, 0, 0]);
    const id = useCreatorStore.getState().imagePlanes[0].id;
    useCreatorStore.getState().updateImagePlane(id, { position: [5, 10, 15], scale: 2.0 });
    const updated = useCreatorStore.getState().imagePlanes[0];
    expect(updated.position).toEqual([5, 10, 15]);
    expect(updated.scale).toBe(2.0);
  });

  it("clearAll also clears imagePlanes", () => {
    useCreatorStore.getState().addImagePlane("https://example.com/img.png", [0, 0, 0]);
    expect(useCreatorStore.getState().imagePlanes).toHaveLength(1);
    useCreatorStore.getState().clearAll();
    expect(useCreatorStore.getState().imagePlanes).toEqual([]);
  });

  it("enforces max 10 image planes", () => {
    for (let i = 0; i < 12; i++) {
      useCreatorStore.getState().addImagePlane(`https://example.com/${i}.png`, [i, 0, 0]);
    }
    expect(useCreatorStore.getState().imagePlanes).toHaveLength(10);
  });
});
