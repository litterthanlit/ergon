# New Parameter Types: Gradient, Curve, Range

**Date:** 2026-03-30
**Branch:** feature/new-param-types (off `main`)

## Overview

Add three new parameter types to Ergon Studio:

- **GradientParam** — multi-stop gradient editor
- **CurveParam** — cubic bezier curve editor
- **RangeParam** — dual-handle range slider

Each type follows the established pattern: a new type definition in `src/lib/types.ts`, a self-contained control component in `src/components/studio/controls/`, a test file, and a wired case in `ParameterPanel`.

---

## Task 1: Update `src/lib/types.ts`

Add three new param types, expand the `ParamDef` union, expand `ParamValues`, and add validation cases.

**File:** `src/lib/types.ts`

### 1a. Add type definitions

Insert after `XYParam` (line 39), before the `ParamDef` union:

```typescript
export type GradientStop = { color: string; position: number };

export type GradientParam = {
  type: "gradient";
  default: GradientStop[];
  maxStops: number;
  label: string;
};

export type CurveParam = {
  type: "curve";
  default: { x1: number; y1: number; x2: number; y2: number };
  label: string;
};

export type RangeParam = {
  type: "range";
  min: number;
  max: number;
  step?: number;
  default: { min: number; max: number };
  label: string;
};
```

### 1b. Update `ParamDef` union

```typescript
export type ParamDef =
  | NumberParam
  | SelectParam
  | BooleanParam
  | ColorParam
  | XYParam
  | GradientParam
  | CurveParam
  | RangeParam;
```

### 1c. Update `ParamValues`

```typescript
export type ParamValues = Record<
  string,
  | number
  | string
  | boolean
  | { x: number; y: number }
  | GradientStop[]
  | { x1: number; y1: number; x2: number; y2: number }
  | { min: number; max: number }
>;
```

### 1d. Update `validateParamSchema` — add cases inside the `switch`

```typescript
case "gradient": {
  if (!Array.isArray(param.default) || param.default.length === 0) return false;
  if (typeof param.maxStops !== "number" || param.maxStops < 1) return false;
  for (const stop of param.default) {
    if (typeof stop.color !== "string") return false;
    if (typeof stop.position !== "number") return false;
    if (stop.position < 0 || stop.position > 1) return false;
  }
  break;
}
case "curve": {
  const d = param.default;
  if (typeof d !== "object" || d === null) return false;
  for (const k of ["x1", "y1", "x2", "y2"] as const) {
    if (typeof d[k] !== "number") return false;
  }
  if (d.x1 < 0 || d.x1 > 1 || d.x2 < 0 || d.x2 > 1) return false;
  break;
}
case "range": {
  const d = param.default;
  if (typeof d !== "object" || d === null) return false;
  if (typeof d.min !== "number" || typeof d.max !== "number") return false;
  if (d.min < param.min || d.max > param.max || d.min > d.max) return false;
  break;
}
```

The `default` case in the existing switch already returns `false`, so unknown types remain rejected.

---

## Task 2: GradientControl

**File:** `src/components/studio/controls/GradientControl.tsx`

The control renders:
1. A label row (label left, stop count right)
2. A gradient bar built from the stops via `background: linear-gradient(...)`
3. Draggable stop handles on the bar — pointer capture for smooth drag
4. Click on the bar (not on a handle) to add a new stop, capped at `maxStops`
5. Double-click on a stop handle to remove it (minimum 2 stops enforced)

```typescript
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
```

