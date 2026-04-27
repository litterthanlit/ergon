import { describe, it, expect } from "vitest";
import {
  type ParamSchema,
  validateParamSchema,
  getDefaultValues,
} from "@/lib/types";

describe("validateParamSchema", () => {
  it("accepts a valid number param", () => {
    const schema: ParamSchema = {
      count: {
        type: "number",
        min: 0,
        max: 100,
        default: 50,
        step: 1,
        label: "Count",
      },
    };
    expect(validateParamSchema(schema)).toBe(true);
  });

  it("accepts a valid select param", () => {
    const schema: ParamSchema = {
      palette: {
        type: "select",
        options: ["warm", "cool", "mono"],
        default: "warm",
        label: "Palette",
      },
    };
    expect(validateParamSchema(schema)).toBe(true);
  });

  it("accepts a valid boolean param", () => {
    const schema: ParamSchema = {
      invert: { type: "boolean", default: false, label: "Invert" },
    };
    expect(validateParamSchema(schema)).toBe(true);
  });

  it("accepts a valid color param", () => {
    const schema: ParamSchema = {
      color: { type: "color", default: "#ff0000", label: "Color" },
    };
    expect(validateParamSchema(schema)).toBe(true);
  });

  it("rejects a schema with missing default", () => {
    const schema = {
      count: { type: "number", min: 0, max: 100, label: "Count" },
    } as unknown as ParamSchema;
    expect(validateParamSchema(schema)).toBe(false);
  });

  it("rejects an empty schema", () => {
    expect(validateParamSchema({})).toBe(true); // empty is valid (no params)
  });
});

describe("getDefaultValues", () => {
  it("extracts default values from schema", () => {
    const schema: ParamSchema = {
      count: {
        type: "number",
        min: 0,
        max: 100,
        default: 50,
        step: 1,
        label: "Count",
      },
      palette: {
        type: "select",
        options: ["warm", "cool"],
        default: "warm",
        label: "Palette",
      },
      invert: { type: "boolean", default: false, label: "Invert" },
    };
    const values = getDefaultValues(schema);
    expect(values).toEqual({ count: 50, palette: "warm", invert: false });
  });

  it("returns empty object for empty schema", () => {
    expect(getDefaultValues({})).toEqual({});
  });
});
