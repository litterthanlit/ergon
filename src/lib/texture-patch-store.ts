"use client";

import { create } from "zustand";
import {
  applyTextureCommand,
  compileTexturePatch,
  createTextureEdge,
  createTextureNode,
  getTextureOperator,
  getTextureRecipe,
  textureRecipes,
  type TextureCommandId,
  type TextureEdge,
  type TextureNode,
  type TextureOperatorBrowserTab,
  type TextureOperatorType,
  type TexturePatch,
  type TextureQuality,
  type TextureRecipeId,
  type TextureRendererBackend,
  type TextureRenderPlan,
  type TextureRuntimeStats,
} from "./texture-patch";
import {
  commitTexturePatchCommand,
  createTexturePatchHistory,
  markTexturePatchSaved,
  redoTexturePatchCommand,
  undoTexturePatchCommand,
  type TexturePatchCommandRecord,
  type TexturePatchHistory,
} from "./texture-patch-history";
import type { ParamValue } from "./types";

type TexturePatchState = {
  patch: TexturePatch;
  renderPlan: TextureRenderPlan;
  history: TexturePatchHistory;
  stats: TextureRuntimeStats | null;
  playback: {
    playing: boolean;
    frame: number;
    fpsTarget: number;
    durationFrames: number;
    loop: boolean;
    playbackRate: number;
  };
  operatorBrowser: {
    tab: TextureOperatorBrowserTab;
    search: string;
  };
  setSelectedNode: (id: string) => void;
  setViewerNode: (id: string) => void;
  updateNodeParam: (nodeId: string, key: string, value: ParamValue) => void;
  setNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  addOperator: (type: TextureOperatorType) => void;
  deleteSelectedNode: () => void;
  duplicateSelectedNode: () => void;
  connectNodes: (source: string, target: string, targetPort?: string) => void;
  disconnectEdge: (edgeId: string) => void;
  autoLayout: () => void;
  toggleBypass: (nodeId: string) => void;
  toggleLock: (nodeId: string) => void;
  setRendererBackend: (backend: TextureRendererBackend) => void;
  setQuality: (quality: TextureQuality) => void;
  setPlaying: (playing: boolean) => void;
  setFrame: (frame: number) => void;
  setPlaybackRate: (rate: number) => void;
  selectOperatorCategory: (tab: TextureOperatorBrowserTab) => void;
  setOperatorSearch: (search: string) => void;
  loadPatch: (patch: TexturePatch) => void;
  loadRecipe: (id: TextureRecipeId) => void;
  applyCommand: (id: TextureCommandId) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  setStats: (stats: TextureRuntimeStats) => void;
};

const starterPatch = textureRecipes[0].create();

function playbackFromPatch(patch: TexturePatch): TexturePatchState["playback"] {
  const timeline = patch.timeline ?? { fps: 60, durationFrames: 720, loop: true, currentFrame: 0 };
  return {
    playing: true,
    frame: timeline.currentFrame,
    fpsTarget: timeline.fps,
    durationFrames: timeline.durationFrames,
    loop: timeline.loop,
    playbackRate: 1,
  };
}

function recompute(patch: TexturePatch) {
  return { patch, renderPlan: compileTexturePatch(patch) };
}

function selectedNode(patch: TexturePatch): TextureNode | undefined {
  return patch.nodes.find((node) => node.id === patch.selectedNodeId);
}

function nextPosition(patch: TexturePatch) {
  const selected = selectedNode(patch);
  if (selected) return { x: selected.position.x + 210, y: selected.position.y + 90 };
  return { x: 80 + patch.nodes.length * 140, y: 120 };
}

function defaultTargetPort(target: TextureNode, edges: TextureEdge[]) {
  const operator = getTextureOperator(target.type);
  if (!operator?.inputs.length) return "in1";
  return operator.inputs.find((port) => !edges.some((edge) => edge.target === target.id && edge.targetPort === port.id))?.id ?? operator.inputs[0].id;
}

function patchesEqual(a: TexturePatch, b: TexturePatch) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function commitPatchState(
  state: TexturePatchState,
  nextPatch: TexturePatch,
  command: TexturePatchCommandRecord
): Partial<TexturePatchState> {
  if (patchesEqual(state.patch, nextPatch)) return {};
  const snapshot = commitTexturePatchCommand(
    { patch: state.patch, history: state.history ?? createTexturePatchHistory() },
    nextPatch,
    command
  );
  return { ...recompute(snapshot.patch), history: snapshot.history };
}

