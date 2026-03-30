"use client";

import { useRef, useCallback } from "react";

type Props = {
  label: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  value: { x: number; y: number };
  onChange: (value: { x: number; y: number }) => void;
};

export function XYPadControl({ label, minX, maxX, minY, maxY, value, onChange }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const percentX = ((value.x - minX) / (maxX - minX)) * 100;
  const percentY = ((value.y - minY) / (maxY - minY)) * 100;

  const handlePointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const pad = padRef.current;
      if (!pad) return;
      const rect = pad.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const x = Math.round((minX + nx * (maxX - minX)) * 100) / 100;
      const y = Math.round((minY + ny * (maxY - minY)) * 100) / 100;
      onChange({ x, y });
    },
    [minX, maxX, minY, maxY, onChange]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handlePointer(e);
    },
    [handlePointer]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      handlePointer(e);
    },
    [handlePointer]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const displayX = typeof value.x === "number" ? (Number.isInteger(value.x) ? value.x : value.x.toFixed(1)) : value.x;
  const displayY = typeof value.y === "number" ? (Number.isInteger(value.y) ? value.y : value.y.toFixed(1)) : value.y;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-ergon-subtle uppercase tracking-[0.12em]">
          {label}
        </label>
        <span className="text-[11px] text-ergon-text font-mono tabular-nums">
          {displayX}, {displayY}
        </span>
      </div>
      <div
        ref={padRef}
        data-testid="xy-pad"
        className="relative w-full aspect-square bg-ergon-surface rounded border border-ergon-border cursor-crosshair select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-ergon-border" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-ergon-border" />
        </div>
        {/* Crosshair */}
        <div
          data-testid="xy-crosshair"
          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${percentX}%`, top: `${percentY}%` }}
        >
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-ergon-text -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-ergon-text -translate-y-1/2" />
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-ergon-text rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
}
