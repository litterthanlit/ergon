import { describe, it, expect, beforeEach } from "vitest";
import { useCreatorStore } from "./creator-store";

// Reset store between tests
beforeEach(() => {
  useCreatorStore.setState(useCreatorStore.getInitialState());
});

describe("creator-store", () => {
  describe("nodes", () => {
    it("adds a node at a position", () => {
      useCreatorStore.getState().addNode([10, 20, 0]);
      const nodes = useCreatorStore.getState().nodes;
      expect(nodes).toHaveLength(1);
      expect(nodes[0].position).toEqual([10, 20, 0]);
      expect(nodes[0].scale).toBe(1);
      expect(nodes[0].rotation).toEqual([0, 0, 0]);
      expect(nodes[0].id).toBeTruthy();
    });

    it("removes a node by id", () => {
      useCreatorStore.getState().addNode([0, 0, 0]);
      const id = useCreatorStore.getState().nodes[0].id;
      useCreatorStore.getState().removeNode(id);
      expect(useCreatorStore.getState().nodes).toHaveLength(0);
    });

    it("updates a node partially", () => {
      useCreatorStore.getState().addNode([0, 0, 0]);
      const id = useCreatorStore.getState().nodes[0].id;
      useCreatorStore.getState().updateNode(id, { scale: 2.5, position: [5, 5, 0] });
      const node = useCreatorStore.getState().nodes[0];
      expect(node.scale).toBe(2.5);
      expect(node.position).toEqual([5, 5, 0]);
    });

    it("selects and deselects a node", () => {
      useCreatorStore.getState().addNode([0, 0, 0]);
      const id = useCreatorStore.getState().nodes[0].id;
      useCreatorStore.getState().selectNode(id);
      expect(useCreatorStore.getState().selectedNodeId).toBe(id);
      useCreatorStore.getState().selectNode(null);
      expect(useCreatorStore.getState().selectedNodeId).toBeNull();
    });

    it("removes edges when removing a node", () => {
      useCreatorStore.getState().addNode([0, 0, 0]);
      useCreatorStore.getState().addNode([10, 0, 0]);
      const [n1, n2] = useCreatorStore.getState().nodes;
      useCreatorStore.getState().addEdge(n1.id, n2.id);
      expect(useCreatorStore.getState().edges).toHaveLength(1);
      useCreatorStore.getState().removeNode(n1.id);
      expect(useCreatorStore.getState().edges).toHaveLength(0);
    });
  });

  describe("edges", () => {
    it("adds an edge between two nodes", () => {
      useCreatorStore.getState().addNode([0, 0, 0]);
      useCreatorStore.getState().addNode([10, 0, 0]);
      const [n1, n2] = useCreatorStore.getState().nodes;
      useCreatorStore.getState().addEdge(n1.id, n2.id);
      expect(useCreatorStore.getState().edges).toHaveLength(1);
      expect(useCreatorStore.getState().edges[0]).toEqual({ from: n1.id, to: n2.id });
    });

    it("prevents duplicate edges", () => {
      useCreatorStore.getState().addNode([0, 0, 0]);
      useCreatorStore.getState().addNode([10, 0, 0]);
      const [n1, n2] = useCreatorStore.getState().nodes;
      useCreatorStore.getState().addEdge(n1.id, n2.id);
      useCreatorStore.getState().addEdge(n1.id, n2.id);
      useCreatorStore.getState().addEdge(n2.id, n1.id);
      expect(useCreatorStore.getState().edges).toHaveLength(1);
    });

    it("removes an edge", () => {
      useCreatorStore.getState().addNode([0, 0, 0]);
      useCreatorStore.getState().addNode([10, 0, 0]);
      const [n1, n2] = useCreatorStore.getState().nodes;
      useCreatorStore.getState().addEdge(n1.id, n2.id);
      useCreatorStore.getState().removeEdge(n1.id, n2.id);
      expect(useCreatorStore.getState().edges).toHaveLength(0);
    });
  });

  describe("layers", () => {
    it("toggles a layer on/off", () => {
      expect(useCreatorStore.getState().layers.spheres.enabled).toBe(true);
      useCreatorStore.getState().setLayerEnabled("spheres", false);
      expect(useCreatorStore.getState().layers.spheres.enabled).toBe(false);
    });

    it("sets layer intensity", () => {
      useCreatorStore.getState().setLayerIntensity("dust", 0.5);
      expect(useCreatorStore.getState().layers.dust.intensity).toBe(0.5);
    });

    it("sets layer color override", () => {
      useCreatorStore.getState().setLayerColor("tendrils", "#ff0000");
      expect(useCreatorStore.getState().layers.tendrils.color).toBe("#ff0000");
    });

    it("clears layer color override", () => {
      useCreatorStore.getState().setLayerColor("tendrils", "#ff0000");
      useCreatorStore.getState().setLayerColor("tendrils", undefined);
      expect(useCreatorStore.getState().layers.tendrils.color).toBeUndefined();
    });

    it("sets a per-layer param", () => {
      useCreatorStore.getState().setLayerParam("spheres", "metalness", 0.8);
      expect(useCreatorStore.getState().layers.spheres.params.metalness).toBe(0.8);
    });
  });

  describe("modulations", () => {
    it("adds a modulation", () => {
      useCreatorStore.getState().addModulation({
        target: "layers.spheres.params.scatterRadius",
        preset: "breathe",
        speed: 1.0,
        amplitude: 0.5,
      });
      expect(useCreatorStore.getState().modulations).toHaveLength(1);
    });

    it("removes a modulation by target", () => {
      useCreatorStore.getState().addModulation({
        target: "layers.spheres.params.scatterRadius",
        preset: "breathe",
        speed: 1.0,
        amplitude: 0.5,
      });
      useCreatorStore.getState().removeModulation("layers.spheres.params.scatterRadius");
      expect(useCreatorStore.getState().modulations).toHaveLength(0);
    });

    it("updates a modulation", () => {
      useCreatorStore.getState().addModulation({
        target: "layers.spheres.params.scatterRadius",
        preset: "breathe",
        speed: 1.0,
        amplitude: 0.5,
      });
      useCreatorStore.getState().updateModulation("layers.spheres.params.scatterRadius", { speed: 2.0 });
      expect(useCreatorStore.getState().modulations[0].speed).toBe(2.0);
    });
  });

  describe("snapshots", () => {
    it("takes a snapshot of current state", () => {
      useCreatorStore.getState().addNode([5, 5, 0]);
      useCreatorStore.getState().takeSnapshot("Test Scene");
      const snaps = useCreatorStore.getState().snapshots;
      expect(snaps).toHaveLength(1);
      expect(snaps[0].name).toBe("Test Scene");
      expect(snaps[0].state.nodes).toHaveLength(1);
    });

    it("loads a snapshot restoring state", () => {
      useCreatorStore.getState().addNode([5, 5, 0]);
      useCreatorStore.getState().takeSnapshot("Before");
      const snapId = useCreatorStore.getState().snapshots[0].id;

      // Change state
      useCreatorStore.getState().addNode([99, 99, 0]);
      expect(useCreatorStore.getState().nodes).toHaveLength(2);

      // Load snapshot
      useCreatorStore.getState().loadSnapshot(snapId);
      expect(useCreatorStore.getState().nodes).toHaveLength(1);
      expect(useCreatorStore.getState().activeSnapshotId).toBe(snapId);
    });

    it("deletes a snapshot", () => {
      useCreatorStore.getState().takeSnapshot("Delete me");
      const snapId = useCreatorStore.getState().snapshots[0].id;
      useCreatorStore.getState().deleteSnapshot(snapId);
      expect(useCreatorStore.getState().snapshots).toHaveLength(0);
    });
  });

  describe("connections", () => {
    it("adds a connection between snapshots", () => {
      useCreatorStore.getState().takeSnapshot("A");
      useCreatorStore.getState().takeSnapshot("B");
      const [a, b] = useCreatorStore.getState().snapshots;
      useCreatorStore.getState().addConnection(a.id, b.id, { type: "time", delay: 3000 });
      const conns = useCreatorStore.getState().connections;
      expect(conns).toHaveLength(1);
      expect(conns[0].from).toBe(a.id);
      expect(conns[0].to).toBe(b.id);
      expect(conns[0].trigger).toEqual({ type: "time", delay: 3000 });
      expect(conns[0].transition.duration).toBe(1000);
    });

    it("removes a connection", () => {
      useCreatorStore.getState().takeSnapshot("A");
      useCreatorStore.getState().takeSnapshot("B");
      const [a, b] = useCreatorStore.getState().snapshots;
      useCreatorStore.getState().addConnection(a.id, b.id, { type: "click" });
      const connId = useCreatorStore.getState().connections[0].id;
      useCreatorStore.getState().removeConnection(connId);
      expect(useCreatorStore.getState().connections).toHaveLength(0);
    });

    it("deletes connections when deleting a snapshot", () => {
      useCreatorStore.getState().takeSnapshot("A");
      useCreatorStore.getState().takeSnapshot("B");
      const [a, b] = useCreatorStore.getState().snapshots;
      useCreatorStore.getState().addConnection(a.id, b.id, { type: "time", delay: 1000 });
      useCreatorStore.getState().deleteSnapshot(a.id);
      expect(useCreatorStore.getState().connections).toHaveLength(0);
    });
  });

  describe("presets", () => {
    it("setPreset generates nodes and edges", () => {
      useCreatorStore.getState().setPreset("constellation");
      expect(useCreatorStore.getState().nodes.length).toBeGreaterThan(0);
      expect(useCreatorStore.getState().edges.length).toBeGreaterThan(0);
      expect(useCreatorStore.getState().activePreset).toBe("constellation");
    });

    it("clearAll resets edges, selection, and image planes", () => {
      useCreatorStore.getState().addNode([0, 0, 0]);
      useCreatorStore.getState().addNode([10, 0, 0]);
      const [n1, n2] = useCreatorStore.getState().nodes;
      useCreatorStore.getState().addEdge(n1.id, n2.id);
      useCreatorStore.getState().selectNode(n1.id);
      useCreatorStore.getState().clearAll();
      expect(useCreatorStore.getState().edges).toHaveLength(0);
      expect(useCreatorStore.getState().selectedNodeId).toBeNull();
    });
  });
});

