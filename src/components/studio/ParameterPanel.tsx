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
  tone?: "light" | "dark";
  title?: string;
  description?: string;
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

export function ParameterPanel({
  schema,
  values,
  onChange,
  tone = "light",
  title,
  description,
}: Props) {
  const isDark = tone === "dark";
  if (!schema) {
    return (
      <div className={`rounded-2xl border border-dashed px-4 py-4 ${
        isDark ? "border-white/10 bg-white/[0.035]" : "border-ergon-border/80 bg-white/50"
      }`}>
        <div className="flex flex-col gap-1">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
            isDark ? "text-zinc-500" : "text-ergon-subtle"
          }`}>
            Shape the block
          </span>
          <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-500" : "text-ergon-muted"}`}>
            Pick a block or load a recipe to give the composition something to push against.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
          isDark ? "text-zinc-500" : "text-ergon-subtle"
        }`}>
          {title ?? "Shape the active form"}
        </span>
        <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-500" : "text-ergon-muted"}`}>
          {description ?? "These controls shape the currently selected block in the composition."}
        </p>
      </div>
      <div className="flex flex-col gap-5">
          {Object.entries(schema).map(([key, def], index) => (
            <div
              key={key}
              className={index === 0 ? "" : "border-t border-ergon-border/60 pt-5"}
            >
              {renderControl(key, def, values[key], onChange)}
            </div>
          ))}
      </div>
    </div>
  );
}
