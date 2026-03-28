import { create } from "zustand";
import type { ParamSchema, ParamValues } from "./types";
import { getDefaultValues } from "./types";
import type { Template } from "./templates/registry";
import { drift } from "./templates/drift";

type SandboxStatus = "loading" | "ready" | "error";

type StudioState = {
  template: Template;
  code: string;
  schema: ParamSchema | null;
  values: ParamValues;
  status: SandboxStatus;
  error: string | null;

  setTemplate: (template: Template) => void;
  setSchema: (schema: ParamSchema) => void;
  setParamValue: (key: string, value: number | string | boolean) => void;
  setStatus: (status: SandboxStatus) => void;
  setError: (error: string | null) => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  template: drift,
  code: drift.code,
  schema: null,
  values: getDefaultValues(drift.schema),
  status: "loading",
  error: null,

  setTemplate: (template) =>
    set({
      template,
      code: template.code,
      schema: template.schema,
      values: getDefaultValues(template.schema),
      status: "loading",
      error: null,
    }),

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
}));
