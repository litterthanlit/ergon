import { create } from "zustand";
import type { ParamSchema, ParamValues } from "./types";
import { getDefaultValues } from "./types";
import type { Template } from "./templates/registry";
import { drift } from "./templates/drift";

type SandboxStatus = "loading" | "ready" | "error";

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
};

export const useStudioStore = create<StudioState>((set) => ({
  template: drift,
  code: drift.code,
  codeVersion: 0,
  schema: null,
  values: getDefaultValues(drift.schema),
  status: "loading",
  error: null,
  editorOpen: false,
  isFullscreen: false,

  setTemplate: (template) =>
    set({
      template,
      code: template.code,
      codeVersion: 0,
      schema: template.schema,
      values: getDefaultValues(template.schema),
      status: "loading",
      error: null,
    }),

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
    set((state) => ({
      values: { ...state.values, [key]: value },
    })),

  setStatus: (status) => set({ status }),

  setError: (error) => set({ error, status: "error" }),

  toggleEditor: () => set((state) => ({ editorOpen: !state.editorOpen })),

  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