describe("thumbnails", () => {
  it("takeSnapshot stores thumbnail", () => {
    useCreatorStore.getState().takeSnapshot("Thumb test", "data:image/png;base64,abc");
    const snap = useCreatorStore.getState().snapshots[0];
    expect(snap.thumbnail).toBe("data:image/png;base64,abc");
  });

  it("takeSnapshot defaults thumbnail to empty string", () => {
    useCreatorStore.getState().takeSnapshot("No thumb");
    const snap = useCreatorStore.getState().snapshots[0];
    expect(snap.thumbnail).toBe("");
  });
});

describe("theme", () => {
  it("defaults to dark", () => {
    expect(useCreatorStore.getState().theme).toBe("dark");
  });

  it("setTheme switches to light", () => {
    useCreatorStore.getState().setTheme("light");
    expect(useCreatorStore.getState().theme).toBe("light");
  });
});

describe("playbackState", () => {
  it("defaults to idle", () => {
    expect(useCreatorStore.getState().playbackState.phase).toBe("idle");
  });

  it("setPlaybackState updates partially", () => {
    useCreatorStore.getState().setPlaybackState({ phase: "playing", elapsedInScene: 500 });
    expect(useCreatorStore.getState().playbackState.phase).toBe("playing");
    expect(useCreatorStore.getState().playbackState.elapsedInScene).toBe(500);
  });

  it("resetPlayback returns to idle", () => {
    useCreatorStore.getState().setPlaybackState({ phase: "crossfading", progress: 0.5 });
    useCreatorStore.getState().resetPlayback();
    expect(useCreatorStore.getState().playbackState.phase).toBe("idle");
    expect(useCreatorStore.getState().playbackState.progress).toBe(0);
  });
});

