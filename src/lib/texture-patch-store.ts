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
import type { ParamValue } from "./types";

type TexturePatchState = {
  patch: TexturePatch;
  renderPlan: TextureRenderPlan;
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
  connectNodes: (source: string, target: string, targetPort?: string) => void;
  toggleBypass: (nodeId: string) => void;
  toggleLock: (nodeId: string) => void;
  setRendererBackend: (backend: TextureRendererBackend) => void;
  setQuality: (quality: TextureQuality) => void;
  setPlaying: (playing: boolean) => void;
  setFrame: (frame: number) => void;
  setPlaybackRate: (rate: number) => void;
  selectOperatorCategory: (tab: TextureOperatorBrowserTab) => void;
  setOperatorSearch: (search: string) => void;
  loadRecipe: (id: TextureRecipeId) => void;
  applyCommand: (id: TextureCommandId) => void;
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

export const useTexturePatchStore = create<TexturePatchState>((set) => ({
  ...recompute(starterPatch),
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
      const patch = {
        ...state.patch,
        nodes: state.patch.nodes.map((node) =>
          node.id === nodeId ? { ...node, params: { ...node.params, [key]: value } } : node
        ),
      };
      return recompute(patch);
    }),

  setNodePosition: (nodeId, position) =>
    set((state) => {
      const patch = {
        ...state.patch,
        nodes: state.patch.nodes.map((node) => (node.id === nodeId ? { ...node, position } : node)),
      };
      return recompute(patch);
    }),

  addOperator: (type) =>
    set((state) => {
      const node = createTextureNode(type, nextPosition(state.patch));
      const patch = {
        ...state.patch,
        nodes: [...state.patch.nodes, node],
        selectedNodeId: node.id,
      };
      return recompute(patch);
    }),

  connectNodes: (source, target, targetPort) =>
    set((state) => {
      if (source === target) return state;
      const targetNode = state.patch.nodes.find((node) => node.id === target);
      if (!targetNode) return state;
      const port = targetPort ?? defaultTargetPort(targetNode, state.patch.edges);
      const edge = createTextureEdge(source, target, port);
      if (state.patch.edges.some((item) => item.id === edge.id)) return state;
      return recompute({ ...state.patch, edges: [...state.patch.edges, edge] });
    }),

  toggleBypass: (nodeId) =>
    set((state) => {
      const patch = {
        ...state.patch,
        nodes: state.patch.nodes.map((node) =>
          node.id === nodeId && node.type !== "out" ? { ...node, bypass: !node.bypass } : node
        ),
      };
      return recompute(patch);
    }),

  toggleLock: (nodeId) =>
    set((state) => ({
      patch: {
        ...state.patch,
        nodes: state.patch.nodes.map((node) => (node.id === nodeId ? { ...node, lock: !node.lock } : node)),
      },
    })),

  setRendererBackend: (backend) =>
    set((state) => recompute({ ...state.patch, rendererBackend: backend })),

  setQuality: (quality) =>
    set((state) => recompute({ ...state.patch, quality })),

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

  loadRecipe: (id) =>
    set(() => {
      const recipe = getTextureRecipe(id);
      if (!recipe) return {};
      const patch = recipe.create();
      return {
        ...recompute(patch),
        playback: playbackFromPatch(patch),
      };
    }),

  applyCommand: (id) =>
    set((state) => recompute(applyTextureCommand(state.patch, id))),

  setStats: (stats) => set({ stats }),
}));
