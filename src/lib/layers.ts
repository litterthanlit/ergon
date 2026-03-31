import type { ParamSchema, ParamValues } from "./types";

export type BlockRole = "base" | "shape" | "color" | "motion" | "texture";

export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "luminosity",
] as const;

export type BlendMode = (typeof BLEND_MODES)[number];

export type Layer = {
  id: string;
  templateId: string;
  role: BlockRole;
  name: string;
  code: string;
  schema: ParamSchema | null;
  values: ParamValues;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
};

let nextId = 1;

export function createLayer(
  templateId: string,
  role: BlockRole,
  name: string,
  code: string,
  schema: ParamSchema | null = null,
  values: ParamValues = {}
): Layer {
  return {
    id: `layer-${nextId++}-${Date.now()}`,
    templateId,
    role,
    name,
    code,
    schema,
    values,
    visible: true,
    opacity: 0.7,
    blendMode: "screen",
  };
}
