// --- Parameter Schema Types ---

export type NumberParam = {
  type: "number";
  min: number;
  max: number;
  default: number;
  step?: number;
  label: string;
};

export type SelectParam = {
  type: "select";
  options: string[];
  default: string;
  label: string;
};

export type BooleanParam = {
  type: "boolean";
  default: boolean;
  label: string;
};

export type ColorParam = {
  type: "color";
  default: string;
  label: string;
};

export type XYParam = {
  type: "xy";
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  default: { x: number; y: number };
  label: string;
};

export type GradientStop = { color: string; position: number };

export type GradientParam = {
  type: "gradient";
  default: GradientStop[];
  maxStops: number;
  label: string;
};

export type CurveParam = {
  type: "curve";
  default: { x1: number; y1: number; x2: number; y2: number };
  label: string;
};

export type RangeParam = {
  type: "range";
  min: number;
  max: number;
  step?: number;
  default: { min: number; max: number };
  label: string;
};

export type ParamDef =
  | NumberParam
  | SelectParam
  | BooleanParam
  | ColorParam
  | XYParam
  | GradientParam
  | CurveParam
  | RangeParam;

export type ParamSchema = Record<string, ParamDef>;

export type ParamValues = Record<
  string,
  | number
  | string
  | boolean
  | { x: number; y: number }
  | GradientStop[]
  | { x1: number; y1: number; x2: number; y2: number }
  | { min: number; max: number }
>;

export type ParamValue = ParamValues[string];

// --- Messages: Parent → Iframe ---

export type LoadCodeMessage = {
  type: "ergon:load";
  code: string;
  params: ParamValues;
};

export type UpdateParamsMessage = {
  type: "ergon:params";
  values: ParamValues;
};

export type SeedMessage = {
  type: "ergon:seed";
  seed: number;
};

// --- Export Messages ---

export type RequestExportMessage = {
  type: "ergon:export";
  format: "png";
  scale: number;
};

export type ExportDataMessage = {
  type: "ergon:export-data";
  dataUrl: string;
  width: number;
  height: number;
};

export type TransparentMessage = {
  type: "ergon:transparent";
  enabled: boolean;
};

export type ParentMessage = LoadCodeMessage | UpdateParamsMessage | RequestExportMessage | SeedMessage | TransparentMessage;

// --- Messages: Iframe → Parent ---

export type SchemaMessage = {
  type: "ergon:schema";
  schema: ParamSchema;
};

export type ReadyMessage = {
  type: "ergon:ready";
};

export type ErrorMessage = {
  type: "ergon:error";
  message: string;
};

export type ChildMessage = SchemaMessage | ReadyMessage | ErrorMessage | ExportDataMessage;

// --- Validation ---

export function validateParamSchema(schema: ParamSchema): boolean {
  for (const key in schema) {
    const param = schema[key];
    if (param.default === undefined) return false;
    if (param.label === undefined) return false;

    switch (param.type) {
      case "number":
        if (param.min === undefined || param.max === undefined) return false;
        if (param.default < param.min || param.default > param.max)
          return false;
        break;
      case "select":
        if (!param.options || param.options.length === 0) return false;
        if (!param.options.includes(param.default)) return false;
        break;
      case "boolean":
        if (typeof param.default !== "boolean") return false;
        break;
      case "color":
        if (typeof param.default !== "string") return false;
        break;
      case "xy":
        if (typeof param.default !== "object" || param.default === null) return false;
        if (typeof param.default.x !== "number" || typeof param.default.y !== "number") return false;
        if (param.default.x < param.minX || param.default.x > param.maxX) return false;
        if (param.default.y < param.minY || param.default.y > param.maxY) return false;
        break;
      case "gradient": {
        if (!Array.isArray(param.default) || param.default.length === 0) return false;
        if (typeof param.maxStops !== "number" || param.maxStops < 1) return false;
        for (const stop of param.default) {
          if (typeof stop.color !== "string") return false;
          if (typeof stop.position !== "number") return false;
          if (stop.position < 0 || stop.position > 1) return false;
        }
        break;
      }
      case "curve": {
        const d = param.default;
        if (typeof d !== "object" || d === null) return false;
        for (const k of ["x1", "y1", "x2", "y2"] as const) {
          if (typeof d[k] !== "number") return false;
        }
        if (d.x1 < 0 || d.x1 > 1 || d.x2 < 0 || d.x2 > 1) return false;
        break;
      }
      case "range": {
        const d = param.default;
        if (typeof d !== "object" || d === null) return false;
        if (typeof d.min !== "number" || typeof d.max !== "number") return false;
        if (d.min < param.min || d.max > param.max || d.min > d.max) return false;
        break;
      }
      default:
        return false;
    }
  }
  return true;
}

export function getDefaultValues(schema: ParamSchema): ParamValues {
  const values: ParamValues = {};
  for (const key in schema) {
    values[key] = schema[key].default;
  }
  return values;
}
