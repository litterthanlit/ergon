"use client";

import { useRef, useCallback } from "react";

type CurveValue = { x1: number; y1: number; x2: number; y2: number };

type Props = {
  label: string;
  value: CurveValue;
  onChange: (value: CurveValue) => void;
};

const PAD = 12; // px padding inside the SVG
const SIZE = 120; // total SVG size

function toSVG(nx: number, ny: number): [number, number] {
  // nx,ny in [0,1]; y is flipped (0=bottom in curve space = bottom in SVG)
  return [PAD + nx * (SIZE - 2 * PAD), PAD + (1 - ny) * (SIZE - 2 * PAD)];
}

function fromSVG(svgX: number, svgY: number): [number, number] {
  const nx = (svgX - PAD) / (SIZE - 2 * PAD);
  const ny = 1 - (svgY - PAD) / (SIZE - 2 * PAD);
  return [
    Math.max(0, Math.min(1, Math.round(nx * 1000) / 1000)),
    Math.round(ny * 1000) / 1000,
  ];
}

export function CurveControl({ label, value, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<"p1" | "p2" | null>(null);

  const getSVGPoint = useCallback((clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const rect = svg.getBoundingClientRect();
    return [
      ((clientX - rect.left) / rect.width) * SIZE,
      ((clientY - rect.top) / rect.height) * SIZE,
    ];
  }, []);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<SVGCircleElement>, point: "p1" | "p2") => {
      e.stopPropagation();
      dragging.current = point;
      (e.target as SVGElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const onSVGPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragging.current) return;
      const [svgX, svgY] = getSVGPoint(e.clientX, e.clientY);
      const [nx, ny] = fromSVG(svgX, svgY);
      if (dragging.current === "p1") {
        onChange({ ...value, x1: nx, y1: ny });
      } else {
        onChange({ ...value, x2: nx, y2: ny });
      }
    },
    [value, getSVGPoint, onChange]
  );

  const onSVGPointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const [p0x, p0y] = toSVG(0, 0);
  const [p1x, p1y] = toSVG(value.x1, value.y1);
  const [p2x, p2y] = toSVG(value.x2, value.y2);
  const [p3x, p3y] = toSVG(1, 1);

  const curvePath = `M ${p0x} ${p0y} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${p3x} ${p3y}`;
  const baselinePath = `M ${p0x} ${p0y} L ${p3x} ${p3y}`;

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
        {label}
      </label>
      <svg
        ref={svgRef}
        data-testid="curve-editor"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="rounded border border-ergon-border bg-ergon-surface cursor-crosshair touch-none select-none w-full"
        onPointerMove={onSVGPointerMove}
        onPointerUp={onSVGPointerUp}
      >
        {/* Grid */}
        <line x1={PAD} y1={PAD} x2={PAD} y2={SIZE - PAD} stroke="currentColor" strokeWidth={0.5} className="text-ergon-border" />
        <line x1={PAD} y1={SIZE - PAD} x2={SIZE - PAD} y2={SIZE - PAD} stroke="currentColor" strokeWidth={0.5} className="text-ergon-border" />

        {/* Baseline */}
        <path d={baselinePath} stroke="currentColor" strokeWidth={0.75} strokeDasharray="3 3" fill="none" className="text-ergon-border" />

        {/* Control arms */}
        <line x1={p0x} y1={p0y} x2={p1x} y2={p1y} stroke="currentColor" strokeWidth={0.75} strokeDasharray="2 2" fill="none" className="text-ergon-muted" />
        <line x1={p3x} y1={p3y} x2={p2x} y2={p2y} stroke="currentColor" strokeWidth={0.75} strokeDasharray="2 2" fill="none" className="text-ergon-muted" />

        {/* Curve */}
        <path d={curvePath} stroke="currentColor" strokeWidth={1.5} fill="none" className="text-ergon-text" />

        {/* Endpoint markers */}
        <circle cx={p0x} cy={p0y} r={3} fill="currentColor" className="text-ergon-text" />
        <circle cx={p3x} cy={p3y} r={3} fill="currentColor" className="text-ergon-text" />

        {/* Control point handles */}
        <circle
          data-testid="curve-handle-1"
          cx={p1x}
          cy={p1y}
          r={5}
          fill="currentColor"
          className="text-ergon-surface cursor-grab"
          stroke="currentColor"
          strokeWidth={1.5}
          style={{ stroke: "var(--color-ergon-text)" }}
          onPointerDown={(e) => onHandlePointerDown(e, "p1")}
        />
        <circle
          data-testid="curve-handle-2"
          cx={p2x}
          cy={p2y}
          r={5}
          fill="currentColor"
          className="text-ergon-surface cursor-grab"
          stroke="currentColor"
          strokeWidth={1.5}
          style={{ stroke: "var(--color-ergon-text)" }}
          onPointerDown={(e) => onHandlePointerDown(e, "p2")}
        />
      </svg>
    </div>
  );
}
