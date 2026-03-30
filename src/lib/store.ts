import { create } from "zustand";
import type { ParamSchema, ParamValues } from "./types";
import { getDefaultValues } from "./types";
import type { Template } from "./templates/registry";
import { drift } from "./templates/drift";
import { createHistory, type History } from "./history";

type SandboxStatus = "loading" | "ready" | "error";

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

  // UI
  editorOpen: boolean;
  isFullscreen: boolean;

  // Seed
  seed: number;

  // History
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setTemplate: (template: Template) => void;
  setCode: (code: string) => void;
  runCode: () => void;
  setSchema: (schema: ParamSchema) => void;
  setParamValue: (key: string, value: number | string | boolean) => void;
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
  editorOpen: false,
  isFullscreen: false,
  canUndo: false,
  canRedo: false,

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
    });
  },

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

  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

  randomize: () =>
    set({ seed: Math.floor(Math.random() * 999999) }),
}));
