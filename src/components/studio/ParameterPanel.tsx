import type { ParamSchema, ParamValues, ParamDef } from "@/lib/types";
import { SliderControl } from "./controls/SliderControl";
import { SelectControl } from "./controls/SelectControl";
import { ToggleControl } from "./controls/ToggleControl";
import { ColorControl } from "./controls/ColorControl";

type Props = {
  schema: ParamSchema | null;
  values: ParamValues;
  onChange: (key: string, value: number | string | boolean) => void;
};

function renderControl(
  key: string,
  def: ParamDef,
  value: number | string | boolean,
  onChange: (key: string, value: number | string | boolean) => void
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
  }
}

export function ParameterPanel({ schema, values, onChange }: Props) {
  if (!schema) {
    return <div className="flex flex-col gap-4" />;
  }
  return (
    <div className="flex flex-col gap-5">
      {Object.entries(schema).map(([key, def]) => renderControl(key, def, values[key], onChange))}
    </div>
  );
}