function playbackFromRestoredPatch(
  patch: TexturePatch,
  current: TexturePatchState["playback"]
): TexturePatchState["playback"] {
  const restored = playbackFromPatch(patch);
  return {
    ...restored,
    playing: current.playing,
    playbackRate: current.playbackRate,
  };
}

function restorePatchState(state: TexturePatchState, snapshot: { patch: TexturePatch; history: TexturePatchHistory }) {
  return {
    ...recompute(snapshot.patch),
    history: snapshot.history,
    playback: playbackFromRestoredPatch(snapshot.patch, state.playback),
  };
}

function uniqueNodeId(patch: TexturePatch, baseId: string) {
  const ids = new Set(patch.nodes.map((node) => node.id));
  let id = `${baseId}-copy`;
  let index = 2;
  while (ids.has(id)) {
    id = `${baseId}-copy-${index}`;
    index += 1;
  }
  return id;
}

function canDeleteNode(patch: TexturePatch, node: TextureNode) {
  if (node.lock) return false;
  if (node.type !== "out") return true;
  return patch.nodes.filter((item) => item.type === "out").length > 1;
}

function fallbackNodeIdAfterDelete(patch: TexturePatch, deletedNodeId: string) {
  const outgoingTarget = patch.edges.find((edge) => edge.source === deletedNodeId)?.target;
  if (outgoingTarget && outgoingTarget !== deletedNodeId) return outgoingTarget;
  const incomingSource = patch.edges.find((edge) => edge.target === deletedNodeId)?.source;
  if (incomingSource && incomingSource !== deletedNodeId) return incomingSource;
  return patch.nodes.find((node) => node.type === "out" && node.id !== deletedNodeId)?.id ?? patch.nodes.find((node) => node.id !== deletedNodeId)?.id ?? "";
}

function autoLayoutPatch(patch: TexturePatch) {
  const incoming = new Map<string, TextureEdge[]>();
  for (const node of patch.nodes) incoming.set(node.id, []);
  for (const edge of patch.edges) incoming.get(edge.target)?.push(edge);

  const depths = new Map<string, number>();
  const depthFor = (nodeId: string, visiting = new Set<string>()): number => {
    if (depths.has(nodeId)) return depths.get(nodeId) ?? 0;
    if (visiting.has(nodeId)) return 0;
    visiting.add(nodeId);
    const depth = Math.max(0, ...((incoming.get(nodeId) ?? []).map((edge) => depthFor(edge.source, visiting) + 1)));
    visiting.delete(nodeId);
    depths.set(nodeId, depth);
    return depth;
  };

  const groups = new Map<number, TextureNode[]>();
  for (const node of patch.nodes) {
    const depth = depthFor(node.id);
    groups.set(depth, [...(groups.get(depth) ?? []), node]);
  }

  return {
    ...patch,
    nodes: patch.nodes.map((node) => {
      const depth = depthFor(node.id);
      const row = groups.get(depth)?.findIndex((item) => item.id === node.id) ?? 0;
      return {
        ...node,
        position: {
          x: 60 + depth * 230,
          y: 44 + row * 126 + (depth % 2) * 22,
        },
      };
    }),
  };
}

