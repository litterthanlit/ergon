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
  loadRecipe: (id: TextureRecipeId) => void;
  applyCommand: (id: TextureCommandId) => void;
  setStats: (stats: TextureRuntimeStats) => void;
};

const starterPatch = textureRecipes[0].create();

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

  loadRecipe: (id) =>
    set(() => {
      const recipe = getTextureRecipe(id);
      return recipe ? recompute(recipe.create()) : {};
    }),

  applyCommand: (id) =>
    set((state) => recompute(applyTextureCommand(state.patch, id))),

  setStats: (stats) => set({ stats }),
}));
