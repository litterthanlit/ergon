"use client";

import { useRef, useCallback, useState } from "react";
import type { GradientStop } from "@/lib/types";

type Props = {
  label: string;
  maxStops: number;
  value: GradientStop[];
  onChange: (value: GradientStop[]) => void;
};

function stopsToGradient(stops: GradientStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const parts = sorted.map((s) => `${s.color} ${(s.position * 100).toFixed(1)}%`);
  return `linear-gradient(to right, ${parts.join(", ")})`;
}

export function GradientControl({ label, maxStops, value, onChange }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const draggingIndex = useRef<number | null>(null);
  // Track which stop index is actively color-picking
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  const getPosition = useCallback((clientX: number): number => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const onBarPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only fire when clicking the bar itself, not a handle
      if ((e.target as HTMLElement).dataset.handle !== undefined) return;
      if (value.length >= maxStops) return;
      const pos = getPosition(e.clientX);
      // Sample color from the nearest stop
      const sorted = [...value].sort((a, b) => a.position - b.position);
      const nearest = sorted.reduce((prev, cur) =>
        Math.abs(cur.position - pos) < Math.abs(prev.position - pos) ? cur : prev
      );
      const newStop: GradientStop = { color: nearest.color, position: pos };
      onChange([...value, newStop]);
    },
    [value, maxStops, getPosition, onChange]
  );

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      e.stopPropagation();
      draggingIndex.current = index;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const onHandlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      if (draggingIndex.current !== index) return;
      const pos = getPosition(e.clientX);
      const updated = value.map((s, i) =>
        i === index ? { ...s, position: Math.round(pos * 1000) / 1000 } : s
      );
      onChange(updated);
    },
    [value, getPosition, onChange]
  );

  const onHandlePointerUp = useCallback(() => {
    draggingIndex.current = null;
  }, []);

  const onHandleDoubleClick = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      if (value.length <= 2) return;
      onChange(value.filter((_, i) => i !== index));
      if (pickerIndex === index) setPickerIndex(null);
    },
    [value, onChange, pickerIndex]
  );

  const onColorChange = useCallback(
    (index: number, color: string) => {
      onChange(value.map((s, i) => (i === index ? { ...s, color } : s)));
    },
    [value, onChange]
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
          {label}
        </label>
        <span className="text-[10px] text-ergon-muted font-mono tabular-nums">
          {value.length} stops
        </span>
      </div>

      {/* Gradient bar + handles */}
      <div
        ref={barRef}
        data-testid="gradient-bar"
        className="relative h-8 rounded border border-ergon-border cursor-crosshair select-none touch-none"
        style={{ background: stopsToGradient(value) }}
        onPointerDown={onBarPointerDown}
      >
        {value.map((stop, i) => (
          <div
            key={i}
            data-handle=""
            data-testid={`gradient-handle-${i}`}
            className="absolute top-0 bottom-0 w-3 -translate-x-1/2 flex items-center justify-center cursor-grab touch-none"
            style={{ left: `${stop.position * 100}%` }}
            onPointerDown={(e) => onHandlePointerDown(e, i)}
            onPointerMove={(e) => onHandlePointerMove(e, i)}
            onPointerUp={onHandlePointerUp}
            onDoubleClick={(e) => onHandleDoubleClick(e, i)}
            onClick={(e) => { e.stopPropagation(); setPickerIndex(pickerIndex === i ? null : i); }}
          >
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ background: stop.color }}
            />
          </div>
        ))}
      </div>

      {/* Inline color picker for selected stop */}
      {pickerIndex !== null && value[pickerIndex] && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-ergon-muted uppercase tracking-[0.14em]">
            Stop {pickerIndex + 1}
          </span>
          <input
            type="color"
            data-testid="gradient-color-picker"
            value={value[pickerIndex].color}
            onChange={(e) => onColorChange(pickerIndex, e.target.value)}
            className="w-6 h-6 rounded border border-ergon-border cursor-pointer bg-transparent"
          />
          <span className="text-[10px] text-ergon-muted font-mono">
            {(value[pickerIndex].position * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}
