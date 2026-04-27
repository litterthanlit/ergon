"use client";

import { create } from "zustand";
import {
  compilePatchToRenderPlan,
  createDefaultPatch,
  createNodeFromKind,
  validatePatch,
  valueAtTime,
  type KeyframeTrack,
  type RenderPlan,
  type VisualEdge,
  type VisualNodeKind,
  type VisualPatch,
} from "./visual-patch";
import type { ParamValue } from "./types";

type PatchState = {
  patch: VisualPatch;
  renderPlan: RenderPlan;
  setSelectedNode: (id: string) => void;
  updateNodeParam: (nodeId: string, key: string, value: ParamValue) => void;
  setNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  connectNodes: (source: string, target: string) => void;
  addNode: (kind: VisualNodeKind) => void;
  setTime: (time: number) => void;
  togglePlayback: () => void;
  addOrUpdateKeyframe: (nodeId: string, paramKey: string) => void;
  removeKeyframe: (trackId: string, keyframeId: string) => void;
};

function recompute(patch: VisualPatch) {
  return {
    patch,
    renderPlan: compilePatchToRenderPlan(patch),
  };
}

function createTrack(nodeId: string, paramKey: string, value: ParamValue, time: number): KeyframeTrack {
  return {
    id: `${nodeId}-${paramKey}`,
    nodeId,
    paramKey,
    keyframes: [
      { id: `${nodeId}-${paramKey}-0`, time: 0, value },
      { id: `${nodeId}-${paramKey}-${time}`, time, value },
    ],
  };
}

const defaultPatch = createDefaultPatch();

export const useVisualPatchStore = create<PatchState>((set) => ({
  patch: defaultPatch,
  renderPlan: compilePatchToRenderPlan(defaultPatch),

  setSelectedNode: (id) =>
    set((state) => ({
      patch: { ...state.patch, selectedNodeId: id },
    })),

  updateNodeParam: (nodeId, key, value) =>
    set((state) => {
      const patch = {
        ...state.patch,
        nodes: state.patch.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, params: { ...node.params, [key]: value } }
            : node
        ),
      };
      return recompute(patch);
    }),

  setNodePosition: (nodeId, position) =>
    set((state) => {
      const patch = {
        ...state.patch,
        nodes: state.patch.nodes.map((node) =>
          node.id === nodeId ? { ...node, position } : node
        ),
      };
      return recompute(patch);
    }),

  connectNodes: (source, target) =>
    set((state) => {
      if (source === target) return state;
      const edgeId = `${source}-${target}`;
      if (state.patch.edges.some((edge) => edge.id === edgeId)) return state;
      const edge: VisualEdge = { id: edgeId, source, target };
      const patch = { ...state.patch, edges: [...state.patch.edges, edge] };
      return recompute(patch);
    }),

  addNode: (kind) =>
    set((state) => {
      const node = createNodeFromKind(kind, state.patch.nodes.length);
      const patch = {
        ...state.patch,
        selectedNodeId: node.id,
        nodes: [...state.patch.nodes, node],
      };
      return recompute(patch);
    }),

  setTime: (time) =>
    set((state) => {
      const currentTime = Math.max(0, Math.min(state.patch.duration, time));
      const patch = {
        ...state.patch,
        currentTime,
        nodes: state.patch.nodes.map((node) => {
          const params = Object.fromEntries(
            Object.entries(node.params).map(([key, value]) => [
              key,
              valueAtTime({ ...state.patch, currentTime }, node.id, key, value),
            ])
          );
          return { ...node, params };
        }),
      };
      return recompute(patch);
    }),

  togglePlayback: () =>
    set((state) => ({
      patch: { ...state.patch, isPlaying: !state.patch.isPlaying },
    })),

  addOrUpdateKeyframe: (nodeId, paramKey) =>
    set((state) => {
      const node = state.patch.nodes.find((item) => item.id === nodeId);
      if (!node) return state;
      const value = node.params[paramKey];
      const time = Number(state.patch.currentTime.toFixed(2));
      const existing = state.patch.tracks.find(
        (track) => track.nodeId === nodeId && track.paramKey === paramKey
      );
      const tracks = existing
        ? state.patch.tracks.map((track) =>
            track.id === existing.id
              ? {
                  ...track,
                  keyframes: [
                    ...track.keyframes.filter((keyframe) => Math.abs(keyframe.time - time) > 0.01),
                    { id: `${track.id}-${time}`, time, value },
                  ].sort((a, b) => a.time - b.time),
                }
              : track
          )
        : [...state.patch.tracks, createTrack(nodeId, paramKey, value, time)];
      const patch = { ...state.patch, tracks };
      return validatePatch(patch) ? recompute(patch) : state;
    }),

  removeKeyframe: (trackId, keyframeId) =>
    set((state) => {
      const tracks = state.patch.tracks
        .map((track) =>
          track.id === trackId
            ? { ...track, keyframes: track.keyframes.filter((keyframe) => keyframe.id !== keyframeId) }
            : track
        )
        .filter((track) => track.keyframes.length > 0);
      return recompute({ ...state.patch, tracks });
    }),
}));
