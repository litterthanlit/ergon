# Composition Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a layer composition system to the studio — multiple sketches stacked with blend modes, opacity, and per-layer parameter panels, enabling the "building blocks" creative model.

**Architecture:** Each layer is an independent sandbox iframe running its own p5.js sketch. The Canvas component manages a stack of iframes composited via CSS `mix-blend-mode` and `opacity`. The store tracks an ordered array of layers, each with its own code, params, schema, and blend settings. The UI shows a layer panel in the sidebar with drag-to-reorder, visibility toggles, and blend mode selectors. Parameter controls switch to show the selected layer's params.

**Tech Stack:** Existing Next.js/Tailwind/Zustand stack. No new dependencies. CSS `mix-blend-mode` for compositing (no canvas merging needed).

---

## File Structure

```
src/
├── components/
│   └── studio/
│       ├── Studio.tsx              # MODIFY — integrate layer-aware sidebar
│       ├── Canvas.tsx              # MODIFY — render multiple iframe layers
│       ├── Toolbar.tsx             # MODIFY — add "Add Layer" button
│       ├── LayerPanel.tsx          # CREATE — layer list with controls
│       └── LayerItem.tsx           # CREATE — single layer row
├── lib/
│   ├── store.ts                   # MODIFY — add layers state
│   ├── layers.ts                  # CREATE — layer types and utilities
│   └── bridge.ts                  # (unchanged)
└── __tests__/
    └── lib/
        └── layers.test.ts         # CREATE
```

---

### Task 1: Layer Types and Utilities

**Files:**
- Create: `src/lib/layers.ts`
- Test: `src/__tests__/lib/layers.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/__tests__/lib/layers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  createLayer,
  type Layer,
  type BlendMode,
  BLEND_MODES,
} from "@/lib/layers";

describe("layers", () => {
  it("createLayer returns a layer with defaults", () => {
    const layer = createLayer("drift", "Drift", "const params = ergon.params({});");
    expect(layer.id).toBeTruthy();
    expect(layer.templateId).toBe("drift");
    expect(layer.name).toBe("Drift");
    expect(layer.visible).toBe(true);
    expect(layer.opacity).toBe(1);
    expect(layer.blendMode).toBe("normal");
    expect(layer.code).toContain("ergon.params");
  });

  it("createLayer generates unique ids", () => {
    const a = createLayer("drift", "Drift", "code");
    const b = createLayer("grid", "Grid", "code");
    expect(a.id).not.toBe(b.id);
  });

  it("BLEND_MODES contains expected modes", () => {
    expect(BLEND_MODES).toContain("normal");
    expect(BLEND_MODES).toContain("multiply");
    expect(BLEND_MODES).toContain("screen");
    expect(BLEND_MODES).toContain("overlay");
    expect(BLEND_MODES).toContain("difference");
    expect(BLEND_MODES.length).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/lib/layers.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement layers module**

Create `src/lib/layers.ts`:

```typescript
import type { ParamSchema, ParamValues } from "./types";

export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "luminosity",
] as const;

export type BlendMode = (typeof BLEND_MODES)[number];

export type Layer = {
  id: string;
  templateId: string;
  name: string;
  code: string;
  schema: ParamSchema | null;
  values: ParamValues;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
};

let nextId = 1;