**Test file:** `src/__tests__/components/GradientControl.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GradientControl } from "@/components/studio/controls/GradientControl";

const defaultStops = [
  { color: "#000000", position: 0 },
  { color: "#ffffff", position: 1 },
];

describe("GradientControl", () => {
  it("renders the label", () => {
    render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={vi.fn()} />
    );
    expect(screen.getByText("Gradient")).toBeInTheDocument();
  });

  it("renders the gradient bar", () => {
    const { container } = render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='gradient-bar']")).toBeInTheDocument();
  });

  it("renders a handle for each stop", () => {
    const { container } = render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='gradient-handle-0']")).toBeInTheDocument();
    expect(container.querySelector("[data-testid='gradient-handle-1']")).toBeInTheDocument();
  });

  it("shows stop count", () => {
    render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={vi.fn()} />
    );
    expect(screen.getByText("2 stops")).toBeInTheDocument();
  });

  it("calls onChange when a stop color is changed via picker", () => {
    const onChange = vi.fn();
    const { container } = render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={onChange} />
    );
    // Click the first handle to open the color picker
    const handle = container.querySelector("[data-testid='gradient-handle-0']") as HTMLElement;
    fireEvent.click(handle);
    const picker = screen.getByTestId("gradient-color-picker");
    fireEvent.change(picker, { target: { value: "#ff0000" } });
    expect(onChange).toHaveBeenCalledWith([
      { color: "#ff0000", position: 0 },
      { color: "#ffffff", position: 1 },
    ]);
  });

  it("does not remove a stop when only 2 remain (double-click)", () => {
    const onChange = vi.fn();
    const { container } = render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={onChange} />
    );
    const handle = container.querySelector("[data-testid='gradient-handle-0']") as HTMLElement;
    fireEvent.dblClick(handle);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a stop on double-click when more than 2 exist", () => {
    const onChange = vi.fn();
    const threeStops = [
      { color: "#000000", position: 0 },
      { color: "#888888", position: 0.5 },
      { color: "#ffffff", position: 1 },
    ];
    const { container } = render(
      <GradientControl label="Gradient" maxStops={5} value={threeStops} onChange={onChange} />
    );
    const handle = container.querySelector("[data-testid='gradient-handle-1']") as HTMLElement;
    fireEvent.dblClick(handle);
    expect(onChange).toHaveBeenCalledWith([
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ]);
  });
});
```

---

## Task 3: CurveControl

**File:** `src/components/studio/controls/CurveControl.tsx`

The control renders:
1. A label row
2. A square SVG canvas (120×120 px) with:
   - A diagonal baseline from (0,1) to (1,0) in CSS units as a reference
   - The cubic bezier curve drawn with an SVG `<path>` using `C` command
   - Two control point handles (circles) connected to the endpoints by dashed lines
3. Pointer capture on each handle for drag interaction
4. The curve space maps (0,0) = bottom-left, (1,1) = top-right (standard CSS easing convention)

```typescript
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
```

**Test file:** `src/__tests__/components/CurveControl.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CurveControl } from "@/components/studio/controls/CurveControl";

const defaultValue = { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 };

describe("CurveControl", () => {
  it("renders the label", () => {
    render(<CurveControl label="Easing" value={defaultValue} onChange={vi.fn()} />);
    expect(screen.getByText("Easing")).toBeInTheDocument();
  });

  it("renders the SVG editor", () => {
    const { container } = render(
      <CurveControl label="Easing" value={defaultValue} onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='curve-editor']")).toBeInTheDocument();
  });

  it("renders both control point handles", () => {
    const { container } = render(
      <CurveControl label="Easing" value={defaultValue} onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='curve-handle-1']")).toBeInTheDocument();
    expect(container.querySelector("[data-testid='curve-handle-2']")).toBeInTheDocument();
  });

  it("calls onChange with updated p1 position on pointer move while dragging handle 1", () => {
    const onChange = vi.fn();
    const { container } = render(
      <CurveControl label="Easing" value={defaultValue} onChange={onChange} />
    );
    const handle = container.querySelector("[data-testid='curve-handle-1']") as SVGCircleElement;
    const svg = container.querySelector("[data-testid='curve-editor']") as SVGSVGElement;

    // Mock getBoundingClientRect
    jest.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 120, height: 120, right: 120, bottom: 120, x: 0, y: 0, toJSON: () => {},
    } as DOMRect);

    handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 42, clientY: 42 }));
    svg.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 60, clientY: 60 }));
    expect(onChange).toHaveBeenCalled();
  });
});
```

