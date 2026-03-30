import type { ParamSchema, ParamValues, ParamDef, GradientStop } from "@/lib/types";
import { SliderControl } from "./controls/SliderControl";
import { SelectControl } from "./controls/SelectControl";
import { ToggleControl } from "./controls/ToggleControl";
import { ColorControl } from "./controls/ColorControl";
import { XYPadControl } from "./controls/XYPadControl";
import { GradientControl } from "./controls/GradientControl";
import { CurveControl } from "./controls/CurveControl";
import { RangeControl } from "./controls/RangeControl";

type ControlValue =
  | number
  | string
  | boolean
  | { x: number; y: number }
  | GradientStop[]
  | { x1: number; y1: number; x2: number; y2: number }
  | { min: number; max: number };

type Props = {
  schema: ParamSchema | null;
  values: ParamValues;
  onChange: (key: string, value: ControlValue) => void;
};

function renderControl(
  key: string,
  def: ParamDef,
  value: ControlValue,
  onChange: (key: string, value: ControlValue) => void
) {
  switch (def.type) {
    case "number":
      return (<SliderControl key={key} label={def.label} min={def.min} max={def.max} step={def.step} value={value as number} onChange={(v) => onChange(key, v)} />);
    case "select":
      return (<SelectControl key={key} label={def.label} options={def.options} value={value as string} onChange={(v) => onChange(key, v)} />);
    case "boolean":
      return (<ToggleControl key={key} label={def.label} value={value as boolean} onChange={(v) => onChange(key, v)} />);
    case "color":
      return (<ColorControl key={key} label={def.label} value={value as string} onChange={(v) => onChange(key, v)} />);
    case "xy":
      return (
        <XYPadControl
          key={key}
          label={def.label}
          minX={def.minX}
          maxX={def.maxX}
          minY={def.minY}
          maxY={def.maxY}
          value={(value as { x: number; y: number }) ?? def.default}
          onChange={(v) => onChange(key, v)}
        />
      );
    case "gradient":
      return (
        <GradientControl
          key={key}
          label={def.label}
          maxStops={def.maxStops}
          value={(value as GradientStop[]) ?? def.default}
          onChange={(v) => onChange(key, v)}
        />
      );
    case "curve":
      return (
        <CurveControl
          key={key}
          label={def.label}
          value={(value as { x1: number; y1: number; x2: number; y2: number }) ?? def.default}
          onChange={(v) => onChange(key, v)}
        />
      );
    case "range":
      return (
        <RangeControl
          key={key}
          label={def.label}
          min={def.min}
          max={def.max}
          step={def.step}
          value={(value as { min: number; max: number }) ?? def.default}
          onChange={(v) => onChange(key, v)}
        />
      );
  }
}

export function ParameterPanel({ schema, values, onChange }: Props) {
  if (!schema) {
    return <div className="flex flex-col gap-4" />;
  }
  return (
    <div className="flex flex-col gap-6">
      {Object.entries(schema).map(([key, def]) => renderControl(key, def, values[key], onChange))}
    </div>
  );
}
