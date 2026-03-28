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

export type ParamDef = NumberParam | SelectParam | BooleanParam | ColorParam;

export type ParamSchema = Record<string, ParamDef>;

export type ParamValues = Record<string, number | string | boolean>;

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

export type ParentMessage = LoadCodeMessage | UpdateParamsMessage;

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

export type ChildMessage = SchemaMessage | ReadyMessage | ErrorMessage;

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