> Note: The `jest.spyOn` reference in the test above should use `vi.spyOn` since the suite uses Vitest. Correct it at write time:
>
> ```typescript
> vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({ ... });
> ```

---

## Task 4: RangeControl

**File:** `src/components/studio/controls/RangeControl.tsx`

The control renders:
1. A label row (label left, `min – max` value display right)
2. A custom dual-thumb track — a single `<div>` with two overlapping native `<input type="range">` elements positioned absolutely. The filled segment between thumbs is drawn via a CSS linear-gradient on the track.

Using two overlapping `<input type="range">` is the most reliable cross-browser approach for a dual-handle slider without a custom drag canvas. The lower input sits below the upper in z-index; both share the same min/max. The active thumb is determined by whichever would be dragged.

```typescript
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
```

**Test file:** `src/__tests__/components/RangeControl.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RangeControl } from "@/components/studio/controls/RangeControl";

describe("RangeControl", () => {
  it("renders the label", () => {
    render(
      <RangeControl label="Radius" min={0} max={100} value={{ min: 20, max: 80 }} onChange={vi.fn()} />
    );
    expect(screen.getByText("Radius")).toBeInTheDocument();
  });

  it("renders the range track", () => {
    const { container } = render(
      <RangeControl label="Radius" min={0} max={100} value={{ min: 20, max: 80 }} onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='range-track']")).toBeInTheDocument();
  });

  it("displays current min and max values", () => {
    render(
      <RangeControl label="Radius" min={0} max={100} value={{ min: 20, max: 80 }} onChange={vi.fn()} />
    );
    expect(screen.getByText("20 – 80")).toBeInTheDocument();
  });

  it("calls onChange with updated min when low thumb changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeControl label="Radius" min={0} max={100} step={1} value={{ min: 20, max: 80 }} onChange={onChange} />
    );
    const lowThumb = container.querySelector("[data-testid='range-thumb-low']") as HTMLInputElement;
    fireEvent.change(lowThumb, { target: { value: "30" } });
    expect(onChange).toHaveBeenCalledWith({ min: 30, max: 80 });
  });

  it("calls onChange with updated max when high thumb changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeControl label="Radius" min={0} max={100} step={1} value={{ min: 20, max: 80 }} onChange={onChange} />
    );
    const highThumb = container.querySelector("[data-testid='range-thumb-high']") as HTMLInputElement;
    fireEvent.change(highThumb, { target: { value: "90" } });
    expect(onChange).toHaveBeenCalledWith({ min: 20, max: 90 });
  });

  it("clamps low thumb so it cannot exceed max thumb", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeControl label="Radius" min={0} max={100} step={1} value={{ min: 20, max: 80 }} onChange={onChange} />
    );
    const lowThumb = container.querySelector("[data-testid='range-thumb-low']") as HTMLInputElement;
    fireEvent.change(lowThumb, { target: { value: "90" } });
    // 90 > 80 - step(1) = 79, so clamped to 79
    expect(onChange).toHaveBeenCalledWith({ min: 79, max: 80 });
  });
});
```

---

## Task 5: Wire into ParameterPanel and update store type

### 5a. Update `src/components/studio/ParameterPanel.tsx`

Add imports:

```typescript
import { GradientControl } from "./controls/GradientControl";
import { CurveControl } from "./controls/CurveControl";
import { RangeControl } from "./controls/RangeControl";
```

Update the `Props` type and `renderControl` signature — expand the value union to match the updated `ParamValues`:

```typescript
import type { ParamSchema, ParamValues, ParamDef, GradientStop } from "@/lib/types";

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
```

Add cases inside `renderControl`'s switch, after the `"xy"` case:

```typescript
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
```

### 5b. Update the Zustand store

The store's `setParamValue` parameter type must be widened wherever it is declared. Locate the store file (likely `src/lib/store.ts` or `src/store/`) and update the value type in:

- The state interface `setParamValue` signature
- The action implementation

From:
```typescript
setParamValue: (key: string, value: number | string | boolean | { x: number; y: number }) => void;
```

