import type { ParamSchema, ParamValues } from "@/lib/types";

export type ParamManager = {
  register: (schema: ParamSchema) => ParamValues;
  update: (values: ParamValues) => void;
  getValues: () => ParamValues;
  getSchema: () => ParamSchema | null;
};

export function createParamManager(
  onSchema: (schema: ParamSchema) => void
): ParamManager {
  let currentSchema: ParamSchema | null = null;
  let currentValues: ParamValues = {};
  let proxy: ParamValues = {};

  function register(schema: ParamSchema): ParamValues {
    currentSchema = schema;
    currentValues = {};
    for (const key in schema) {
      currentValues[key] = schema[key].default;
    }
    proxy = new Proxy(currentValues, {
      get(target, prop: string) {
        return target[prop];
      },
      set() {
        return false;
      },
    });
    onSchema(schema);
    return proxy;
  }

  function update(values: ParamValues): void {
    if (!currentSchema) return;
    for (const key in values) {
      if (key in currentSchema) {
        currentValues[key] = values[key];
      }
    }
  }

  function getValues(): ParamValues {
    return { ...currentValues };
  }

  function getSchema(): ParamSchema | null {
    return currentSchema;
  }

  return { register, update, getValues, getSchema };
}
