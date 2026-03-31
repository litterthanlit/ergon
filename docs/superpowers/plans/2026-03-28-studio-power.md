# Studio Power Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the basic studio into an incredible creative tool with a code editor, 5 templates, template switching, resizable panels, PNG export, fullscreen mode, and keyboard shortcuts.

**Architecture:** The studio gains three major systems: (1) a CodeMirror 6 editor that pulls up from the bottom, sends code to the sandbox on change, and syncs with the store; (2) a template library with a horizontal switcher strip and 4 new templates; (3) studio UX features — resizable panel divider, PNG export via canvas.toBlob(), fullscreen toggle, and keyboard shortcuts. All state flows through the existing Zustand store.

**Tech Stack:** CodeMirror 6 (@codemirror/state, @codemirror/view, @codemirror/lang-javascript), existing Next.js/Tailwind/Zustand stack

---

## File Structure

```
src/
├── components/
│   └── studio/
│       ├── Studio.tsx              # MODIFY — add code editor panel, resizable divider, toolbar
│       ├── Canvas.tsx              # MODIFY — add reload-on-code-change, export support
│       ├── CodeEditor.tsx          # CREATE — CodeMirror 6 wrapper
│       ├── ParameterPanel.tsx      # (unchanged)
│       ├── TemplateSwitcher.tsx    # CREATE — horizontal template strip
│       ├── Toolbar.tsx             # CREATE — top bar with actions (export, fullscreen, etc.)
│       └── controls/              # (unchanged)
├── lib/
│   ├── store.ts                   # MODIFY — add code editing, editor visibility, fullscreen state
│   ├── templates/
│   │   ├── registry.ts            # MODIFY — add template list, getTemplate()
│   │   ├── drift.ts               # (unchanged)
│   │   ├── grid.ts                # CREATE — geometric grid template
│   │   ├── pulse.ts               # CREATE — oscillation template
│   │   ├── scatter.ts             # CREATE — controlled randomness template
│   │   └── weave.ts               # CREATE — recursive subdivision template
│   └── export.ts                  # CREATE — PNG export utility
├── hooks/
│   └── useKeyboardShortcuts.ts    # CREATE — keyboard shortcut handler
└── __tests__/
    ├── templates/
    │   ├── drift.test.ts          # (unchanged)
    │   ├── grid.test.ts           # CREATE
    │   ├── pulse.test.ts          # CREATE
    │   ├── scatter.test.ts        # CREATE
    │   └── weave.test.ts          # CREATE
    ├── lib/
    │   └── export.test.ts         # CREATE
    └── components/
        ├── CodeEditor.test.tsx    # CREATE
        └── TemplateSwitcher.test.tsx # CREATE
```

---

### Task 1: Install CodeMirror Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install CodeMirror packages**

```bash
cd /Users/niki_g/conductor/workspaces/ergon/providence
npm install @codemirror/state @codemirror/view @codemirror/lang-javascript @codemirror/commands @codemirror/autocomplete @codemirror/search
```

- [ ] **Step 2: Verify installation**

```bash
npm ls @codemirror/view
```

Expected: shows @codemirror/view in the tree.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install CodeMirror 6 dependencies"
```

---

### Task 2: Code Editor Component

**Files:**
- Create: `src/components/studio/CodeEditor.tsx`
- Test: `src/__tests__/components/CodeEditor.test.tsx`

The code editor is a CodeMirror 6 instance styled for the dark studio theme. It receives code as a prop and calls `onChange` when the user edits. It does NOT auto-reload the sandbox — the user triggers reload explicitly (or on debounced change).

- [ ] **Step 1: Write failing test**

Create `src/__tests__/components/CodeEditor.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CodeEditor } from "@/components/studio/CodeEditor";