export const useTexturePatchStore = create<TexturePatchState>((set) => ({
  ...recompute(starterPatch),
  history: createTexturePatchHistory(),
  stats: null,
  playback: playbackFromPatch(starterPatch),
  operatorBrowser: { tab: "TOP", search: "" },

  setSelectedNode: (id) =>
    set((state) => ({
      patch: { ...state.patch, selectedNodeId: id },
    })),

  setViewerNode: (id) =>
    set((state) => {
      const patch = {
        ...state.patch,
        viewerNodeId: id,
        nodes: state.patch.nodes.map((node) => ({ ...node, viewerActive: node.id === id })),
      };
      return recompute(patch);
    }),

  updateNodeParam: (nodeId, key, value) =>
    set((state) => {
      const currentNode = state.patch.nodes.find((node) => node.id === nodeId);
      if (!currentNode || currentNode.lock || currentNode.params[key] === value) return {};
      const patch = {
        ...state.patch,
        nodes: state.patch.nodes.map((node) =>
          node.id === nodeId ? { ...node, params: { ...node.params, [key]: value } } : node
        ),
      };
      return commitPatchState(state, patch, {
        type: "param:update",
        label: `Update ${key}`,
        nodeId,
        paramKey: key,
        from: currentNode.params[key],
        to: value,
      });
    }),

  setNodePosition: (nodeId, position) =>
    set((state) => {
      const currentNode = state.patch.nodes.find((node) => node.id === nodeId);
      if (!currentNode || currentNode.lock || (currentNode.position.x === position.x && currentNode.position.y === position.y)) return {};
      const patch = {
        ...state.patch,
        nodes: state.patch.nodes.map((node) => (node.id === nodeId ? { ...node, position } : node)),
      };
      return commitPatchState(state, patch, {
        type: "node:position",
        label: "Move node",
        nodeId,
      });
    }),

  addOperator: (type) =>
    set((state) => {
      if (type === "out" && state.patch.nodes.some((node) => node.type === "out")) return {};
      const node = createTextureNode(type, nextPosition(state.patch));
      const patch = {
        ...state.patch,
        nodes: [...state.patch.nodes, node],
        selectedNodeId: node.id,
      };
      return commitPatchState(state, patch, {
        type: "node:add",
        label: `Add ${node.label}`,
        nodeId: node.id,
      });
    }),

  deleteSelectedNode: () =>
    set((state) => {
      const node = selectedNode(state.patch);
      if (!node || !canDeleteNode(state.patch, node)) return {};
      const fallbackId = fallbackNodeIdAfterDelete(state.patch, node.id);
      const patch = {
        ...state.patch,
        nodes: state.patch.nodes.filter((item) => item.id !== node.id),
        edges: state.patch.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id),
        selectedNodeId: fallbackId,
        viewerNodeId: state.patch.viewerNodeId === node.id ? fallbackId : state.patch.viewerNodeId,
      };
      return commitPatchState(state, patch, {
        type: "node:delete",
        label: `Delete ${node.label}`,
        nodeId: node.id,
      });
    }),

  duplicateSelectedNode: () =>
    set((state) => {
      const node = selectedNode(state.patch);
      if (!node || node.type === "out") return {};
      const duplicate = createTextureNode(node.type, nextPosition(state.patch), {
        id: uniqueNodeId(state.patch, node.id),
        label: node.label,
        params: { ...node.params },
        bypass: node.bypass,
        lock: false,
      });
      const patch = {
        ...state.patch,
        nodes: [...state.patch.nodes, duplicate],
        selectedNodeId: duplicate.id,
      };
      return commitPatchState(state, patch, {
        type: "node:duplicate",
        label: `Duplicate ${node.label}`,
        nodeId: duplicate.id,
      });
    }),

  connectNodes: (source, target, targetPort) =>
    set((state) => {
      if (source === target) return {};
      const sourceNode = state.patch.nodes.find((node) => node.id === source);
      const targetNode = state.patch.nodes.find((node) => node.id === target);
      if (!sourceNode || !targetNode || targetNode.lock) return {};
      const targetOperator = getTextureOperator(targetNode.type);
      if (!targetOperator?.inputs.length) return {};
      const port = targetPort ?? defaultTargetPort(targetNode, state.patch.edges);
      const portDefinition = targetOperator.inputs.find((input) => input.id === port);
      if (!portDefinition) return {};
      const edge = createTextureEdge(source, target, port);
      if (state.patch.edges.some((item) => item.id === edge.id)) return {};
      const edges = portDefinition.multiple
        ? state.patch.edges
        : state.patch.edges.filter((item) => !(item.target === target && item.targetPort === port));
      const patch = { ...state.patch, edges: [...edges, edge] };
      return commitPatchState(state, patch, {
        type: "edge:connect",
        label: "Connect cable",
        edgeId: edge.id,
      });
    }),

  disconnectEdge: (edgeId) =>
    set((state) => {
      const edge = state.patch.edges.find((item) => item.id === edgeId);
      if (!edge) return {};
      const patch = {
        ...state.patch,
        edges: state.patch.edges.filter((item) => item.id !== edgeId),
      };
      return commitPatchState(state, patch, {
        type: "edge:disconnect",
        label: "Disconnect cable",
        edgeId,
      });
    }),

  autoLayout: () =>
    set((state) => commitPatchState(state, autoLayoutPatch(state.patch), {
      type: "layout:auto",
      label: "Auto layout",
    })),

  toggleBypass: (nodeId) =>
    set((state) => {
      const currentNode = state.patch.nodes.find((node) => node.id === nodeId);
      if (!currentNode || currentNode.type === "out") return {};
      const patch = {
        ...state.patch,
        nodes: state.patch.nodes.map((node) =>
          node.id === nodeId && node.type !== "out" ? { ...node, bypass: !node.bypass } : node
        ),
      };
      return commitPatchState(state, patch, {
        type: "node:bypass",
        label: currentNode.bypass ? "Disable bypass" : "Bypass node",
        nodeId,
      });
    }),

  toggleLock: (nodeId) =>
    set((state) => {
      const currentNode = state.patch.nodes.find((node) => node.id === nodeId);
      if (!currentNode) return {};
      const patch = {
        ...state.patch,
        nodes: state.patch.nodes.map((node) => (node.id === nodeId ? { ...node, lock: !node.lock } : node)),
      };
      return commitPatchState(state, patch, {
        type: "node:lock",
        label: currentNode.lock ? "Unlock node" : "Lock node",
        nodeId,
      });
    }),

  setRendererBackend: (backend) =>
    set((state) => {
      if (state.patch.rendererBackend === backend) return {};
      return commitPatchState(state, { ...state.patch, rendererBackend: backend }, {
        type: "renderer:set",
        label: `Set renderer ${backend}`,
      });
    }),

  setQuality: (quality) =>
    set((state) => {
      if (state.patch.quality === quality) return {};
      return commitPatchState(state, { ...state.patch, quality }, {
        type: "quality:set",
        label: `Set ${quality} quality`,
      });
    }),

  setPlaying: (playing) =>
    set((state) => ({
      playback: { ...state.playback, playing },
    })),

  setFrame: (frame) =>
    set((state) => {
      const duration = Math.max(1, state.playback.durationFrames);
      const clamped = state.playback.loop ? ((frame % duration) + duration) % duration : Math.max(0, Math.min(duration, frame));
      const patch = {
        ...state.patch,
        timeline: { ...(state.patch.timeline ?? { fps: state.playback.fpsTarget, durationFrames: duration, loop: state.playback.loop }), currentFrame: clamped },
      };
      return {
        ...recompute(patch),
        playback: { ...state.playback, frame: clamped },
      };
    }),

  setPlaybackRate: (rate) =>
    set((state) => ({
      playback: { ...state.playback, playbackRate: rate },
    })),

  selectOperatorCategory: (tab) =>
    set((state) => ({
      operatorBrowser: { ...state.operatorBrowser, tab },
    })),

  setOperatorSearch: (search) =>
    set((state) => ({
      operatorBrowser: { ...state.operatorBrowser, search },
    })),

  loadPatch: (patch) =>
    set({
      ...recompute(patch),
      history: createTexturePatchHistory(),
      stats: null,
      playback: playbackFromPatch(patch),
    }),

  loadRecipe: (id) =>
    set((state) => {
      const recipe = getTextureRecipe(id);
      if (!recipe) return {};
      const patch = recipe.create();
      const committed = commitPatchState(state, patch, {
        type: "recipe:load",
        label: `Load ${recipe.label}`,
        recipeId: id,
      });
      return {
        ...committed,
        playback: playbackFromPatch(patch),
      };
    }),

  applyCommand: (id) =>
    set((state) => {
      const patch = applyTextureCommand(state.patch, id);
      return commitPatchState(state, patch, {
        type: "recipe:command",
        label: "Apply recipe command",
        commandId: id,
      });
    }),

  undo: () =>
    set((state) => {
      const snapshot = undoTexturePatchCommand({ patch: state.patch, history: state.history ?? createTexturePatchHistory() });
      return restorePatchState(state, snapshot);
    }),

  redo: () =>
    set((state) => {
      const snapshot = redoTexturePatchCommand({ patch: state.patch, history: state.history ?? createTexturePatchHistory() });
      return restorePatchState(state, snapshot);
    }),

  markSaved: () =>
    set((state) => {
      const snapshot = markTexturePatchSaved({ patch: state.patch, history: state.history ?? createTexturePatchHistory() });
      return { history: snapshot.history };
    }),

  setStats: (stats) => set({ stats }),
}));