export function createLayer(
  templateId: string,
  name: string,
  code: string,
  schema: ParamSchema | null = null,
  values: ParamValues = {}
): Layer {
  return {
    id: `layer-${nextId++}-${Date.now()}`,
    templateId,
    name,
    code,
    schema,
    values,
    visible: true,
    opacity: 1,
    blendMode: "normal",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/lib/layers.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/layers.ts src/__tests__/lib/layers.test.ts
git commit -m "feat: add layer types, blend modes, and createLayer utility"
```

---

### Task 2: Update Store with Layer State

**Files:**
- Modify: `src/lib/store.ts`

Add layer management to the store. The store tracks an array of layers, the active layer index, and a `compositionMode` boolean that toggles between single-template mode and multi-layer mode.

- [ ] **Step 1: Add imports**

Add at top of `src/lib/store.ts`:

```typescript
import { createLayer, type Layer, type BlendMode } from "./layers";
```

- [ ] **Step 2: Add layer state to StudioState type**

Add to the type:

```typescript
  // Layers / Composition
  compositionMode: boolean;
  layers: Layer[];
  activeLayerIndex: number;
  toggleCompositionMode: () => void;
  addLayer: (templateId: string, name: string, code: string, schema: ParamSchema | null, values: ParamValues) => void;
  removeLayer: (layerId: string) => void;
  setActiveLayer: (index: number) => void;
  updateLayerVisibility: (layerId: string, visible: boolean) => void;
  updateLayerOpacity: (layerId: string, opacity: number) => void;
  updateLayerBlendMode: (layerId: string, blendMode: BlendMode) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  updateLayerParams: (layerId: string, key: string, value: number | string | boolean | { x: number; y: number }) => void;
  updateLayerCode: (layerId: string, code: string) => void;
```

- [ ] **Step 3: Add initial state**

```typescript
  compositionMode: false,
  layers: [],
  activeLayerIndex: 0,
```

- [ ] **Step 4: Add actions**

```typescript
  toggleCompositionMode: () =>
    set((state) => {
      if (!state.compositionMode) {
        // Entering composition mode — create initial layer from current template
        const initialLayer = createLayer(
          state.template.id,
          state.template.name,
          state.code,
          state.schema,
          state.values
        );
        return { compositionMode: true, layers: [initialLayer], activeLayerIndex: 0 };
      }
      return { compositionMode: false };
    }),

  addLayer: (templateId, name, code, schema, values) =>
    set((state) => ({
      layers: [...state.layers, createLayer(templateId, name, code, schema, values)],
      activeLayerIndex: state.layers.length,
    })),

  removeLayer: (layerId) =>
    set((state) => {
      const layers = state.layers.filter((l) => l.id !== layerId);
      const activeLayerIndex = Math.min(state.activeLayerIndex, Math.max(0, layers.length - 1));
      return { layers, activeLayerIndex };
    }),

  setActiveLayer: (index) => set({ activeLayerIndex: index }),

  updateLayerVisibility: (layerId, visible) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, visible } : l
      ),
    })),

  updateLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l
      ),
    })),

  updateLayerBlendMode: (layerId, blendMode) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, blendMode } : l
      ),
    })),

  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      const layers = [...state.layers];
      const [moved] = layers.splice(fromIndex, 1);
      layers.splice(toIndex, 0, moved);
      return { layers, activeLayerIndex: toIndex };
    }),

  updateLayerParams: (layerId, key, value) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, values: { ...l.values, [key]: value } } : l
      ),
    })),

  updateLayerCode: (layerId, code) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, code } : l
      ),
    })),
```

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/store.ts
git commit -m "feat: add composition layer state to store"
```

---

### Task 3: LayerItem Component

**Files:**
- Create: `src/components/studio/LayerItem.tsx`
- Test: `src/__tests__/components/LayerItem.test.tsx`

A single row in the layer panel showing name, visibility toggle, opacity slider, and blend mode selector.

- [ ] **Step 1: Write failing test**

Create `src/__tests__/components/LayerItem.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LayerItem } from "@/components/studio/LayerItem";

describe("LayerItem", () => {
  const defaultProps = {
    name: "Drift",
    visible: true,
    opacity: 0.8,
    blendMode: "normal" as const,
    isActive: false,
    onSelect: vi.fn(),
    onToggleVisibility: vi.fn(),
    onOpacityChange: vi.fn(),
    onBlendModeChange: vi.fn(),
    onRemove: vi.fn(),
  };

  it("renders layer name", () => {
    render(<LayerItem {...defaultProps} />);
    expect(screen.getByText("Drift")).toBeInTheDocument();
  });

  it("shows active state", () => {
    const { container } = render(<LayerItem {...defaultProps} isActive={true} />);
    expect(container.querySelector("[data-testid='layer-item']")?.className).toContain("border-ergon-text");
  });

  it("shows opacity value", () => {
    render(<LayerItem {...defaultProps} opacity={0.5} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement LayerItem**

Create `src/components/studio/LayerItem.tsx`:

```tsx
"use client";