describe("scene presets", () => {
  it("applyScenePreset auto-snapshots then applies", () => {
    useCreatorStore.getState().addNode([0, 0, 0]);
    useCreatorStore.getState().applyScenePreset("deepSea");
    // Auto-snapshot should have captured previous state
    expect(useCreatorStore.getState().snapshots.length).toBeGreaterThanOrEqual(1);
    // Palette should be Deep Sea
    expect(useCreatorStore.getState().palette[0]).toBe("#00b4d8");
    // Spheres and dust should be enabled
    expect(useCreatorStore.getState().layers.spheres.enabled).toBe(true);
    expect(useCreatorStore.getState().layers.dust.enabled).toBe(true);
    // Tendrils should be disabled for Deep Sea
    expect(useCreatorStore.getState().layers.tendrils.enabled).toBe(false);
  });

  it("applyScenePreset sets correct FX", () => {
    useCreatorStore.getState().applyScenePreset("cosmos");
    expect(useCreatorStore.getState().postFX.bloom).toBe(true);
    expect(useCreatorStore.getState().postFX.chromatic).toBe(true);
    expect(useCreatorStore.getState().postFX.vignette).toBe(false);
  });

  it("applyScenePreset sets sphere material params", () => {
    useCreatorStore.getState().applyScenePreset("laboratory");
    expect(useCreatorStore.getState().layers.spheres.params.roughness).toBe(0.8);
    expect(useCreatorStore.getState().layers.spheres.params.metalness).toBe(0.2);
  });
});
