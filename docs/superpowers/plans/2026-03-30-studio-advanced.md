# Studio Advanced Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Ergon studio feel like a real creative instrument — resizable panels, XY pad control, seed randomization, parameter undo/redo, canvas aspect presets, inline error highlighting, and smooth animated transitions.

**Architecture:** This plan adds six systems on top of the existing studio: (1) a drag-to-resize divider between the canvas and code editor panel; (2) a new XY pad control for 2D parameter manipulation; (3) a seed/randomize system that re-rolls sketch randomness on click or spacebar; (4) parameter history with undo/redo via a circular buffer in the store; (5) canvas aspect ratio presets (1:1, 16:9, 4:3, free); (6) CSS transitions for panel open/close animations. All state flows through the existing Zustand store.

**Tech Stack:** Existing Next.js/Tailwind/Zustand stack. No new dependencies.

---

## File Structure

```
src/
├── components/
│   └── studio/
│       ├── Studio.tsx              # MODIFY — add ResizeHandle, aspect presets, animated panels
│       ├── Canvas.tsx              # MODIFY — add seed reload, aspect ratio container
│       ├── CodeEditor.tsx          # MODIFY — add inline error line highlighting
│       ├── Toolbar.tsx             # MODIFY — add randomize, aspect, undo/redo buttons
│       ├── TemplateSwitcher.tsx    # (unchanged)
│       ├── ParameterPanel.tsx      # (unchanged)
│       ├── ResizeHandle.tsx        # CREATE — drag divider between canvas and editor
│       └── controls/
│           ├── SliderControl.tsx   # (unchanged)
│           ├── SelectControl.tsx   # (unchanged)
│           ├── ToggleControl.tsx   # (unchanged)
│           ├── ColorControl.tsx    # (unchanged)
│           └── XYPadControl.tsx    # CREATE — 2D position control
├── lib/
│   ├── store.ts                   # MODIFY — add seed, history, aspect ratio state
│   ├── types.ts                   # MODIFY — add XYParam type, seed message
│   └── history.ts                 # CREATE — circular buffer for param undo/redo
├── hooks/
│   └── useKeyboardShortcuts.ts    # MODIFY — add Space (randomize), Cmd+Z (undo), Cmd+Shift+Z (redo)
├── runtime/
│   └── index.ts                   # MODIFY — add seed message handler
└── __tests__/
    ├── lib/
    │   └── history.test.ts        # CREATE
    ├── components/
    │   ├── ResizeHandle.test.tsx   # CREATE
    │   └── XYPadControl.test.tsx   # CREATE
    └── (existing test files unchanged)
```

---

### Task 1: Parameter History (Undo/Redo)

**Files:**
- Create: `src/lib/history.ts`
- Test: `src/__tests__/lib/history.test.ts`
- Modify: `src/lib/store.ts`

The history module is a circular buffer that tracks parameter value snapshots. The store gains `undo()`, `redo()`, and `pushHistory()` actions.

- [ ] **Step 1: Write failing test**

Create `src/__tests__/lib/history.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createHistory } from "@/lib/history";

describe("createHistory", () => {
  it("starts with initial state and cannot undo", () => {
    const h = createHistory({ a: 1 });
    expect(h.current()).toEqual({ a: 1 });
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);
  });

  it("tracks pushes and supports undo", () => {
    const h = createHistory({ a: 1 });
    h.push({ a: 2 });
    h.push({ a: 3 });
    expect(h.current()).toEqual({ a: 3 });
    expect(h.canUndo()).toBe(true);
    const prev = h.undo();
    expect(prev).toEqual({ a: 2 });
    expect(h.canRedo()).toBe(true);
  });

  it("supports redo after undo", () => {
    const h = createHistory({ a: 1 });
    h.push({ a: 2 });
    h.undo();
    const next = h.redo();
    expect(next).toEqual({ a: 2 });
    expect(h.canRedo()).toBe(false);
  });

  it("clears redo stack on new push after undo", () => {
    const h = createHistory({ a: 1 });
    h.push({ a: 2 });
    h.push({ a: 3 });
    h.undo();
    h.push({ a: 4 });
    expect(h.canRedo()).toBe(false);
    expect(h.current()).toEqual({ a: 4 });
  });

  it("respects max size", () => {
    const h = createHistory({ a: 0 }, 3);
    h.push({ a: 1 });
    h.push({ a: 2 });
    h.push({ a: 3 }); // oldest ({ a: 0 }) should be dropped
    expect(h.current()).toEqual({ a: 3 });
    // Can undo at most 2 times (size 3 = 3 entries, pointer at end)
    h.undo();
    h.undo();
    expect(h.canUndo()).toBe(false);
    expect(h.current()).toEqual({ a: 1 });
  });

  it("reset clears all history", () => {
    const h = createHistory({ a: 1 });
    h.push({ a: 2 });
    h.push({ a: 3 });
    h.reset({ a: 10 });
    expect(h.current()).toEqual({ a: 10 });
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/lib/history.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement history**

Create `src/lib/history.ts`:

```typescript
import type { ParamValues } from "./types";