import type { BlendMode } from "@/lib/layers";
import { BLEND_MODES } from "@/lib/layers";

type Props = {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  isActive: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onOpacityChange: (opacity: number) => void;
  onBlendModeChange: (mode: BlendMode) => void;
  onRemove: () => void;
};

export function LayerItem({
  name,
  visible,
  opacity,
  blendMode,
  isActive,
  onSelect,
  onToggleVisibility,
  onOpacityChange,
  onBlendModeChange,
  onRemove,
}: Props) {
  return (
    <div
      data-testid="layer-item"
      onClick={onSelect}
      className={`px-3 py-2.5 border rounded cursor-pointer transition-colors ${
        isActive
          ? "border-ergon-text bg-ergon-surface"
          : "border-ergon-border hover:border-ergon-muted"
      } ${!visible ? "opacity-40" : ""}`}
    >
      {/* Top row: name + visibility + remove */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-ergon-text truncate">
          {name}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className="p-0.5 text-ergon-muted hover:text-ergon-text transition-colors"
            title={visible ? "Hide" : "Show"}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              {visible ? (
                <><circle cx="6" cy="6" r="2" /><path d="M1 6s2-3.5 5-3.5S11 6 11 6s-2 3.5-5 3.5S1 6 1 6z" /></>
              ) : (
                <><path d="M1 1l10 10" /><path d="M4.5 4.5a2 2 0 0 0 3 3" /><path d="M1 6s2-3.5 5-3.5c1 0 1.8.3 2.5.7" /></>
              )}
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-0.5 text-ergon-muted hover:text-ergon-red transition-colors"
            title="Remove"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Opacity + blend mode */}
      {isActive && (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-[9px] font-mono text-ergon-muted w-7 text-right">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      )}

      {isActive && (
        <div className="mt-2">
          <select
            value={blendMode}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onBlendModeChange(e.target.value as BlendMode)}
            className="w-full text-[10px] text-ergon-subtle bg-white border border-ergon-border rounded px-2 py-1 focus:outline-none focus:border-ergon-text"
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/studio/LayerItem.tsx src/__tests__/components/LayerItem.test.tsx
git commit -m "feat: add LayerItem component with visibility, opacity, blend mode"
```

---

### Task 4: LayerPanel Component

**Files:**
- Create: `src/components/studio/LayerPanel.tsx`

The layer panel shows in the sidebar when composition mode is active. Lists all layers with add/remove controls.

- [ ] **Step 1: Create LayerPanel**

Create `src/components/studio/LayerPanel.tsx`:

```tsx
"use client";

import { useStudioStore } from "@/lib/store";
import { templates, getTemplate } from "@/lib/templates/registry";
import { getDefaultValues } from "@/lib/types";
import { LayerItem } from "./LayerItem";
import type { BlendMode } from "@/lib/layers";

export function LayerPanel() {
  const layers = useStudioStore((s) => s.layers);
  const activeLayerIndex = useStudioStore((s) => s.activeLayerIndex);
  const addLayer = useStudioStore((s) => s.addLayer);
  const removeLayer = useStudioStore((s) => s.removeLayer);
  const setActiveLayer = useStudioStore((s) => s.setActiveLayer);
  const updateLayerVisibility = useStudioStore((s) => s.updateLayerVisibility);
  const updateLayerOpacity = useStudioStore((s) => s.updateLayerOpacity);
  const updateLayerBlendMode = useStudioStore((s) => s.updateLayerBlendMode);

  const handleAddLayer = () => {
    // Cycle through templates for variety
    const templateIndex = layers.length % templates.length;
    const t = templates[templateIndex];
    addLayer(t.id, t.name, t.code, t.schema, getDefaultValues(t.schema));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-ergon-subtle uppercase tracking-[0.14em]">
          Layers
        </span>
        <button
          onClick={handleAddLayer}
          className="text-[10px] font-medium text-ergon-muted hover:text-ergon-text transition-colors uppercase tracking-[0.1em]"
        >
          + Add
        </button>
      </div>

      {/* Layer list — bottom layer first visually (reversed) */}
      <div className="flex flex-col gap-1.5">
        {[...layers].reverse().map((layer, reversedIndex) => {
          const actualIndex = layers.length - 1 - reversedIndex;
          return (
            <LayerItem
              key={layer.id}
              name={layer.name}
              visible={layer.visible}
              opacity={layer.opacity}
              blendMode={layer.blendMode}
              isActive={actualIndex === activeLayerIndex}
              onSelect={() => setActiveLayer(actualIndex)}
              onToggleVisibility={() => updateLayerVisibility(layer.id, !layer.visible)}
              onOpacityChange={(opacity) => updateLayerOpacity(layer.id, opacity)}
              onBlendModeChange={(mode: BlendMode) => updateLayerBlendMode(layer.id, mode)}
              onRemove={() => {
                if (layers.length > 1) removeLayer(layer.id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/LayerPanel.tsx
git commit -m "feat: add LayerPanel component with add/remove/reorder"
```

---

### Task 5: Multi-Layer Canvas

**Files:**
- Modify: `src/components/studio/Canvas.tsx`

When `compositionMode` is true, render one iframe per layer with CSS `mix-blend-mode` and `opacity`. Each iframe runs independently.

- [ ] **Step 1: Update Canvas.tsx**

Read the current `src/components/studio/Canvas.tsx` first. The key change: when `compositionMode` is true, render a stack of iframes (one per visible layer). When false, render the single iframe as before.

Add store subscriptions:

```typescript
  const compositionMode = useStudioStore((s) => s.compositionMode);
  const layers = useStudioStore((s) => s.layers);
```

Add refs for multiple bridges:

```typescript
  const layerIframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());
  const layerBridgeRefs = useRef<Map<string, Bridge>>(new Map());
```

Add a `useEffect` that sets up bridges for each layer and loads their code:

```typescript
  useEffect(() => {
    if (!compositionMode) return;

    layers.forEach((layer) => {
      const iframe = layerIframeRefs.current.get(layer.id);
      if (!iframe) return;

      // Only set up bridge if not already set up
      if (layerBridgeRefs.current.has(layer.id)) {
        // Just update params
        layerBridgeRefs.current.get(layer.id)?.updateParams(layer.values);
        return;
      }
    });
  }, [compositionMode, layers]);
```

Add an `onLoad` handler for layer iframes:

```typescript
  const handleLayerIframeLoad = useCallback((layerId: string, iframe: HTMLIFrameElement) => {
    // Clean up old bridge
    layerBridgeRefs.current.get(layerId)?.destroy();

    const layer = useStudioStore.getState().layers.find((l) => l.id === layerId);
    if (!layer) return;

    const bridge = createBridge({
      iframe,
      onSchema: () => {},
      onReady: () => {},
      onError: () => {},
    });

    layerBridgeRefs.current.set(layerId, bridge);

    setTimeout(() => {
      bridge.load(layer.code, layer.values);
    }, 100);
  }, []);
```

Update the return to conditionally render:

```tsx
  if (compositionMode) {
    return (
      <div className="w-full h-full relative bg-ergon-surface">
        {layers.map((layer) => (
          <iframe
            key={layer.id}
            ref={(el) => {
              if (el) layerIframeRefs.current.set(layer.id, el);
            }}
            title={`Layer: ${layer.name}`}
            src="/sandbox/index.html"
            sandbox="allow-scripts"
            onLoad={(e) => handleLayerIframeLoad(layer.id, e.currentTarget)}
            className="absolute inset-0 w-full h-full border-0"
            style={{
              background: "transparent",
              opacity: layer.visible ? layer.opacity : 0,
              mixBlendMode: layer.blendMode,
              pointerEvents: "none",
              zIndex: layers.indexOf(layer),
            }}
          />
        ))}
      </div>
    );
  }

  // Original single-canvas return...
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/Canvas.tsx
git commit -m "feat: Canvas renders multi-layer iframes with blend modes in composition mode"
```

---

### Task 6: Integrate Composition into Studio

**Files:**
- Modify: `src/components/studio/Studio.tsx`
- Modify: `src/components/studio/Toolbar.tsx`

Add a "Layers" toggle to the toolbar. When composition mode is active, the sidebar shows the LayerPanel above the ParameterPanel (which shows the active layer's params).

- [ ] **Step 1: Update Toolbar**

Add store subscriptions:

```typescript
  const compositionMode = useStudioStore((s) => s.compositionMode);
  const toggleCompositionMode = useStudioStore((s) => s.toggleCompositionMode);
```

Add a "Layers" toggle button after the Code button:

```tsx
        <button
          onClick={toggleCompositionMode}
          className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] rounded transition-colors ${
            compositionMode
              ? "bg-ergon-text text-white"
              : "text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface"
          }`}
        >
          Layers
        </button>
```

- [ ] **Step 2: Update Studio sidebar**

Add imports:

```typescript
import { LayerPanel } from "./LayerPanel";
```

Add store subscriptions:

```typescript
  const compositionMode = useStudioStore((s) => s.compositionMode);
  const layers = useStudioStore((s) => s.layers);
  const activeLayerIndex = useStudioStore((s) => s.activeLayerIndex);
  const updateLayerParams = useStudioStore((s) => s.updateLayerParams);
```

In the sidebar section, when `compositionMode` is true, show the LayerPanel + active layer's params:

```tsx
        {!isFullscreen && (
          <div className="w-72 bg-white border-l border-ergon-border flex flex-col shrink-0 animate-fade-in">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-ergon-border">
              <h2 className="text-[11px] font-bold text-ergon-text uppercase tracking-[0.18em]">
                {compositionMode
                  ? `Layer: ${layers[activeLayerIndex]?.name ?? "—"}`
                  : template.name}
              </h2>
              <p className="text-[10px] text-ergon-muted mt-1.5 leading-relaxed">
                {compositionMode
                  ? `${layers.length} layer${layers.length !== 1 ? "s" : ""}`
                  : template.description}
              </p>
            </div>

            {/* Composition: Layer panel */}
            {compositionMode && (
              <div className="px-5 py-4 border-b border-ergon-border">
                <LayerPanel />
              </div>
            )}

            {/* Controls — show active layer's params in composition mode */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {compositionMode ? (
                <ParameterPanel
                  schema={layers[activeLayerIndex]?.schema ?? null}
                  values={layers[activeLayerIndex]?.values ?? {}}
                  onChange={(key, value) => {
                    const layer = layers[activeLayerIndex];
                    if (layer) updateLayerParams(layer.id, key, value);
                  }}
                />
              ) : (
                <ParameterPanel
                  schema={schema}
                  values={values}
                  onChange={setParamValue}
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-ergon-border">
              ...existing footer code...
            </div>
          </div>
        )}
```

- [ ] **Step 3: Run all tests and build**

```bash
npx vitest run && npm run build
```

Expected: All pass, clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/studio/Studio.tsx src/components/studio/Toolbar.tsx
git commit -m "feat: integrate composition mode into Studio with layer panel and toolbar toggle"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

- [ ] **Step 2: Build**

```bash
npm run build:runtime && npm run build
```

- [ ] **Step 3: Manual verification**

Run `npm run dev` and verify:
- [ ] "Layers" button in toolbar toggles composition mode
- [ ] Entering composition mode creates one layer from current template
- [ ] "Add" button adds new layers
- [ ] Layer visibility toggle hides/shows layers
- [ ] Opacity slider changes layer transparency
- [ ] Blend mode dropdown changes compositing
- [ ] Clicking a layer selects it, showing its params in the panel
- [ ] Removing a layer works (can't remove last one)
- [ ] Exiting composition mode returns to single-template mode