describe("CodeEditor", () => {
  it("renders a container element", () => {
    const { container } = render(
      <CodeEditor code="function draw() {}" onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='code-editor']")).toBeInTheDocument();
  });

  it("accepts code prop", () => {
    const { container } = render(
      <CodeEditor code="// hello" onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='code-editor']")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/components/CodeEditor.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement CodeEditor**

Create `src/components/studio/CodeEditor.tsx`:

```tsx
"use client";

import { useRef, useEffect, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";

const darkTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    backgroundColor: "#0a0a0a",
  },
  ".cm-content": {
    fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace",
    caretColor: "#fff",
    padding: "16px 0",
  },
  ".cm-gutters": {
    backgroundColor: "#0a0a0a",
    color: "#333",
    border: "none",
    paddingLeft: "8px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "#555",
  },
  ".cm-activeLine": {
    backgroundColor: "#ffffff08",
  },
  ".cm-selectionBackground": {
    backgroundColor: "#ffffff15 !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "#ffffff20 !important",
  },
  ".cm-cursor": {
    borderLeftColor: "#fff",
  },
  ".cm-matchingBracket": {
    backgroundColor: "#ffffff15",
    outline: "1px solid #ffffff30",
  },
  ".cm-line": {
    padding: "0 16px",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
}, { dark: true });

// Minimal syntax highlighting colors
const syntaxColors = EditorView.theme({
  ".cm-keyword": { color: "#c4362c" },
  ".cm-string": { color: "#98c379" },
  ".cm-number": { color: "#d19a66" },
  ".cm-comment": { color: "#555" },
  ".cm-variableName": { color: "#e5e5e5" },
  ".cm-propertyName": { color: "#e5c07b" },
  ".cm-operator": { color: "#888" },
  ".cm-punctuation": { color: "#666" },
  ".cm-typeName": { color: "#61afef" },
  ".cm-function": { color: "#61afef" },
  ".cm-bool": { color: "#d19a66" },
}, { dark: true });

type Props = {
  code: string;
  onChange: (code: string) => void;
};

export function CodeEditor({ code, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track whether we're programmatically updating to avoid feedback loops
  const isExternalUpdate = useRef(false);

  const createEditor = useCallback(() => {
    if (!containerRef.current) return;

    // Destroy existing editor
    viewRef.current?.destroy();

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isExternalUpdate.current) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        autocompletion(),
        highlightSelectionMatches(),
        javascript(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          ...searchKeymap,
        ]),
        darkTheme,
        syntaxColors,
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });
  }, []); // intentionally empty — code is set via initial state

  // Initialize editor
  useEffect(() => {
    createEditor();
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [createEditor]);

  // Update editor content when code prop changes externally (e.g., template switch)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== code) {
      isExternalUpdate.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: code,
        },
      });
      isExternalUpdate.current = false;
    }
  }, [code]);

  return (
    <div
      ref={containerRef}
      data-testid="code-editor"
      className="h-full w-full overflow-hidden"
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/components/CodeEditor.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/studio/CodeEditor.tsx src/__tests__/components/CodeEditor.test.tsx
git commit -m "feat: add CodeMirror 6 code editor component"
```

---

### Task 3: Update Store for Code Editing & UI State

**Files:**
- Modify: `src/lib/store.ts`

Add code editing state, editor panel visibility, fullscreen mode, and code reload trigger.

- [ ] **Step 1: Update the store**

Replace `src/lib/store.ts` with:

```typescript
import { create } from "zustand";
import type { ParamSchema, ParamValues } from "./types";
import { getDefaultValues } from "./types";
import type { Template } from "./templates/registry";
import { drift } from "./templates/drift";

type SandboxStatus = "loading" | "ready" | "error";

type StudioState = {
  // Template
  template: Template;

  // Code — the live code in the editor (may differ from template.code)
  code: string;
  // Incremented to signal the sandbox should reload with current code
  codeVersion: number;

  // Parameters
  schema: ParamSchema | null;
  values: ParamValues;

  // Sandbox
  status: SandboxStatus;
  error: string | null;

  // UI
  editorOpen: boolean;
  isFullscreen: boolean;

  // Actions
  setTemplate: (template: Template) => void;
  setCode: (code: string) => void;
  runCode: () => void;
  setSchema: (schema: ParamSchema) => void;
  setParamValue: (key: string, value: number | string | boolean) => void;
  setStatus: (status: SandboxStatus) => void;
  setError: (error: string | null) => void;
  toggleEditor: () => void;
  toggleFullscreen: () => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  template: drift,
  code: drift.code,
  codeVersion: 0,
  schema: null,
  values: getDefaultValues(drift.schema),
  status: "loading",
  error: null,
  editorOpen: false,
  isFullscreen: false,

  setTemplate: (template) =>
    set({
      template,
      code: template.code,
      codeVersion: 0,
      schema: template.schema,
      values: getDefaultValues(template.schema),
      status: "loading",
      error: null,
    }),

  setCode: (code) => set({ code }),

  runCode: () =>
    set((state) => ({
      codeVersion: state.codeVersion + 1,
      status: "loading",
      error: null,
    })),

  setSchema: (schema) =>
    set((state) => ({
      schema,
      values: {
        ...getDefaultValues(schema),
        ...Object.fromEntries(
          Object.entries(state.values).filter(([key]) => key in schema)
        ),
      },
    })),

  setParamValue: (key, value) =>
    set((state) => ({
      values: { ...state.values, [key]: value },
    })),

  setStatus: (status) => set({ status }),

  setError: (error) => set({ error, status: "error" }),

  toggleEditor: () => set((state) => ({ editorOpen: !state.editorOpen })),

  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
```

- [ ] **Step 2: Run all tests to verify no regressions**

```bash
npx vitest run
```

Expected: all existing tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/store.ts
git commit -m "feat: extend store with code editing, editor panel, and fullscreen state"
```

---

### Task 4: Update Canvas for Code Reload

**Files:**
- Modify: `src/components/studio/Canvas.tsx`

The Canvas component needs to reload the sandbox when `codeVersion` changes (triggered by `runCode()`). Currently it only loads code once on iframe load.

- [ ] **Step 1: Update Canvas.tsx**

Replace `src/components/studio/Canvas.tsx` with:

```tsx
"use client";

import { useRef, useEffect, useCallback } from "react";
import { createBridge, type Bridge } from "@/lib/bridge";
import { useStudioStore } from "@/lib/store";

export function Canvas() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<Bridge | null>(null);

  const code = useStudioStore((s) => s.code);
  const values = useStudioStore((s) => s.values);
  const codeVersion = useStudioStore((s) => s.codeVersion);
  const setSchema = useStudioStore((s) => s.setSchema);
  const setStatus = useStudioStore((s) => s.setStatus);
  const setError = useStudioStore((s) => s.setError);

  const codeRef = useRef(code);
  codeRef.current = code;
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const setupBridge = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    bridgeRef.current?.destroy();

    const bridge = createBridge({
      iframe,
      onSchema: (schema) => { setSchema(schema); },
      onReady: () => { setStatus("ready"); },
      onError: (message) => { setError(message); },
    });

    bridgeRef.current = bridge;

    setTimeout(() => {
      bridge.load(codeRef.current, valuesRef.current);
    }, 100);
  }, [setSchema, setStatus, setError]);

  const handleIframeLoad = useCallback(() => {
    setupBridge();
  }, [setupBridge]);

  // Reload sandbox when codeVersion changes (user pressed Run)
  useEffect(() => {
    if (codeVersion > 0 && bridgeRef.current) {
      // Reload the iframe to get a fresh p5 instance
      const iframe = iframeRef.current;
      if (iframe) {
        iframe.src = iframe.src; // triggers reload + onLoad
      }
    }
  }, [codeVersion]);

  // Send param updates without reload
  useEffect(() => {
    bridgeRef.current?.updateParams(values);
  }, [values]);

  // Cleanup
  useEffect(() => {
    return () => { bridgeRef.current?.destroy(); };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title="Ergon Sandbox"
      src="/sandbox/index.html"
      sandbox="allow-scripts"
      onLoad={handleIframeLoad}
      className="w-full h-full border-0"
      style={{ background: "#000" }}
    />
  );
}
```

- [ ] **Step 2: Run existing Canvas tests**

```bash
npx vitest run src/__tests__/components/Canvas.test.tsx
```

Expected: PASS (the tests check iframe attributes, not reload behavior).

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/Canvas.tsx
git commit -m "feat: Canvas reloads sandbox on code version change"
```

---

### Task 5: Four New Templates

**Files:**
- Create: `src/lib/templates/grid.ts`, `src/lib/templates/pulse.ts`, `src/lib/templates/scatter.ts`, `src/lib/templates/weave.ts`
- Test: `src/__tests__/templates/grid.test.ts`, `src/__tests__/templates/pulse.test.ts`, `src/__tests__/templates/scatter.test.ts`, `src/__tests__/templates/weave.test.ts`
- Modify: `src/lib/templates/registry.ts`

Each template follows the same pattern as Drift: a schema exported for tests, a code string, and a Template object. All tests share the same structure — check metadata, schema validity, param count, and code structure.

- [ ] **Step 1: Write test for Grid template**

Create `src/__tests__/templates/grid.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { grid } from "@/lib/templates/grid";
import { validateParamSchema, getDefaultValues } from "@/lib/types";

describe("grid template", () => {
  it("has required metadata", () => {
    expect(grid.name).toBe("Grid");
    expect(grid.description).toBeDefined();
    expect(grid.code).toBeDefined();
  });

  it("has a valid parameter schema", () => {
    expect(validateParamSchema(grid.schema)).toBe(true);
  });

  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(grid.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });

  it("code contains ergon.params() call", () => {
    expect(grid.code).toContain("ergon.params(");
  });
});
```

- [ ] **Step 2: Implement Grid template**

Create `src/lib/templates/grid.ts`:

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const gridSchema: ParamSchema = {
  columns: {
    type: "number", min: 3, max: 32, default: 12, step: 1, label: "Columns",
  },
  rotation: {
    type: "number", min: 0, max: 180, default: 45, step: 1, label: "Rotation",
  },
  density: {
    type: "number", min: 0.1, max: 1.0, default: 0.8, step: 0.05, label: "Density",
  },
  shape: {
    type: "select",
    options: ["Square", "Circle", "Line"],
    default: "Square",
    label: "Shape",
  },
  invert: {
    type: "boolean", default: false, label: "Invert",
  },
};

export const gridCode = `
const params = ergon.params({
  columns:  { type: 'number', min: 3, max: 32, default: 12, step: 1, label: 'Columns' },
  rotation: { type: 'number', min: 0, max: 180, default: 45, step: 1, label: 'Rotation' },
  density:  { type: 'number', min: 0.1, max: 1.0, default: 0.8, step: 0.05, label: 'Density' },
  shape:    { type: 'select', options: ['Square', 'Circle', 'Line'], default: 'Square', label: 'Shape' },
  invert:   { type: 'boolean', default: false, label: 'Invert' },
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function draw() {
  const bg = params.invert ? 0 : 255;
  const fg = params.invert ? 255 : 0;
  background(bg);
  fill(fg);
  noStroke();

  const size = min(width, height) / params.columns;
  const offsetX = (width - params.columns * size) / 2;
  const offsetY = (height - params.columns * size) / 2;

  for (let x = 0; x < params.columns; x++) {
    for (let y = 0; y < params.columns; y++) {
      if (random() > params.density) continue;

      push();
      translate(offsetX + x * size + size / 2, offsetY + y * size + size / 2);
      rotate(random(-params.rotation, params.rotation) * PI / 180);

      if (params.shape === 'Circle') {
        ellipse(0, 0, size * 0.8);
      } else if (params.shape === 'Line') {
        rectMode(CENTER);
        rect(0, 0, size * 0.8, 2);
      } else {
        rectMode(CENTER);
        rect(0, 0, size * 0.75, size * 0.75);
      }
      pop();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function mousePressed() {
  noiseSeed(millis());
  redraw();
}
`;

export const grid: Template = {
  id: "grid",
  name: "Grid",
  description: "Geometric repetition with controlled variation. Looks like a Swiss poster.",
  schema: gridSchema,
  code: gridCode,
};
```

- [ ] **Step 3: Write test + implement Pulse template**

Create `src/__tests__/templates/pulse.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { pulse } from "@/lib/templates/pulse";
import { validateParamSchema } from "@/lib/types";

describe("pulse template", () => {
  it("has required metadata", () => {
    expect(pulse.name).toBe("Pulse");
    expect(pulse.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(pulse.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(pulse.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

Create `src/lib/templates/pulse.ts`:

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const pulseSchema: ParamSchema = {
  rings: {
    type: "number", min: 3, max: 30, default: 12, step: 1, label: "Rings",
  },
  tempo: {
    type: "number", min: 0.2, max: 4.0, default: 1.0, step: 0.1, label: "Tempo",
  },
  amplitude: {
    type: "number", min: 5, max: 120, default: 40, step: 1, label: "Amplitude",
  },
  colorShift: {
    type: "number", min: 0, max: 360, default: 0, step: 1, label: "Color Shift",
  },
  strokeWeight: {
    type: "number", min: 0.5, max: 6, default: 1.5, step: 0.5, label: "Stroke",
  },
};

export const pulseCode = `
const params = ergon.params({
  rings:        { type: 'number', min: 3, max: 30, default: 12, step: 1, label: 'Rings' },
  tempo:        { type: 'number', min: 0.2, max: 4.0, default: 1.0, step: 0.1, label: 'Tempo' },
  amplitude:    { type: 'number', min: 5, max: 120, default: 40, step: 1, label: 'Amplitude' },
  colorShift:   { type: 'number', min: 0, max: 360, default: 0, step: 1, label: 'Color Shift' },
  strokeWeight: { type: 'number', min: 0.5, max: 6, default: 1.5, step: 0.5, label: 'Stroke' },
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
}

function draw() {
  background(0, 0, 5);
  noFill();
  translate(width / 2, height / 2);

  for (let i = 0; i < params.rings; i++) {
    const phase = (i / params.rings) * TWO_PI;
    const baseRadius = map(i, 0, params.rings, 40, min(width, height) * 0.45);
    const radius = baseRadius + sin(frameCount * 0.02 * params.tempo + phase) * params.amplitude;

    const hue = (i / params.rings * params.colorShift) % 360;
    const alpha = map(i, 0, params.rings, 100, 30);
    stroke(hue, params.colorShift > 0 ? 60 : 0, 100, alpha);
    strokeWeight(params.strokeWeight);

    ellipse(0, 0, radius * 2);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
`;

export const pulse: Template = {
  id: "pulse",
  name: "Pulse",
  description: "Concentric rings breathing with sine-wave rhythm. Time as a creative variable.",
  schema: pulseSchema,
  code: pulseCode,
};
```

- [ ] **Step 4: Write test + implement Scatter template**

Create `src/__tests__/templates/scatter.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { scatter } from "@/lib/templates/scatter";
import { validateParamSchema } from "@/lib/types";

describe("scatter template", () => {
  it("has required metadata", () => {
    expect(scatter.name).toBe("Scatter");
    expect(scatter.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(scatter.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(scatter.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

Create `src/lib/templates/scatter.ts`:

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const scatterSchema: ParamSchema = {
  count: {
    type: "number", min: 5, max: 500, default: 200, step: 5, label: "Count",
  },
  sizeMax: {
    type: "number", min: 10, max: 150, default: 60, step: 5, label: "Max Size",
  },
  opacity: {
    type: "number", min: 0.05, max: 1.0, default: 0.3, step: 0.05, label: "Opacity",
  },
  spacing: {
    type: "number", min: 0, max: 50, default: 0, step: 1, label: "Spacing",
  },
  palette: {
    type: "select",
    options: ["Watercolor", "Warm", "Cool", "Pastel", "Neon", "Mono"],
    default: "Watercolor",
    label: "Palette",
  },
};

export const scatterCode = `
const palettes = {
  Watercolor: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
  Warm:       ['#ff6b35', '#f7c59f', '#ff9f1c', '#e71d36', '#af3800'],
  Cool:       ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
  Pastel:     ['#ffcdb2', '#ffb4a2', '#e5989b', '#b5838d', '#6d6875'],
  Neon:       ['#ff006e', '#fb5607', '#ffbe0b', '#3a86ff', '#8338ec'],
  Mono:       ['#111', '#333', '#555', '#888', '#bbb'],
};

const params = ergon.params({
  count:   { type: 'number', min: 5, max: 500, default: 200, step: 5, label: 'Count' },
  sizeMax: { type: 'number', min: 10, max: 150, default: 60, step: 5, label: 'Max Size' },
  opacity: { type: 'number', min: 0.05, max: 1.0, default: 0.3, step: 0.05, label: 'Opacity' },
  spacing: { type: 'number', min: 0, max: 50, default: 0, step: 1, label: 'Spacing' },
  palette: { type: 'select', options: ['Watercolor', 'Warm', 'Cool', 'Pastel', 'Neon', 'Mono'], default: 'Watercolor', label: 'Palette' },
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function draw() {
  background(252);
  noStroke();

  const colors = palettes[params.palette] || palettes.Watercolor;
  const placed = [];
  let attempts = 0;

  while (placed.length < params.count && attempts < params.count * 10) {
    const x = random(width);
    const y = random(height);
    const r = random(10, params.sizeMax);

    let tooClose = false;
    if (params.spacing > 0) {
      for (const p of placed) {
        if (dist(x, y, p.x, p.y) < (r + p.r) / 2 + params.spacing) {
          tooClose = true;
          break;
        }
      }
    }

    if (!tooClose) {
      const c = colors[floor(random(colors.length))];
      const col = color(c);
      col.setAlpha(params.opacity * 255);
      fill(col);
      ellipse(x, y, r);
      placed.push({ x, y, r });
    }
    attempts++;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function mousePressed() {
  noiseSeed(millis());
  redraw();
}
`;

export const scatter: Template = {
  id: "scatter",
  name: "Scatter",
  description: "Controlled randomness. The difference between noise and composition.",
  schema: scatterSchema,
  code: scatterCode,
};
```

- [ ] **Step 5: Write test + implement Weave template**

Create `src/__tests__/templates/weave.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { weave } from "@/lib/templates/weave";
import { validateParamSchema } from "@/lib/types";

describe("weave template", () => {
  it("has required metadata", () => {
    expect(weave.name).toBe("Weave");
    expect(weave.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(weave.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(weave.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

Create `src/lib/templates/weave.ts`:

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const weaveSchema: ParamSchema = {
  depth: {
    type: "number", min: 1, max: 8, default: 5, step: 1, label: "Depth",
  },
  splitBias: {
    type: "number", min: 0.0, max: 1.0, default: 0.5, step: 0.05, label: "Split Bias",
  },
  colorFill: {
    type: "number", min: 0.0, max: 1.0, default: 0.3, step: 0.05, label: "Color Fill",
  },
  gap: {
    type: "number", min: 0, max: 12, default: 4, step: 1, label: "Gap",
  },
  palette: {
    type: "select",
    options: ["Mondrian", "Pastel", "Mono", "Earth"],
    default: "Mondrian",
    label: "Palette",
  },
};

export const weaveCode = `
const palettes = {
  Mondrian: ['#c4362c', '#2a5faa', '#f7d842', '#ffffff'],
  Pastel:   ['#ffccd5', '#a8dadc', '#ffe5b4', '#d5f5e3', '#e8d5f5'],
  Mono:     ['#000', '#333', '#666', '#999', '#ccc', '#fff'],
  Earth:    ['#606c38', '#dda15e', '#bc6c25', '#fefae0', '#283618'],
};

const params = ergon.params({
  depth:     { type: 'number', min: 1, max: 8, default: 5, step: 1, label: 'Depth' },
  splitBias: { type: 'number', min: 0.0, max: 1.0, default: 0.5, step: 0.05, label: 'Split Bias' },
  colorFill: { type: 'number', min: 0.0, max: 1.0, default: 0.3, step: 0.05, label: 'Color Fill' },
  gap:       { type: 'number', min: 0, max: 12, default: 4, step: 1, label: 'Gap' },
  palette:   { type: 'select', options: ['Mondrian', 'Pastel', 'Mono', 'Earth'], default: 'Mondrian', label: 'Palette' },
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function subdivide(x, y, w, h, depth) {
  const colors = palettes[params.palette] || palettes.Mondrian;

  if (depth === 0 || w < 20 || h < 20) {
    if (random() < params.colorFill) {
      fill(colors[floor(random(colors.length))]);
    } else {
      fill(255);
    }
    noStroke();
    rect(
      x + params.gap / 2,
      y + params.gap / 2,
      w - params.gap,
      h - params.gap
    );
    return;
  }

  if (random() < params.splitBias) {
    const split = random(0.3, 0.7) * w;
    subdivide(x, y, split, h, depth - 1);
    subdivide(x + split, y, w - split, h, depth - 1);
  } else {
    const split = random(0.3, 0.7) * h;
    subdivide(x, y, w, split, depth - 1);
    subdivide(x, y + split, w, h - split, depth - 1);
  }
}

function draw() {
  background(255);
  subdivide(0, 0, width, height, params.depth);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function mousePressed() {
  noiseSeed(millis());
  redraw();
}
`;

export const weave: Template = {
  id: "weave",
  name: "Weave",
  description: "Recursive subdivision. Watch the algorithm think at each depth level.",
  schema: weaveSchema,
  code: weaveCode,
};
```

- [ ] **Step 6: Update registry with template list**

Replace `src/lib/templates/registry.ts` with:

```typescript
import type { ParamSchema } from "@/lib/types";

export type Template = {
  id: string;
  name: string;
  description: string;
  schema: ParamSchema;
  code: string;
};

import { drift } from "./drift";
import { grid } from "./grid";
import { pulse } from "./pulse";
import { scatter } from "./scatter";
import { weave } from "./weave";

export const templates: Template[] = [drift, grid, pulse, scatter, weave];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
```

- [ ] **Step 7: Run all template tests**

```bash
npx vitest run src/__tests__/templates/
```

Expected: all 5 template test files PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/templates/ src/__tests__/templates/
git commit -m "feat: add Grid, Pulse, Scatter, Weave templates and template registry"
```

---

### Task 6: Template Switcher Component

**Files:**
- Create: `src/components/studio/TemplateSwitcher.tsx`
- Test: `src/__tests__/components/TemplateSwitcher.test.tsx`

A horizontal strip at the bottom of the canvas showing all templates as clickable items.

- [ ] **Step 1: Write failing test**

Create `src/__tests__/components/TemplateSwitcher.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateSwitcher } from "@/components/studio/TemplateSwitcher";

describe("TemplateSwitcher", () => {
  it("renders all template names", () => {
    render(<TemplateSwitcher activeId="drift" onSelect={vi.fn()} />);
    expect(screen.getByText("Drift")).toBeInTheDocument();
    expect(screen.getByText("Grid")).toBeInTheDocument();
    expect(screen.getByText("Pulse")).toBeInTheDocument();
    expect(screen.getByText("Scatter")).toBeInTheDocument();
    expect(screen.getByText("Weave")).toBeInTheDocument();
  });

  it("highlights the active template", () => {
    render(<TemplateSwitcher activeId="drift" onSelect={vi.fn()} />);
    const driftButton = screen.getByText("Drift").closest("button");
    expect(driftButton?.className).toContain("text-white");
  });

  it("calls onSelect when a template is clicked", () => {
    const onSelect = vi.fn();
    render(<TemplateSwitcher activeId="drift" onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Grid"));
    expect(onSelect).toHaveBeenCalledWith("grid");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/components/TemplateSwitcher.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement TemplateSwitcher**

Create `src/components/studio/TemplateSwitcher.tsx`:

```tsx
import { templates } from "@/lib/templates/registry";

type Props = {
  activeId: string;
  onSelect: (id: string) => void;
};

export function TemplateSwitcher({ activeId, onSelect }: Props) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-neutral-950/80 backdrop-blur-sm border-t border-neutral-900">
      <span className="text-[9px] text-neutral-600 uppercase tracking-[0.15em] font-medium mr-2 shrink-0">
        Templates
      </span>
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`px-2.5 py-1 text-[11px] rounded transition-all duration-150 shrink-0 ${
            activeId === t.id
              ? "bg-white text-neutral-950 font-medium"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/components/TemplateSwitcher.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/studio/TemplateSwitcher.tsx src/__tests__/components/TemplateSwitcher.test.tsx
git commit -m "feat: add TemplateSwitcher component"
```

---

### Task 7: PNG Export Utility

**Files:**
- Create: `src/lib/export.ts`
- Test: `src/__tests__/lib/export.test.ts`

Export captures the canvas content from the sandboxed iframe. Since we can't directly access the iframe's canvas due to sandboxing, we send a message requesting the iframe to capture and send back the image data.

- [ ] **Step 1: Add export message types**

Add to `src/lib/types.ts` — append these types after the existing `ChildMessage` type:

```typescript
// --- Export Messages ---

export type RequestExportMessage = {
  type: "ergon:export";
  format: "png";
  scale: number;
};

export type ExportDataMessage = {
  type: "ergon:export-data";
  dataUrl: string;
  width: number;
  height: number;
};
```

Update the union types:

Change `ParentMessage` to:
```typescript
export type ParentMessage = LoadCodeMessage | UpdateParamsMessage | RequestExportMessage;
```

Change `ChildMessage` to:
```typescript
export type ChildMessage = SchemaMessage | ReadyMessage | ErrorMessage | ExportDataMessage;
```

- [ ] **Step 2: Write failing test for export utility**

Create `src/__tests__/lib/export.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { downloadDataUrl } from "@/lib/export";

describe("downloadDataUrl", () => {
  it("is a function", () => {
    expect(typeof downloadDataUrl).toBe("function");
  });
});
```

- [ ] **Step 3: Implement export utility**

Create `src/lib/export.ts`:

```typescript
/**
 * Triggers a browser download from a data URL.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a filename for export.
 */
export function exportFilename(templateName: string, format: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  return `ergon-${templateName.toLowerCase()}-${timestamp}.${format}`;
}
```

- [ ] **Step 4: Update runtime to handle export messages**

Add export handling to `src/runtime/index.ts`. In the message listener's switch statement, add:

```typescript
case "ergon:export":
  handleExport(msg.scale);
  break;
```

And add this function:

```typescript
function handleExport(scale: number): void {
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    sendError("No canvas found for export");
    return;
  }

  // For higher resolution, we'd need to resize — for now, capture at current size
  const dataUrl = canvas.toDataURL("image/png");
  const msg = {
    type: "ergon:export-data" as const,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
  window.parent.postMessage(msg, "*");
}
```

- [ ] **Step 5: Update bridge to handle export**

Add to `src/lib/bridge.ts`:

In `BridgeCallbacks`, add:
```typescript
onExportData?: (dataUrl: string, width: number, height: number) => void;
```

In the `Bridge` type, add:
```typescript
requestExport: (scale?: number) => void;
```

In `createBridge`, add to the switch statement:
```typescript
case "ergon:export-data":
  callbacks.onExportData?.(msg.dataUrl, msg.width, msg.height);
  break;
```

Add to the returned object:
```typescript
requestExport(scale = 1) {
  sendToIframe({ type: "ergon:export", format: "png", scale });
},
```

- [ ] **Step 6: Rebuild runtime**

```bash
npm run build:runtime
```

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/types.ts src/lib/export.ts src/lib/bridge.ts src/runtime/index.ts src/__tests__/lib/export.test.ts public/sandbox/runtime.js
git commit -m "feat: add PNG export pipeline (types, runtime, bridge, utility)"
```

---

### Task 8: Toolbar Component

**Files:**
- Create: `src/components/studio/Toolbar.tsx`

A minimal top bar with action buttons: Run Code, Export PNG, Toggle Editor, Fullscreen.

- [ ] **Step 1: Create Toolbar**

Create `src/components/studio/Toolbar.tsx`:

```tsx
"use client";

import { useStudioStore } from "@/lib/store";

export function Toolbar() {
  const editorOpen = useStudioStore((s) => s.editorOpen);
  const status = useStudioStore((s) => s.status);
  const toggleEditor = useStudioStore((s) => s.toggleEditor);
  const toggleFullscreen = useStudioStore((s) => s.toggleFullscreen);
  const runCode = useStudioStore((s) => s.runCode);

  return (
    <div className="flex items-center justify-between px-4 h-10 bg-neutral-950 border-b border-neutral-900 shrink-0">
      {/* Left — Ergon wordmark */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em]">
          Ergon
        </span>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-1">
        {/* Run button — only visible when editor is open */}
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

        {/* Toggle code editor */}
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

        {/* Export PNG */}
        <button
          id="export-btn"
          className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors"
        >
          Export
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors"
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

- [ ] **Step 2: Commit**

```bash
git add src/components/studio/Toolbar.tsx
git commit -m "feat: add Toolbar component with Run, Code, Export, Fullscreen actions"
```

---

### Task 9: Keyboard Shortcuts

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: Implement keyboard shortcut hook**

Create `src/hooks/useKeyboardShortcuts.ts`:

```typescript
"use client";

import { useEffect } from "react";
import { useStudioStore } from "@/lib/store";

export function useKeyboardShortcuts() {
  const toggleEditor = useStudioStore((s) => s.toggleEditor);
  const toggleFullscreen = useStudioStore((s) => s.toggleFullscreen);
  const runCode = useStudioStore((s) => s.runCode);
  const editorOpen = useStudioStore((s) => s.editorOpen);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // Don't intercept when typing in an input or the code editor
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      // CodeMirror uses .cm-content
      if (target.closest(".cm-editor")) {
        // Only handle Cmd+Enter inside the editor (run code)
        if (meta && e.key === "Enter") {
          e.preventDefault();
          runCode();
        }
        return;
      }

      // Cmd/Ctrl + E — toggle editor
      if (meta && e.key === "e") {
        e.preventDefault();
        toggleEditor();
      }

      // Cmd/Ctrl + Enter — run code
      if (meta && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }

      // Escape — exit fullscreen or close editor
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (editorOpen) {
          toggleEditor();
        }
      }

      // F — toggle fullscreen (when not in editor)
      if (e.key === "f" && !meta && !editorOpen) {
        e.preventDefault();
        toggleFullscreen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleEditor, toggleFullscreen, runCode, editorOpen]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts
git commit -m "feat: add keyboard shortcuts hook (Cmd+E editor, Cmd+Enter run, F fullscreen)"
```

---

### Task 10: Rewrite Studio Layout

**Files:**
- Modify: `src/components/studio/Studio.tsx`

This is the big integration task. The Studio layout becomes:
- Top: Toolbar
- Middle: Canvas (with template switcher overlay at bottom)
- Bottom (collapsible): Code editor
- Right sidebar: Parameter panel (hideable in fullscreen)

- [ ] **Step 1: Rewrite Studio.tsx**

Replace `src/components/studio/Studio.tsx` with:

```tsx
"use client";

import { useCallback } from "react";
import { Canvas } from "./Canvas";
import { ParameterPanel } from "./ParameterPanel";
import { CodeEditor } from "./CodeEditor";
import { TemplateSwitcher } from "./TemplateSwitcher";
import { Toolbar } from "./Toolbar";
import { useStudioStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getTemplate } from "@/lib/templates/registry";
import { downloadDataUrl, exportFilename } from "@/lib/export";

export function Studio() {
  const schema = useStudioStore((s) => s.schema);
  const values = useStudioStore((s) => s.values);
  const status = useStudioStore((s) => s.status);
  const error = useStudioStore((s) => s.error);
  const template = useStudioStore((s) => s.template);
  const code = useStudioStore((s) => s.code);
  const editorOpen = useStudioStore((s) => s.editorOpen);
  const isFullscreen = useStudioStore((s) => s.isFullscreen);
  const setParamValue = useStudioStore((s) => s.setParamValue);
  const setCode = useStudioStore((s) => s.setCode);
  const setTemplate = useStudioStore((s) => s.setTemplate);

  useKeyboardShortcuts();

  const handleTemplateSelect = useCallback(
    (id: string) => {
      const t = getTemplate(id);
      if (t) setTemplate(t);
    },
    [setTemplate]
  );

  const handleExport = useCallback(() => {
    // For now, use a simple canvas capture approach
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[title="Ergon Sandbox"]'
    );
    if (!iframe) return;

    // Request export via bridge (the Canvas component handles the response)
    // For MVP, we'll trigger this through the store
    const filename = exportFilename(template.name, "png");

    // Try to capture from the iframe's canvas directly
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      const canvas = iframeDoc?.querySelector("canvas");
      if (canvas) {
        const dataUrl = canvas.toDataURL("image/png");
        downloadDataUrl(dataUrl, filename);
      }
    } catch {
      // Cross-origin restriction — use postMessage export instead
      console.warn("Cannot access iframe canvas directly. Use postMessage export.");
    }
  }, [template.name]);

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Toolbar */}
      <Toolbar />

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas + Editor stack */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas area */}
          <div className="flex-1 relative min-h-0">
            <Canvas />

            {/* Template switcher — pinned to bottom of canvas */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <TemplateSwitcher
                activeId={template.id}
                onSelect={handleTemplateSelect}
              />
            </div>

            {/* Error overlay */}
            {status === "error" && error && (
              <div className="absolute bottom-12 left-4 right-4 bg-red-950/90 text-red-200 text-[11px] px-4 py-3 rounded font-mono backdrop-blur-sm z-20">
                {error}
              </div>
            )}
          </div>

          {/* Code editor panel — slides up from bottom */}
          {editorOpen && (
            <div className="h-[40vh] border-t border-neutral-800 bg-[#0a0a0a] shrink-0">
              <CodeEditor code={code} onChange={setCode} />
            </div>
          )}
        </div>

        {/* Parameter Panel — right sidebar */}
        {!isFullscreen && (
          <div className="w-72 bg-neutral-950 border-l border-neutral-900 flex flex-col shrink-0">
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-neutral-900">
              <h2 className="text-[11px] font-semibold text-white uppercase tracking-[0.15em]">
                {template.name}
              </h2>
              <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed">
                {template.description}
              </p>
            </div>

            {/* Controls */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ParameterPanel
                schema={schema}
                values={values}
                onChange={setParamValue}
              />
            </div>

            {/* Footer — status + shortcuts hint */}
            <div className="px-5 py-3 border-t border-neutral-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === "ready"
                        ? "bg-emerald-500"
                        : status === "error"
                          ? "bg-red-500"
                          : "bg-amber-500 animate-pulse"
                    }`}
                  />
                  <span className="text-[9px] text-neutral-600 uppercase tracking-[0.15em] font-medium">
                    {status === "ready"
                      ? "Running"
                      : status === "error"
                        ? "Error"
                        : "Loading"}
                  </span>
                </div>
                <span className="text-[9px] text-neutral-700">
                  {editorOpen ? "⌘↵ Run" : "⌘E Code"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire up the Export button in Toolbar**

The Export button in Toolbar.tsx currently has `id="export-btn"` but no onClick. Update it to accept an `onExport` prop, or use the store. For simplicity, add an export action to the Toolbar:

Update the Export button in `src/components/studio/Toolbar.tsx` — change the export button to:

```tsx
<button
  onClick={() => {
    // Dispatch a custom event that Studio listens to
    window.dispatchEvent(new CustomEvent("ergon:export"));
  }}
  className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors"
>
  Export
</button>
```

And in `Studio.tsx`, add an effect to listen for the export event:

```typescript
useEffect(() => {
  function onExport() { handleExport(); }
  window.addEventListener("ergon:export", onExport);
  return () => window.removeEventListener("ergon:export", onExport);
}, [handleExport]);
```

- [ ] **Step 3: Rebuild runtime and build app**

```bash
npm run build:runtime && npm run build
```

Expected: success.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/studio/ src/hooks/ src/lib/
git commit -m "feat: integrate code editor, template switcher, toolbar, and keyboard shortcuts into Studio"
```

---

### Task 11: Final Verification & Polish

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 2: Build everything**

```bash
npm run build:runtime && npm run build
```

Expected: zero errors.

- [ ] **Step 3: Manual verification checklist**

Start dev server (`npm run dev`) and verify:

1. Studio loads with Drift template running
2. Parameter sliders work — art responds in real-time
3. Click template names in the bottom strip — template switches, art updates
4. All 5 templates render correctly (Drift, Grid, Pulse, Scatter, Weave)
5. Click "Code" in toolbar — editor slides up from bottom with syntax-highlighted code
6. Edit code in editor → click "Run" → sandbox reloads with new code
7. Press Cmd+E — editor toggles
8. Press Cmd+Enter — code runs
9. Click fullscreen button — sidebar hides
10. Click Export — downloads PNG (may require allowing same-origin iframe access)

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: adjustments from end-to-end testing"
```

---

## What's Next

**Plan 3: Auth + Publish + Share** — Supabase auth, database schema, save/load works, publish flow with thumbnail generation, artist profile pages, and shareable piece URLs.