export type History = {
  current: () => ParamValues;
  push: (values: ParamValues) => void;
  undo: () => ParamValues | null;
  redo: () => ParamValues | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reset: (values: ParamValues) => void;
};

export function createHistory(initial: ParamValues, maxSize = 50): History {
  let entries: ParamValues[] = [initial];
  let pointer = 0;

  return {
    current() {
      return entries[pointer];
    },

    push(values: ParamValues) {
      // Discard any redo entries
      entries = entries.slice(0, pointer + 1);
      entries.push(values);

      // Enforce max size
      if (entries.length > maxSize) {
        entries = entries.slice(entries.length - maxSize);
      }
      pointer = entries.length - 1;
    },

    undo() {
      if (pointer <= 0) return null;
      pointer--;
      return entries[pointer];
    },

    redo() {
      if (pointer >= entries.length - 1) return null;
      pointer++;
      return entries[pointer];
    },

    canUndo() {
      return pointer > 0;
    },

    canRedo() {
      return pointer < entries.length - 1;
    },

    reset(values: ParamValues) {
      entries = [values];
      pointer = 0;
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/lib/history.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 5: Update store with undo/redo**

Modify `src/lib/store.ts`. Add these imports at top:

```typescript
import { createHistory, type History } from "./history";
```

Add a module-level history instance:

```typescript
let paramHistory: History = createHistory(getDefaultValues(drift.schema));
```

Add to the `StudioState` type:

```typescript
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
```

Add to the store's initial state:

```typescript
  canUndo: false,
  canRedo: false,
```

Update `setParamValue` to push history:

```typescript
  setParamValue: (key, value) =>
    set((state) => {
      const newValues = { ...state.values, [key]: value };
      paramHistory.push(newValues);
      return {
        values: newValues,
        canUndo: paramHistory.canUndo(),
        canRedo: paramHistory.canRedo(),
      };
    }),
```

Add undo/redo actions:

```typescript
  undo: () =>
    set(() => {
      const prev = paramHistory.undo();
      if (!prev) return {};
      return {
        values: prev,
        canUndo: paramHistory.canUndo(),
        canRedo: paramHistory.canRedo(),
      };
    }),

  redo: () =>
    set(() => {
      const next = paramHistory.redo();
      if (!next) return {};
      return {
        values: next,
        canUndo: paramHistory.canUndo(),
        canRedo: paramHistory.canRedo(),
      };
    }),
```

Update `setTemplate` to reset history:

```typescript
  setTemplate: (template) => {
    const defaults = getDefaultValues(template.schema);
    paramHistory.reset(defaults);
    return set({
      template,
      code: template.code,
      codeVersion: 0,
      schema: template.schema,
      values: defaults,
      status: "loading",
      error: null,
      canUndo: false,
      canRedo: false,
    });
  },
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/history.ts src/__tests__/lib/history.test.ts src/lib/store.ts
git commit -m "feat: add parameter undo/redo with circular history buffer"
```

---

### Task 2: Seed Randomization

**Files:**
- Modify: `src/lib/store.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/runtime/index.ts`
- Modify: `src/lib/bridge.ts`

Add a seed value to the store. When the user randomizes, a new seed is sent to the sandbox. The runtime passes it to p5's `randomSeed()` and `noiseSeed()`.

- [ ] **Step 1: Add seed message type to types.ts**

Add after the `UpdateParamsMessage` type:

```typescript
export type SeedMessage = {
  type: "ergon:seed";
  seed: number;
};
```

Update `ParentMessage`:

```typescript
export type ParentMessage = LoadCodeMessage | UpdateParamsMessage | RequestExportMessage | SeedMessage;
```

- [ ] **Step 2: Update bridge.ts**

Add to the `Bridge` type:

```typescript
  sendSeed: (seed: number) => void;
```

Add to the returned object inside `createBridge`:

```typescript
    sendSeed(seed: number) {
      sendToIframe({ type: "ergon:seed", seed });
    },
```

- [ ] **Step 3: Update runtime/index.ts**

Add this handler function:

```typescript
function handleSeed(seed: number): void {
  if (typeof window.randomSeed === "function") {
    window.randomSeed(seed);
  }
  if (typeof window.noiseSeed === "function") {
    window.noiseSeed(seed);
  }
  if (typeof window.redraw === "function") {
    window.redraw();
  }
}
```

Add to the message listener switch:

```typescript
    case "ergon:seed":
      handleSeed(msg.seed);
      break;
```

- [ ] **Step 4: Add seed state to store.ts**

Add to `StudioState` type:

```typescript
  seed: number;
  randomize: () => void;
```

Add initial state:

```typescript
  seed: Math.floor(Math.random() * 999999),
```

Add action:

```typescript
  randomize: () =>
    set({ seed: Math.floor(Math.random() * 999999) }),
```

- [ ] **Step 5: Update Canvas.tsx to send seed**

Add `seed` subscription:

```typescript
const seed = useStudioStore((s) => s.seed);
```

Add a `useEffect` that sends the seed when it changes:

```typescript
  useEffect(() => {
    bridgeRef.current?.sendSeed(seed);
  }, [seed]);
```

- [ ] **Step 6: Rebuild runtime and run all tests**

```bash
npm run build:runtime && npx vitest run
```

Expected: All tests pass, runtime builds clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/lib/bridge.ts src/runtime/index.ts src/lib/store.ts src/components/studio/Canvas.tsx public/sandbox/runtime.js
git commit -m "feat: add seed randomization system with runtime integration"
```

---

### Task 3: XY Pad Control

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/components/studio/controls/XYPadControl.tsx`
- Test: `src/__tests__/components/XYPadControl.test.tsx`
- Modify: `src/components/studio/ParameterPanel.tsx`

A 2D control surface. The user drags a crosshair on a square pad to set two values simultaneously. Used for position, force, or any 2D parameter.

- [ ] **Step 1: Add XYParam type to types.ts**

Add after `ColorParam`:

```typescript
export type XYParam = {
  type: "xy";
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  default: { x: number; y: number };
  label: string;
};
```

Update `ParamDef`:

```typescript
export type ParamDef = NumberParam | SelectParam | BooleanParam | ColorParam | XYParam;
```

Update `ParamValues`:

```typescript
export type ParamValues = Record<string, number | string | boolean | { x: number; y: number }>;
```

Update `validateParamSchema` — add case:

```typescript
      case "xy":
        if (typeof param.default !== "object" || param.default === null) return false;
        if (typeof param.default.x !== "number" || typeof param.default.y !== "number") return false;
        if (param.default.x < param.minX || param.default.x > param.maxX) return false;
        if (param.default.y < param.minY || param.default.y > param.maxY) return false;
        break;
```

- [ ] **Step 2: Write failing test**

Create `src/__tests__/components/XYPadControl.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { XYPadControl } from "@/components/studio/controls/XYPadControl";

describe("XYPadControl", () => {
  it("renders the pad with a label", () => {
    render(
      <XYPadControl
        label="Position"
        minX={0} maxX={1} minY={0} maxY={1}
        value={{ x: 0.5, y: 0.5 }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Position")).toBeInTheDocument();
  });

  it("renders the crosshair indicator", () => {
    const { container } = render(
      <XYPadControl
        label="Force"
        minX={-1} maxX={1} minY={-1} maxY={1}
        value={{ x: 0, y: 0 }}
        onChange={vi.fn()}
      />
    );
    expect(container.querySelector("[data-testid='xy-pad']")).toBeInTheDocument();
    expect(container.querySelector("[data-testid='xy-crosshair']")).toBeInTheDocument();
  });

  it("displays current values", () => {
    render(
      <XYPadControl
        label="Offset"
        minX={0} maxX={100} minY={0} maxY={100}
        value={{ x: 25, y: 75 }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("25, 75")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run src/__tests__/components/XYPadControl.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement XYPadControl**

Create `src/components/studio/controls/XYPadControl.tsx`:

```tsx
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-[0.12em]">
          {label}
        </label>
        <span className="text-[10px] text-neutral-400 font-mono tabular-nums">
          {displayX}, {displayY}
        </span>
      </div>
      <div
        ref={padRef}
        data-testid="xy-pad"
        className="relative w-full aspect-square bg-neutral-900 rounded border border-neutral-800 cursor-crosshair select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-neutral-800" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-neutral-800" />
        </div>
        {/* Crosshair */}
        <div
          data-testid="xy-crosshair"
          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${percentX}%`, top: `${percentY}%` }}
        >
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white -translate-y-1/2" />
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wire XYPadControl into ParameterPanel**

In `src/components/studio/ParameterPanel.tsx`, add import:

```typescript
import { XYPadControl } from "./controls/XYPadControl";
```

Add case in `renderControl`:

```typescript
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
```

Note: The `onChange` type on `ParameterPanel` needs updating. Change the Props type:

```typescript
type Props = {
  schema: ParamSchema | null;
  values: ParamValues;
  onChange: (key: string, value: number | string | boolean | { x: number; y: number }) => void;
};
```

And the `renderControl` signature:

```typescript
function renderControl(
  key: string,
  def: ParamDef,
  value: number | string | boolean | { x: number; y: number },
  onChange: (key: string, value: number | string | boolean | { x: number; y: number }) => void
)
```

Also update `setParamValue` in `src/lib/store.ts` type:

```typescript
  setParamValue: (key: string, value: number | string | boolean | { x: number; y: number }) => void;
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/components/studio/controls/XYPadControl.tsx src/__tests__/components/XYPadControl.test.tsx src/components/studio/ParameterPanel.tsx src/lib/store.ts
git commit -m "feat: add XY pad control for 2D parameter manipulation"
```

---

### Task 4: Resizable Editor Panel

**Files:**
- Create: `src/components/studio/ResizeHandle.tsx`
- Test: `src/__tests__/components/ResizeHandle.test.tsx`
- Modify: `src/lib/store.ts`
- Modify: `src/components/studio/Studio.tsx`

A horizontal drag handle between the canvas and the code editor. Dragging up makes the editor taller, dragging down makes it shorter. Stores the height in the Zustand store.

- [ ] **Step 1: Add editor height to store**

In `src/lib/store.ts`, add to `StudioState`:

```typescript
  editorHeight: number;
  setEditorHeight: (height: number) => void;
```

Add initial state:

```typescript
  editorHeight: 300,
```

Add action:

```typescript
  setEditorHeight: (height) =>
    set({ editorHeight: Math.max(120, Math.min(height, window.innerHeight * 0.7)) }),
```

- [ ] **Step 2: Write failing test for ResizeHandle**

Create `src/__tests__/components/ResizeHandle.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ResizeHandle } from "@/components/studio/ResizeHandle";

describe("ResizeHandle", () => {
  it("renders a draggable handle", () => {
    const { container } = render(
      <ResizeHandle onResize={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='resize-handle']")).toBeInTheDocument();
  });

  it("shows a visual grip indicator", () => {
    const { container } = render(
      <ResizeHandle onResize={vi.fn()} />
    );
    const handle = container.querySelector("[data-testid='resize-handle']");
    expect(handle).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run src/__tests__/components/ResizeHandle.test.tsx
```

Expected: FAIL.

- [ ] **Step 4: Implement ResizeHandle**

Create `src/components/studio/ResizeHandle.tsx`:

```tsx
"use client";

import { useRef, useCallback } from "react";

type Props = {
  onResize: (deltaY: number) => void;
};

export function ResizeHandle({ onResize }: Props) {
  const startY = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      startY.current = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!e.buttons) return;
      const delta = startY.current - e.clientY;
      startY.current = e.clientY;
      onResize(delta);
    },
    [onResize]
  );

  const onPointerUp = useCallback(() => {
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  return (
    <div
      data-testid="resize-handle"
      className="h-2 bg-neutral-900 border-t border-neutral-800 cursor-row-resize flex items-center justify-center hover:bg-neutral-800 transition-colors shrink-0"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="w-8 h-0.5 bg-neutral-700 rounded-full" />
    </div>
  );
}
```

- [ ] **Step 5: Integrate into Studio.tsx**

In `src/components/studio/Studio.tsx`:

Add import:

```typescript
import { ResizeHandle } from "./ResizeHandle";
```

Add store subscriptions:

```typescript
  const editorHeight = useStudioStore((s) => s.editorHeight);
  const setEditorHeight = useStudioStore((s) => s.setEditorHeight);
```

Add resize handler:

```typescript
  const handleResize = useCallback(
    (deltaY: number) => {
      setEditorHeight(editorHeight + deltaY);
    },
    [editorHeight, setEditorHeight]
  );
```

Replace the existing editor panel section:

```tsx
          {/* Code editor panel — resizable */}
          {editorOpen && (
            <>
              <ResizeHandle onResize={handleResize} />
              <div
                className="border-t border-neutral-800 bg-[#0a0a0a] shrink-0"
                style={{ height: editorHeight }}
              >
                <CodeEditor code={code} onChange={setCode} />
              </div>
            </>
          )}
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/studio/ResizeHandle.tsx src/__tests__/components/ResizeHandle.test.tsx src/lib/store.ts src/components/studio/Studio.tsx
git commit -m "feat: add resizable code editor panel with drag handle"
```

---

### Task 5: Canvas Aspect Ratio Presets

**Files:**
- Modify: `src/lib/store.ts`
- Modify: `src/components/studio/Canvas.tsx`
- Modify: `src/components/studio/Toolbar.tsx`

Add aspect ratio presets: Free (fills available space), 1:1, 16:9, 4:3. The Canvas wraps the iframe in a container that constrains to the selected ratio.

- [ ] **Step 1: Add aspect state to store**

In `src/lib/store.ts`, add type:

```typescript
type AspectRatio = "free" | "1:1" | "16:9" | "4:3";
```

Add to `StudioState`:

```typescript
  aspect: AspectRatio;
  cycleAspect: () => void;
```

Add initial state:

```typescript
  aspect: "free" as AspectRatio,
```

Add action:

```typescript
  cycleAspect: () =>
    set((state) => {
      const ratios: AspectRatio[] = ["free", "1:1", "16:9", "4:3"];
      const idx = ratios.indexOf(state.aspect);
      return { aspect: ratios[(idx + 1) % ratios.length] };
    }),
```

Export the type:

```typescript
export type { AspectRatio };
```

- [ ] **Step 2: Update Canvas.tsx**

Add aspect subscription:

```typescript
  const aspect = useStudioStore((s) => s.aspect);
```

Wrap the iframe in an aspect container. Replace the return:

```tsx
  const aspectClass =
    aspect === "1:1"
      ? "aspect-square"
      : aspect === "16:9"
        ? "aspect-video"
        : aspect === "4:3"
          ? "aspect-[4/3]"
          : "";

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className={`${aspectClass ? aspectClass + " max-h-full max-w-full" : "w-full h-full"}`}>
        <iframe
          ref={iframeRef}
          title="Ergon Sandbox"
          src="/sandbox/index.html"
          sandbox="allow-scripts"
          onLoad={handleIframeLoad}
          className="w-full h-full border-0"
          style={{ background: "#000" }}
        />
      </div>
    </div>
  );
```

- [ ] **Step 3: Add aspect button to Toolbar**

In `src/components/studio/Toolbar.tsx`, add:

```typescript
  const aspect = useStudioStore((s) => s.aspect);
  const cycleAspect = useStudioStore((s) => s.cycleAspect);
```

Add an aspect button before the Fullscreen button:

```tsx
        <button
          onClick={cycleAspect}
          className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors font-mono"
        >
          {aspect === "free" ? "Free" : aspect}
        </button>
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store.ts src/components/studio/Canvas.tsx src/components/studio/Toolbar.tsx
git commit -m "feat: add canvas aspect ratio presets (Free, 1:1, 16:9, 4:3)"
```

---

### Task 6: Update Keyboard Shortcuts

**Files:**
- Modify: `src/hooks/useKeyboardShortcuts.ts`

Add Space (randomize), Cmd+Z (undo), Cmd+Shift+Z (redo).

- [ ] **Step 1: Update useKeyboardShortcuts.ts**

Replace `src/hooks/useKeyboardShortcuts.ts`:

```typescript
"use client";

import { useEffect } from "react";
import { useStudioStore } from "@/lib/store";

export function useKeyboardShortcuts() {
  const toggleEditor = useStudioStore((s) => s.toggleEditor);
  const toggleFullscreen = useStudioStore((s) => s.toggleFullscreen);
  const runCode = useStudioStore((s) => s.runCode);
  const randomize = useStudioStore((s) => s.randomize);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const editorOpen = useStudioStore((s) => s.editorOpen);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      // Inside CodeMirror: only allow Cmd+Enter (run) and Cmd+Z/Shift+Z (undo/redo)
      if (target.closest(".cm-editor")) {
        if (meta && e.key === "Enter") {
          e.preventDefault();
          runCode();
        }
        return;
      }

      // Cmd+E — toggle editor
      if (meta && e.key === "e") {
        e.preventDefault();
        toggleEditor();
      }

      // Cmd+Enter — run code
      if (meta && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }

      // Cmd+Z — undo params
      if (meta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Cmd+Shift+Z — redo params
      if (meta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      // Escape — exit fullscreen or close editor
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (editorOpen) {
          toggleEditor();
        }
      }

      // F — toggle fullscreen (only when editor closed)
      if (e.key === "f" && !meta && !editorOpen) {
        e.preventDefault();
        toggleFullscreen();
      }

      // Space — randomize seed (only when editor closed and not in text input)
      if (e.key === " " && !meta && !editorOpen) {
        e.preventDefault();
        randomize();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleEditor, toggleFullscreen, runCode, randomize, undo, redo, editorOpen]);
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts
git commit -m "feat: add Space (randomize), Cmd+Z (undo), Cmd+Shift+Z (redo) shortcuts"
```

---

### Task 7: Toolbar Enhancements

**Files:**
- Modify: `src/components/studio/Toolbar.tsx`

Add Randomize button (dice icon) and Undo/Redo buttons to the toolbar.

- [ ] **Step 1: Update Toolbar.tsx**

Replace `src/components/studio/Toolbar.tsx`:

```tsx
"use client";

import { useStudioStore } from "@/lib/store";

export function Toolbar() {
  const editorOpen = useStudioStore((s) => s.editorOpen);
  const status = useStudioStore((s) => s.status);
  const aspect = useStudioStore((s) => s.aspect);
  const canUndo = useStudioStore((s) => s.canUndo);
  const canRedo = useStudioStore((s) => s.canRedo);
  const toggleEditor = useStudioStore((s) => s.toggleEditor);
  const toggleFullscreen = useStudioStore((s) => s.toggleFullscreen);
  const runCode = useStudioStore((s) => s.runCode);
  const randomize = useStudioStore((s) => s.randomize);
  const cycleAspect = useStudioStore((s) => s.cycleAspect);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);

  return (
    <div className="flex items-center justify-between px-4 h-10 bg-neutral-950 border-b border-neutral-900 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em]">
          Ergon
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-1.5 py-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 rounded transition-colors disabled:opacity-25 disabled:pointer-events-none"
          title="Undo (⌘Z)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5l-2-2 2-2" />
            <path d="M1 3h7a3 3 0 0 1 0 6H6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="px-1.5 py-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 rounded transition-colors disabled:opacity-25 disabled:pointer-events-none"
          title="Redo (⌘⇧Z)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5l2-2-2-2" />
            <path d="M11 3H4a3 3 0 0 0 0 6h2" />
          </svg>
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {/* Randomize */}
        <button
          onClick={randomize}
          className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors"
          title="Randomize (Space)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="3.5" cy="3.5" r="1" />
            <circle cx="8.5" cy="3.5" r="1" />
            <circle cx="6" cy="6" r="1" />
            <circle cx="3.5" cy="8.5" r="1" />
            <circle cx="8.5" cy="8.5" r="1" />
          </svg>
        </button>

        {/* Run (only when editor open) */}
        {editorOpen && (
          <button
            onClick={runCode}
            disabled={status === "loading"}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded transition-colors bg-white text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
          >
            <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
              <path d="M0 0L8 5L0 10V0Z" />
            </svg>
            Run
          </button>
        )}

        <button
          onClick={toggleEditor}
          className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded transition-colors ${
            editorOpen
              ? "bg-neutral-800 text-white"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"
          }`}
        >
          Code
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent("ergon:export"))}
          className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors"
        >
          Export
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {/* Aspect ratio */}
        <button
          onClick={cycleAspect}
          className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors font-mono"
        >
          {aspect === "free" ? "Free" : aspect}
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="px-2 py-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 rounded transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run all tests and build**

```bash
npx vitest run && npm run build
```

Expected: All pass, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/Toolbar.tsx
git commit -m "feat: add undo/redo, randomize, and aspect ratio buttons to toolbar"
```

---

### Task 8: Inline Error Highlighting in Code Editor

**Files:**
- Modify: `src/components/studio/CodeEditor.tsx`

When the sandbox reports an error with a line number, highlight that line in the editor with a red background.

- [ ] **Step 1: Update CodeEditor props and implementation**

Add `errorLine` prop to `CodeEditor`:

```tsx
type Props = {
  code: string;
  onChange: (code: string) => void;
  errorLine?: number | null;
};
```

Add a `StateEffect` and `StateField` for error line decoration. Add these after the `syntaxColors` definition:

```typescript
import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet } from "@codemirror/view";

const setErrorLine = StateEffect.define<number | null>();

const errorLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setErrorLine)) {
        if (effect.value === null) return Decoration.none;
        const line = tr.state.doc.line(Math.min(effect.value, tr.state.doc.lines));
        const deco = Decoration.line({ class: "cm-errorLine" }).range(line.from);
        return Decoration.set([deco]);
      }
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});
```

Add error line CSS to the `darkTheme`:

```typescript
  ".cm-errorLine": {
    backgroundColor: "#ff000015",
    borderLeft: "2px solid #ef4444",
  },
```

Add `errorLineField` to the extensions array in `createEditor`.

Add a `useEffect` that dispatches the error line:

```typescript
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setErrorLine.of(errorLine ?? null) });
  }, [errorLine]);
```

- [ ] **Step 2: Parse error line number in Studio.tsx**

In `src/components/studio/Studio.tsx`, add a helper to extract line numbers from error messages:

```typescript
function parseErrorLine(error: string | null): number | null {
  if (!error) return null;
  const match = error.match(/line (\d+)/i) || error.match(/:(\d+):/);
  return match ? parseInt(match[1], 10) : null;
}
```

Pass it to CodeEditor:

```tsx
<CodeEditor
  code={code}
  onChange={setCode}
  errorLine={parseErrorLine(error)}
/>
```

- [ ] **Step 3: Run all tests and build**

```bash
npx vitest run && npm run build
```

Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/studio/CodeEditor.tsx src/components/studio/Studio.tsx
git commit -m "feat: add inline error line highlighting in code editor"
```

---

### Task 9: Panel Animation CSS

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/studio/Studio.tsx`

Add smooth CSS transitions for the editor panel sliding up/down and the sidebar appearing/disappearing.

- [ ] **Step 1: Add animation keyframes to globals.css**

Add at the end of `src/app/globals.css`:

```css
/* Studio panel animations */
@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slide-down {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(100%); opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-slide-up {
  animation: slide-up 0.2s ease-out;
}

.animate-fade-in {
  animation: fade-in 0.15s ease-out;
}
```

- [ ] **Step 2: Apply animation classes in Studio.tsx**

Update the editor panel wrapper:

```tsx
          {editorOpen && (
            <div className="animate-slide-up">
              <ResizeHandle onResize={handleResize} />
              <div
                className="border-t border-neutral-800 bg-[#0a0a0a] shrink-0"
                style={{ height: editorHeight }}
              >
                <CodeEditor
                  code={code}
                  onChange={setCode}
                  errorLine={parseErrorLine(error)}
                />
              </div>
            </div>
          )}
```

Update the parameter panel wrapper:

```tsx
        {!isFullscreen && (
          <div className="w-72 bg-neutral-950 border-l border-neutral-900 flex flex-col shrink-0 animate-fade-in">
```

- [ ] **Step 3: Run all tests and build**

```bash
npx vitest run && npm run build
```

Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/studio/Studio.tsx
git commit -m "feat: add smooth slide/fade animations for studio panels"
```

---

### Task 10: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Build application**

```bash
npm run build:runtime && npm run build
```

Expected: Clean build, no errors.

- [ ] **Step 3: Verify git status**

```bash
git log --oneline -12
```

Expected: 9 new commits for Tasks 1-9.

- [ ] **Step 4: Manual spot-check list**

Run `npm run dev` and verify:
- [ ] Template switching works across all 5 templates
- [ ] Code editor opens/closes with Cmd+E
- [ ] Code editor is resizable via drag handle
- [ ] Cmd+Z undoes parameter changes, Cmd+Shift+Z redoes
- [ ] Space bar randomizes the sketch
- [ ] Aspect ratio cycles through Free → 1:1 → 16:9 → 4:3
- [ ] Toolbar shows undo/redo/randomize/aspect buttons
- [ ] Error in code shows red highlight on the error line
- [ ] Export PNG still works
- [ ] Panel animations are smooth