To (import `ParamValues` value type or inline the full union):
```typescript
import type { GradientStop } from "@/lib/types";

setParamValue: (
  key: string,
  value:
    | number
    | string
    | boolean
    | { x: number; y: number }
    | GradientStop[]
    | { x1: number; y1: number; x2: number; y2: number }
    | { min: number; max: number }
) => void;
```

Alternatively, export a `ParamValue` (singular) type from `types.ts`:

```typescript
export type ParamValue = ParamValues[string];
```

Then use `ParamValue` everywhere instead of repeating the union. This is the preferred approach — do it in Task 1 and reference it in Task 5.

### 5c. Update ParameterPanel tests

Add a test for each new param type in `src/__tests__/components/ParameterPanel.test.tsx`:

```typescript
it("renders a gradient control for gradient params", () => {
  const schema: ParamSchema = {
    bg: {
      type: "gradient",
      maxStops: 5,
      default: [{ color: "#000", position: 0 }, { color: "#fff", position: 1 }],
      label: "Background",
    },
  };
  render(
    <ParameterPanel
      schema={schema}
      values={{ bg: [{ color: "#000", position: 0 }, { color: "#fff", position: 1 }] }}
      onChange={vi.fn()}
    />
  );
  expect(screen.getByText("Background")).toBeInTheDocument();
  expect(screen.getByTestId("gradient-bar")).toBeInTheDocument();
});

it("renders a curve control for curve params", () => {
  const schema: ParamSchema = {
    ease: { type: "curve", default: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 }, label: "Easing" },
  };
  render(
    <ParameterPanel
      schema={schema}
      values={{ ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 } }}
      onChange={vi.fn()}
    />
  );
  expect(screen.getByText("Easing")).toBeInTheDocument();
  expect(screen.getByTestId("curve-editor")).toBeInTheDocument();
});

it("renders a range control for range params", () => {
  const schema: ParamSchema = {
    radius: { type: "range", min: 0, max: 100, default: { min: 20, max: 80 }, label: "Radius" },
  };
  render(
    <ParameterPanel
      schema={schema}
      values={{ radius: { min: 20, max: 80 } }}
      onChange={vi.fn()}
    />
  );
  expect(screen.getByText("Radius")).toBeInTheDocument();
  expect(screen.getByTestId("range-track")).toBeInTheDocument();
});
```

---

## Task 6: Final Verification

Run the full test suite and build to confirm no regressions:

```bash
pnpm test
pnpm build
```

### Checklist

- [ ] `src/lib/types.ts` — `GradientParam`, `CurveParam`, `RangeParam` defined; `GradientStop` exported; `ParamValue` (singular) helper type exported; `ParamDef` union updated; `ParamValues` updated; `validateParamSchema` handles all three new cases
- [ ] `src/components/studio/controls/GradientControl.tsx` — renders bar, draggable stop handles, inline color picker; `data-testid="gradient-bar"`, `data-testid="gradient-handle-{i}"`, `data-testid="gradient-color-picker"`
- [ ] `src/__tests__/components/GradientControl.test.tsx` — 6 tests passing
- [ ] `src/components/studio/controls/CurveControl.tsx` — renders SVG editor, two control point handles; `data-testid="curve-editor"`, `data-testid="curve-handle-1"`, `data-testid="curve-handle-2"`
- [ ] `src/__tests__/components/CurveControl.test.tsx` — 4 tests passing
- [ ] `src/components/studio/controls/RangeControl.tsx` — dual-thumb track, filled segment, clamping; `data-testid="range-track"`, `data-testid="range-thumb-low"`, `data-testid="range-thumb-high"`
- [ ] `src/__tests__/components/RangeControl.test.tsx` — 5 tests passing
- [ ] `src/components/studio/ParameterPanel.tsx` — imports three new controls; new cases in `renderControl`; value union widened
- [ ] `src/__tests__/components/ParameterPanel.test.tsx` — 3 new tests passing
- [ ] Store `setParamValue` type updated to accept all new value shapes
- [ ] `pnpm test` — all suites pass, no TypeScript errors
- [ ] `pnpm build` — clean build, no type errors
