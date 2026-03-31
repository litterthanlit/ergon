"use client";

import { useCallback } from "react";

type RangeValue = { min: number; max: number };

type Props = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: RangeValue;
  onChange: (value: RangeValue) => void;
};

export function RangeControl({ label, min, max, step = 1, value, onChange }: Props) {
  const range = max - min;
  const lowPct = ((value.min - min) / range) * 100;
  const highPct = ((value.max - min) / range) * 100;

  const onLowChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = Math.min(parseFloat(e.target.value), value.max - step);
      onChange({ ...value, min: newMin });
    },
    [value, step, onChange]
  );

  const onHighChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = Math.max(parseFloat(e.target.value), value.min + step);
      onChange({ ...value, max: newMax });
    },
    [value, step, onChange]
  );

  const displayMin = Number.isInteger(value.min) ? value.min : value.min.toFixed(2);
  const displayMax = Number.isInteger(value.max) ? value.max : value.max.toFixed(2);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
          {label}
        </label>
        <span className="text-[10px] text-ergon-text font-mono tabular-nums">
          {displayMin} – {displayMax}
        </span>
      </div>

      {/* Dual-thumb track */}
      <div
        data-testid="range-track"
        className="relative h-4 flex items-center"
      >
        {/* Filled segment */}
        <div
          className="absolute h-1 rounded-full bg-ergon-text pointer-events-none"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />
        {/* Base track */}
        <div className="absolute inset-x-0 h-1 rounded-full bg-ergon-border -z-10" />

        {/* Low thumb */}
        <input
          type="range"
          data-testid="range-thumb-low"
          min={min}
          max={max}
          step={step}
          value={value.min}
          onChange={onLowChange}
          className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer"
          style={{ zIndex: value.min > max - (range * 0.05) ? 5 : 3 }}
        />

        {/* High thumb */}
        <input
          type="range"
          data-testid="range-thumb-high"
          min={min}
          max={max}
          step={step}
          value={value.max}
          onChange={onHighChange}
          className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer"
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}
