import { create } from "zustand";
import type { ParamSchema, ParamValues } from "./types";
import { getDefaultValues } from "./types";
import type { Template } from "./templates/registry";
import { drift } from "./templates/drift";
import { createHistory, type History } from "./history";
import { createLayer, type Layer, type BlendMode } from "./layers";

type SandboxStatus = "loading" | "ready" | "error";

type AspectRatio = "free" | "1:1" | "16:9" | "4:3";

let paramHistory: History = createHistory(getDefaultValues(drift.schema));

type StudioState = {
  // Template
  template: Template;

  // Code — the live code in the editor (may differ from template.code)
  code: string;
  // Incremented to signal the sandbox should reload with current code
  codeVersion: number;

  // Parameters
  schema: ParamSchema | null;
  values: ParamValues;

  // Sandbox
  status: SandboxStatus;
  error: string | null;

  // Persistence
  workId: string | null;
  workTitle: string;
  workSlug: string | null;
  isSaving: boolean;
  isPublishing: boolean;
  setWorkId: (id: string) => void;
  setWorkTitle: (title: string) => void;
  setWorkSlug: (slug: string) => void;
  setIsSaving: (saving: boolean) => void;
  setIsPublishing: (publishing: boolean) => void;

  // UI
  editorOpen: boolean;
  isFullscreen: boolean;
  editorHeight: number;
  setEditorHeight: (height: number) => void;
  aspect: AspectRatio;
  cycleAspect: () => void;

  // Seed
  seed: number;

  // History
  canUndo: boolean;
  canRedo: boolean;

  // Layers / Composition
  compositionMode: boolean;
  layers: Layer[];
  activeLayerIndex: number;
  toggleCompositionMode: () => void;
  addLayer: (templateId: string, name: string, code: string, schema: ParamSchema | null, values: ParamValues) => void;
  removeLayer: (layerId: string) => void;
  setActiveLayer: (index: number) => void;
  updateLayerVisibility: (layerId: string, visible: boolean) => void;
  updateLayerOpacity: (layerId: string, opacity: number) => void;
  updateLayerBlendMode: (layerId: string, blendMode: BlendMode) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  updateLayerParams: (layerId: string, key: string, value: number | string | boolean | { x: number; y: number }) => void;
  updateLayerCode: (layerId: string, code: string) => void;

  // Actions
  setTemplate: (template: Template) => void;
  setCode: (code: string) => void;
  runCode: () => void;
  setSchema: (schema: ParamSchema) => void;
  setParamValue: (key: string, value: number | string | boolean | { x: number; y: number }) => void;
  setStatus: (status: SandboxStatus) => void;
  setError: (error: string | null) => void;
  toggleEditor: () => void;
  toggleFullscreen: () => void;
  undo: () => void;
  redo: () => void;
  randomize: () => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  template: drift,
  code: drift.code,
  codeVersion: 0,
  schema: null,
  values: getDefaultValues(drift.schema),
  status: "loading",
  error: null,
  seed: Math.floor(Math.random() * 999999),
  workId: null,
  workTitle: "Untitled",
  workSlug: null,
  isSaving: false,
  isPublishing: false,
  editorOpen: false,
  isFullscreen: false,
  editorHeight: 300,
  aspect: "free" as AspectRatio,
  canUndo: false,
  canRedo: false,
  compositionMode: false,
  layers: [],
  activeLayerIndex: 0,

  toggleCompositionMode: () =>
    set((state) => {
      if (!state.compositionMode) {
        // Entering composition mode — create initial layer from current template
        const initialLayer = createLayer(
          state.template.id,
          state.template.name,
          state.code,
          state.schema,
          state.values
        );
        return { compositionMode: true, layers: [initialLayer], activeLayerIndex: 0 };
      }
      return { compositionMode: false };
    }),

  addLayer: (templateId, name, code, schema, values) =>
    set((state) => ({
      layers: [...state.layers, createLayer(templateId, name, code, schema, values)],
      activeLayerIndex: state.layers.length,
    })),

  removeLayer: (layerId) =>
    set((state) => {
      const layers = state.layers.filter((l) => l.id !== layerId);
      const activeLayerIndex = Math.min(state.activeLayerIndex, Math.max(0, layers.length - 1));
      return { layers, activeLayerIndex };
    }),

  setActiveLayer: (index) => set({ activeLayerIndex: index }),

  updateLayerVisibility: (layerId, visible) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, visible } : l
      ),
    })),

  updateLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l
      ),
    })),

  updateLayerBlendMode: (layerId, blendMode) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, blendMode } : l
      ),
    })),

  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      const layers = [...state.layers];
      const [moved] = layers.splice(fromIndex, 1);
      layers.splice(toIndex, 0, moved);
      return { layers, activeLayerIndex: toIndex };
    }),

  updateLayerParams: (layerId, key, value) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, values: { ...l.values, [key]: value } } : l
      ),
    })),

  updateLayerCode: (layerId, code) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, code } : l
      ),
    })),

  setTemplate: (template) => {
    const defaults = getDefaultValues(template.schema);
    paramHistory.reset(defaults);
    return set({
      template,
      code: template.code,
      codeVersion: 0,
      schema: template.schema,
      values: defaults,
      status: "loading",
      error: null,
      canUndo: false,
      canRedo: false,
      workId: null,
      workTitle: "Untitled",
      workSlug: null,
    });
  },

  setWorkId: (id) => set({ workId: id }),
  setWorkTitle: (title) => set({ workTitle: title }),
  setWorkSlug: (slug) => set({ workSlug: slug }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setIsPublishing: (publishing) => set({ isPublishing: publishing }),

  setCode: (code) => set({ code }),

  runCode: () =>
    set((state) => ({
      codeVersion: state.codeVersion + 1,
      status: "loading",
      error: null,
    })),

  setSchema: (schema) =>
    set((state) => ({
      schema,
      values: {
        ...getDefaultValues(schema),
        ...Object.fromEntries(
          Object.entries(state.values).filter(([key]) => key in schema)
        ),
      },
    })),

  setParamValue: (key, value) =>
    set((state) => {
      const newValues = { ...state.values, [key]: value };
      paramHistory.push(newValues);
      return {
        values: newValues,
        canUndo: paramHistory.canUndo(),
        canRedo: paramHistory.canRedo(),
      };
    }),

  undo: () =>
    set(() => {
      const prev = paramHistory.undo();
      if (!prev) return {};
      return {
        values: prev,
        canUndo: paramHistory.canUndo(),
        canRedo: paramHistory.canRedo(),
      };
    }),

  redo: () =>
    set(() => {
      const next = paramHistory.redo();
      if (!next) return {};
      return {
        values: next,
        canUndo: paramHistory.canUndo(),
        canRedo: paramHistory.canRedo(),
      };
    }),

  setStatus: (status) => set({ status }),

  setError: (error) => set({ error, status: "error" }),

  toggleEditor: () => set((state) => ({ editorOpen: !state.editorOpen })),

  setEditorHeight: (height) =>
    set({ editorHeight: Math.max(120, Math.min(height, typeof window !== "undefined" ? window.innerHeight * 0.7 : 600)) }),

  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

  randomize: () =>
    set({ seed: Math.floor(Math.random() * 999999) }),

  cycleAspect: () =>
    set((state) => {
      const ratios: AspectRatio[] = ["free", "1:1", "16:9", "4:3"];
      const idx = ratios.indexOf(state.aspect);
      return { aspect: ratios[(idx + 1) % ratios.length] };
    }),
}));

export type { AspectRatio };
