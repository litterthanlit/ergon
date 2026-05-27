import { beforeEach, describe, expect, it } from "vitest";
import { compileTexturePatch, textureRecipes, type TextureRecipeId } from "@/lib/texture-patch";
import { createTexturePatchHistory } from "@/lib/texture-patch-history";
import { useTexturePatchStore } from "@/lib/texture-patch-store";

type StoreWithHistory = ReturnType<typeof useTexturePatchStore.getState> & {
  history?: {
    dirty: boolean;
    undoStack: unknown[];
    redoStack: unknown[];
    lastCommand: { type: string; nodeId?: string; edgeId?: string; recipeId?: TextureRecipeId } | null;
  };
  undo?: () => void;
  redo?: () => void;
  markSaved?: () => void;
  deleteSelectedNode?: () => void;
  duplicateSelectedNode?: () => void;
  disconnectEdge?: (edgeId: string) => void;
};

function resetStore() {
  const patch = textureRecipes[0].create();
  useTexturePatchStore.setState({
    patch,
    renderPlan: compileTexturePatch(patch),
    history: createTexturePatchHistory(),
    stats: null,
    playback: {
      playing: true,
      frame: patch.timeline?.currentFrame ?? 0,
      fpsTarget: patch.timeline?.fps ?? 60,
      durationFrames: patch.timeline?.durationFrames ?? 720,
      loop: patch.timeline?.loop ?? true,
      playbackRate: 1,
    },
    operatorBrowser: { tab: "TOP", search: "" },
  });
}

function historyStore(): StoreWithHistory {
  return useTexturePatchStore.getState() as StoreWithHistory;
}

describe("texture patch store history", () => {
  beforeEach(() => {
    resetStore();
  });

  it("records param updates and restores dirty state across undo and redo", () => {
    const original = historyStore().patch.nodes.find((node) => node.id === "grade-1")?.params.contrast;

    historyStore().updateNodeParam("grade-1", "contrast", 2);

    expect(historyStore().history?.dirty).toBe(true);
    expect(historyStore().history?.lastCommand?.type).toBe("param:update");
    expect(historyStore().history?.lastCommand?.nodeId).toBe("grade-1");
    expect(historyStore().patch.nodes.find((node) => node.id === "grade-1")?.params.contrast).toBe(2);

    expect(typeof historyStore().undo).toBe("function");
    historyStore().undo?.();
    expect(historyStore().patch.nodes.find((node) => node.id === "grade-1")?.params.contrast).toBe(original);
    expect(historyStore().history?.dirty).toBe(false);

    expect(typeof historyStore().redo).toBe("function");
    historyStore().redo?.();
    expect(historyStore().patch.nodes.find((node) => node.id === "grade-1")?.params.contrast).toBe(2);

    expect(typeof historyStore().markSaved).toBe("function");
    historyStore().markSaved?.();
    expect(historyStore().history?.dirty).toBe(false);
    historyStore().undo?.();
    expect(historyStore().history?.dirty).toBe(true);
  });

  it("undoes add node, duplicate node, and delete node commands", () => {
    const initialNodeCount = historyStore().patch.nodes.length;

    historyStore().addOperator("noise");
    const addedNodeId = historyStore().patch.selectedNodeId;
    expect(historyStore().history?.lastCommand?.type).toBe("node:add");
    expect(historyStore().patch.nodes).toHaveLength(initialNodeCount + 1);

    historyStore().undo?.();
    expect(historyStore().patch.nodes).toHaveLength(initialNodeCount);
    historyStore().redo?.();
    expect(historyStore().patch.nodes.some((node) => node.id === addedNodeId)).toBe(true);

    expect(typeof historyStore().duplicateSelectedNode).toBe("function");
    historyStore().duplicateSelectedNode?.();
    const duplicatedNodeId = historyStore().patch.selectedNodeId;
    expect(historyStore().history?.lastCommand?.type).toBe("node:duplicate");
    expect(duplicatedNodeId).not.toBe(addedNodeId);
    expect(historyStore().patch.nodes).toHaveLength(initialNodeCount + 2);

    expect(typeof historyStore().deleteSelectedNode).toBe("function");
    historyStore().deleteSelectedNode?.();
    expect(historyStore().history?.lastCommand?.type).toBe("node:delete");
    expect(historyStore().patch.nodes.some((node) => node.id === duplicatedNodeId)).toBe(false);
    historyStore().undo?.();
    expect(historyStore().patch.nodes.some((node) => node.id === duplicatedNodeId)).toBe(true);
  });

  it("undoes edge connect and disconnect commands", () => {
    historyStore().addOperator("blur");
    const blurNodeId = historyStore().patch.selectedNodeId;

    historyStore().connectNodes("curl-1", blurNodeId);
    const connectedEdgeId = `curl-1:${blurNodeId}:in1`;
    expect(historyStore().history?.lastCommand?.type).toBe("edge:connect");
    expect(historyStore().patch.edges.some((edge) => edge.id === connectedEdgeId)).toBe(true);

    historyStore().undo?.();
    expect(historyStore().patch.edges.some((edge) => edge.id === connectedEdgeId)).toBe(false);
    historyStore().redo?.();
    expect(historyStore().patch.edges.some((edge) => edge.id === connectedEdgeId)).toBe(true);

    expect(typeof historyStore().disconnectEdge).toBe("function");
    historyStore().disconnectEdge?.(connectedEdgeId);
    expect(historyStore().history?.lastCommand?.type).toBe("edge:disconnect");
    expect(historyStore().history?.lastCommand?.edgeId).toBe(connectedEdgeId);
    expect(historyStore().patch.edges.some((edge) => edge.id === connectedEdgeId)).toBe(false);

    historyStore().undo?.();
    expect(historyStore().patch.edges.some((edge) => edge.id === connectedEdgeId)).toBe(true);
  });

  it("loads recipes as undoable commands", () => {
    const originalName = historyStore().patch.name;

    historyStore().loadRecipe("glass-veil");

    expect(historyStore().patch.name).toBe("Glass Veil");
    expect(historyStore().history?.lastCommand).toMatchObject({ type: "recipe:load", recipeId: "glass-veil" });

    historyStore().undo?.();
    expect(historyStore().patch.name).toBe(originalName);
    historyStore().redo?.();
    expect(historyStore().patch.name).toBe("Glass Veil");
  });
});
