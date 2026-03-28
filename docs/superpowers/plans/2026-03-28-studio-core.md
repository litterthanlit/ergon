# Studio Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Ergon's studio core — a sandboxed iframe that runs p5.js generative art, controlled by a parameter panel via postMessage, with the Drift template proving the end-to-end flow.

**Architecture:** The studio splits across two frames. The parent frame (Next.js) renders the UI: parameter panel, canvas wrapper, and eventually the code editor. The child frame (sandboxed iframe) runs artist code inside an Ergon runtime that provides `ergon.params()` and wraps p5.js. Communication is strictly via `postMessage`. Template code is sent from parent to iframe as a string; the runtime evaluates it. Parameter changes flow from parent to iframe without iframe reload; code changes trigger a full iframe reload.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Vitest, React Testing Library, p5.js, Zustand

---

## File Structure

```
providence/
├── docs/superpowers/plans/
├── public/
│   └── sandbox/
│       ├── index.html              # Iframe HTML shell with CSP
│       ├── runtime.js              # Ergon runtime (compiled from src/runtime)
│       └── vendor/
│           └── p5.min.js           # Pinned p5.js v1.9.x
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (minimal)
│   │   ├── page.tsx                # Landing redirect to /studio
│   │   ├── globals.css             # Tailwind directives
│   │   └── studio/
│   │       └── page.tsx            # Studio page
│   ├── components/
│   │   └── studio/
│   │       ├── Canvas.tsx          # Iframe wrapper, manages bridge lifecycle
│   │       ├── ParameterPanel.tsx  # Renders controls from param schema
│   │       ├── Studio.tsx          # Main layout: canvas + panel
│   │       └── controls/
│   │           ├── SliderControl.tsx
│   │           ├── SelectControl.tsx
│   │           ├── ToggleControl.tsx
│   │           └── ColorControl.tsx
│   ├── lib/
│   │   ├── bridge.ts              # Parent-side postMessage bridge
│   │   ├── types.ts               # Shared types (param schema, messages)
│   │   ├── store.ts               # Zustand store for studio state
│   │   └── templates/
│   │       ├── registry.ts        # Template metadata & loading
│   │       └── drift.ts           # Drift template (flow fields)
│   ├── runtime/
│   │   ├── index.ts               # Runtime entry point (compiles to runtime.js)
│   │   ├── params.ts              # ergon.params() implementation
│   │   └── executor.ts            # Code evaluation & p5 lifecycle
│   └── __tests__/
│       ├── lib/
│       │   ├── bridge.test.ts
│       │   └── types.test.ts
│       ├── runtime/
│       │   ├── params.test.ts
│       │   └── executor.test.ts
│       ├── components/
│       │   ├── ParameterPanel.test.tsx
│       │   └── controls.test.tsx
│       └── templates/
│           └── drift.test.ts
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
└── vitest.config.ts
```

**Key boundaries:**
- `src/lib/types.ts` is the contract between parent and iframe. Both sides depend on these types.
- `src/runtime/` compiles to `public/sandbox/runtime.js` — it runs in the iframe, NOT in the Next.js app. It's plain JS (no React, no Node APIs).
- `src/lib/bridge.ts` is the parent-side half of the postMessage channel. It mirrors the runtime's message handling.
- `src/components/studio/` is pure UI — it reads from the Zustand store and calls the bridge.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/niki_g/conductor/workspaces/ergon/providence
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

When prompted for defaults, accept all. This creates the base project with App Router, TypeScript, and Tailwind.

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react happy-dom
```

- [ ] **Step 3: Install runtime dependencies**

```bash
npm install zustand
```

- [ ] **Step 4: Create Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/__tests__/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Add test script to package.json**

Add to `scripts` in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Strip default Next.js boilerplate**

Replace `src/app/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/studio");
}
```

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ergon",
  description: "A platform for generative art",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-black">{children}</body>
    </html>
  );
}
```

Replace `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  overflow: hidden;
}
```

- [ ] **Step 7: Verify project builds and tests run**

```bash
npm run build && npm test
```

Expected: build succeeds (with a warning about the redirect, which is fine). Tests pass (no tests yet, zero failures).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with TypeScript, Tailwind, Vitest"
```

---

### Task 2: Types & Contracts

**Files:**
- Create: `src/lib/types.ts`
- Test: `src/__tests__/lib/types.test.ts`

These types are the contract between the parent frame and the iframe. Every message and every parameter schema flows through them.

- [ ] **Step 1: Write the failing test for parameter schema types**

Create `src/__tests__/lib/types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  type ParamSchema,
  type ParamValues,
  validateParamSchema,
  getDefaultValues,
} from "@/lib/types";

describe("validateParamSchema", () => {
  it("accepts a valid number param", () => {
    const schema: ParamSchema = {
      count: {
        type: "number",
        min: 0,
        max: 100,
        default: 50,
        step: 1,
        label: "Count",
      },
    };
    expect(validateParamSchema(schema)).toBe(true);
  });

  it("accepts a valid select param", () => {
    const schema: ParamSchema = {
      palette: {
        type: "select",
        options: ["warm", "cool", "mono"],
        default: "warm",
        label: "Palette",
      },
    };
    expect(validateParamSchema(schema)).toBe(true);
  });

  it("accepts a valid boolean param", () => {
    const schema: ParamSchema = {
      invert: { type: "boolean", default: false, label: "Invert" },
    };
    expect(validateParamSchema(schema)).toBe(true);
  });

  it("accepts a valid color param", () => {
    const schema: ParamSchema = {
      color: { type: "color", default: "#ff0000", label: "Color" },
    };
    expect(validateParamSchema(schema)).toBe(true);
  });

  it("rejects a schema with missing default", () => {
    const schema = {
      count: { type: "number", min: 0, max: 100, label: "Count" },
    } as unknown as ParamSchema;
    expect(validateParamSchema(schema)).toBe(false);
  });

  it("rejects an empty schema", () => {
    expect(validateParamSchema({})).toBe(true); // empty is valid (no params)
  });
});

describe("getDefaultValues", () => {
  it("extracts default values from schema", () => {
    const schema: ParamSchema = {
      count: {
        type: "number",
        min: 0,
        max: 100,
        default: 50,
        step: 1,
        label: "Count",
      },
      palette: {
        type: "select",
        options: ["warm", "cool"],
        default: "warm",
        label: "Palette",
      },
      invert: { type: "boolean", default: false, label: "Invert" },
    };
    const values = getDefaultValues(schema);
    expect(values).toEqual({ count: 50, palette: "warm", invert: false });
  });

  it("returns empty object for empty schema", () => {
    expect(getDefaultValues({})).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/lib/types.test.ts
```

Expected: FAIL — module `@/lib/types` not found.

- [ ] **Step 3: Implement types and validation**

Create `src/lib/types.ts`:

```typescript
// --- Parameter Schema Types ---

export type NumberParam = {
  type: "number";
  min: number;
  max: number;
  default: number;
  step?: number;
  label: string;
};

export type SelectParam = {
  type: "select";
  options: string[];
  default: string;
  label: string;
};

export type BooleanParam = {
  type: "boolean";
  default: boolean;
  label: string;
};

export type ColorParam = {
  type: "color";
  default: string;
  label: string;
};

export type ParamDef = NumberParam | SelectParam | BooleanParam | ColorParam;

export type ParamSchema = Record<string, ParamDef>;

export type ParamValues = Record<string, number | string | boolean>;

// --- Messages: Parent → Iframe ---

export type LoadCodeMessage = {
  type: "ergon:load";
  code: string;
  params: ParamValues;
};

export type UpdateParamsMessage = {
  type: "ergon:params";
  values: ParamValues;
};

export type ParentMessage = LoadCodeMessage | UpdateParamsMessage;

// --- Messages: Iframe → Parent ---

export type SchemaMessage = {
  type: "ergon:schema";
  schema: ParamSchema;
};

export type ReadyMessage = {
  type: "ergon:ready";
};

export type ErrorMessage = {
  type: "ergon:error";
  message: string;
};

export type ChildMessage = SchemaMessage | ReadyMessage | ErrorMessage;

// --- Validation ---

export function validateParamSchema(schema: ParamSchema): boolean {
  for (const key in schema) {
    const param = schema[key];
    if (param.default === undefined) return false;
    if (param.label === undefined) return false;

    switch (param.type) {
      case "number":
        if (param.min === undefined || param.max === undefined) return false;
        if (param.default < param.min || param.default > param.max)
          return false;
        break;
      case "select":
        if (!param.options || param.options.length === 0) return false;
        if (!param.options.includes(param.default)) return false;
        break;
      case "boolean":
        if (typeof param.default !== "boolean") return false;
        break;
      case "color":
        if (typeof param.default !== "string") return false;
        break;
      default:
        return false;
    }
  }
  return true;
}

export function getDefaultValues(schema: ParamSchema): ParamValues {
  const values: ParamValues = {};
  for (const key in schema) {
    values[key] = schema[key].default;
  }
  return values;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/lib/types.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/__tests__/lib/types.test.ts
git commit -m "feat: add parameter schema types and validation"
```

---

### Task 3: Ergon Runtime (Iframe-Side)

**Files:**
- Create: `src/runtime/params.ts`, `src/runtime/executor.ts`, `src/runtime/index.ts`
- Test: `src/__tests__/runtime/params.test.ts`, `src/__tests__/runtime/executor.test.ts`

The runtime runs inside the sandboxed iframe. It provides the `ergon.params()` API, manages the p5.js lifecycle, and communicates with the parent via postMessage.

- [ ] **Step 1: Write failing test for params module**

Create `src/__tests__/runtime/params.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { createParamManager } from "@/runtime/params";

describe("createParamManager", () => {
  it("returns default values from schema", () => {
    const onSchema = vi.fn();
    const manager = createParamManager(onSchema);

    const params = manager.register({
      count: {
        type: "number",
        min: 0,
        max: 100,
        default: 50,
        step: 1,
        label: "Count",
      },
    });

    expect(params.count).toBe(50);
  });

  it("calls onSchema callback with the schema", () => {
    const onSchema = vi.fn();
    const manager = createParamManager(onSchema);
    const schema = {
      speed: {
        type: "number" as const,
        min: 0,
        max: 10,
        default: 5,
        step: 0.1,
        label: "Speed",
      },
    };

    manager.register(schema);

    expect(onSchema).toHaveBeenCalledWith(schema);
  });

  it("updates values when update() is called", () => {
    const onSchema = vi.fn();
    const manager = createParamManager(onSchema);

    const params = manager.register({
      count: {
        type: "number",
        min: 0,
        max: 100,
        default: 50,
        step: 1,
        label: "Count",
      },
    });

    expect(params.count).toBe(50);
    manager.update({ count: 75 });
    expect(params.count).toBe(75);
  });

  it("ignores updates for unknown keys", () => {
    const onSchema = vi.fn();
    const manager = createParamManager(onSchema);

    const params = manager.register({
      count: {
        type: "number",
        min: 0,
        max: 100,
        default: 50,
        step: 1,
        label: "Count",
      },
    });

    manager.update({ count: 75, unknown: 999 });
    expect(params.count).toBe(75);
    expect((params as Record<string, unknown>).unknown).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/runtime/params.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement params module**

Create `src/runtime/params.ts`:

```typescript
import type { ParamSchema, ParamValues } from "@/lib/types";

export type ParamManager = {
  register: (schema: ParamSchema) => ParamValues;
  update: (values: ParamValues) => void;
  getValues: () => ParamValues;
  getSchema: () => ParamSchema | null;
};

export function createParamManager(
  onSchema: (schema: ParamSchema) => void
): ParamManager {
  let currentSchema: ParamSchema | null = null;
  let currentValues: ParamValues = {};

  // We use a proxy so that reading params.count always returns
  // the latest value without the artist needing to re-fetch
  let proxy: ParamValues = {};

  function register(schema: ParamSchema): ParamValues {
    currentSchema = schema;
    currentValues = {};
    for (const key in schema) {
      currentValues[key] = schema[key].default;
    }
    // Create a proxy that reads from currentValues
    proxy = new Proxy(currentValues, {
      get(target, prop: string) {
        return target[prop];
      },
      set() {
        // Params are read-only from the artist's perspective
        return false;
      },
    });
    onSchema(schema);
    return proxy;
  }

  function update(values: ParamValues): void {
    if (!currentSchema) return;
    for (const key in values) {
      if (key in currentSchema) {
        currentValues[key] = values[key];
      }
    }
  }

  function getValues(): ParamValues {
    return { ...currentValues };
  }

  function getSchema(): ParamSchema | null {
    return currentSchema;
  }

  return { register, update, getValues, getSchema };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/runtime/params.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Write failing test for executor module**

Create `src/__tests__/runtime/executor.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { wrapSketchCode, extractParamsCall } from "@/runtime/executor";

describe("extractParamsCall", () => {
  it("detects ergon.params() in code", () => {
    const code = `
const params = ergon.params({
  count: { type: 'number', min: 0, max: 100, default: 50, label: 'Count' }
});
function setup() {}
function draw() { background(params.count); }
`;
    expect(extractParamsCall(code)).toBe(true);
  });

  it("returns false when no ergon.params() call", () => {
    const code = `function setup() {} function draw() { background(0); }`;
    expect(extractParamsCall(code)).toBe(false);
  });
});

describe("wrapSketchCode", () => {
  it("wraps code in a function that receives ergon and p5 globals", () => {
    const code = `function setup() { createCanvas(400, 400); }`;
    const wrapped = wrapSketchCode(code);
    expect(wrapped).toContain(code);
    expect(typeof wrapped).toBe("string");
    // The wrapped code should be evaluable (basic syntax check)
    expect(() => new Function("ergon", wrapped)).not.toThrow();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx vitest run src/__tests__/runtime/executor.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement executor module**

Create `src/runtime/executor.ts`:

```typescript
/**
 * Checks if the code contains an ergon.params() call.
 */
export function extractParamsCall(code: string): boolean {
  return /ergon\.params\s*\(/.test(code);
}

/**
 * Wraps artist code so it can be evaluated in the iframe context.
 * The wrapped code expects `ergon` to be available as a global.
 * p5.js globals (setup, draw, etc.) are defined at window scope.
 */
export function wrapSketchCode(code: string): string {
  // The code is executed as-is in global scope.
  // ergon.params() is available because the runtime sets window.ergon.
  // p5.js globals are available because p5 is loaded in global mode.
  return code;
}

/**
 * Evaluates artist code in the global scope of the iframe.
 * Returns any error that occurred during evaluation.
 */
export function evaluateCode(code: string): Error | null {
  try {
    // Create a script element to execute in global scope
    // (new Function() would create a new scope, losing global definitions)
    const script = document.createElement("script");
    script.textContent = wrapSketchCode(code);
    document.head.appendChild(script);
    document.head.removeChild(script);
    return null;
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err));
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
npx vitest run src/__tests__/runtime/executor.test.ts
```

Expected: all tests PASS.

- [ ] **Step 9: Implement the runtime entry point**

Create `src/runtime/index.ts`:

```typescript
/**
 * Ergon Runtime — runs inside the sandboxed iframe.
 *
 * This file is the entry point that gets compiled to public/sandbox/runtime.js.
 * It sets up:
 * 1. The ergon.params() global API
 * 2. postMessage listener for code loading and param updates
 * 3. p5.js lifecycle management
 *
 * NOTE: This file is compiled separately from the Next.js app.
 * It must not import from Next.js or React.
 */

import { createParamManager } from "./params";
import { evaluateCode, extractParamsCall } from "./executor";
import type {
  ParentMessage,
  ParamSchema,
  ParamValues,
  SchemaMessage,
  ReadyMessage,
  ErrorMessage,
} from "@/lib/types";

// --- State ---
let p5Instance: unknown = null;
const paramManager = createParamManager(handleSchema);

// --- Expose ergon global ---
(window as unknown as Record<string, unknown>).ergon = {
  params: (schema: ParamSchema): ParamValues => {
    return paramManager.register(schema);
  },
};

// --- Message Handlers ---

function handleSchema(schema: ParamSchema): void {
  const msg: SchemaMessage = { type: "ergon:schema", schema };
  window.parent.postMessage(msg, "*");
}

function sendReady(): void {
  const msg: ReadyMessage = { type: "ergon:ready" };
  window.parent.postMessage(msg, "*");
}

function sendError(message: string): void {
  const msg: ErrorMessage = { type: "ergon:error", message };
  window.parent.postMessage(msg, "*");
}

function handleLoad(code: string, initialParams: ParamValues): void {
  // Tear down existing sketch
  if (p5Instance && typeof (p5Instance as { remove: () => void }).remove === "function") {
    (p5Instance as { remove: () => void }).remove();
    p5Instance = null;
  }

  // Clear any existing global setup/draw
  delete (window as unknown as Record<string, unknown>).setup;
  delete (window as unknown as Record<string, unknown>).draw;

  // Evaluate the artist's code (defines setup/draw globally, calls ergon.params())
  const error = evaluateCode(code);
  if (error) {
    sendError(error.message);
    return;
  }

  // Apply initial param values (after schema is registered by ergon.params())
  if (initialParams && Object.keys(initialParams).length > 0) {
    paramManager.update(initialParams);
  }

  // Create new p5 instance in global mode
  const p5Constructor = (window as unknown as Record<string, unknown>).p5;
  if (typeof p5Constructor === "function") {
    p5Instance = new (p5Constructor as new () => unknown)();
  }

  sendReady();
}

function handleParams(values: ParamValues): void {
  paramManager.update(values);
}

// --- Listen for messages from parent ---
window.addEventListener("message", (event: MessageEvent<ParentMessage>) => {
  const msg = event.data;
  if (!msg || typeof msg.type !== "string") return;

  switch (msg.type) {
    case "ergon:load":
      handleLoad(msg.code, msg.params);
      break;
    case "ergon:params":
      handleParams(msg.values);
      break;
  }
});

// Signal that the runtime is loaded and waiting for code
window.parent.postMessage({ type: "ergon:runtime-ready" }, "*");
```

- [ ] **Step 10: Commit**

```bash
git add src/runtime/ src/__tests__/runtime/
git commit -m "feat: implement Ergon runtime (params, executor, message handling)"
```

---

### Task 4: Sandbox Shell

**Files:**
- Create: `public/sandbox/index.html`
- Create: download `public/sandbox/vendor/p5.min.js`

The sandbox HTML is the iframe's host document. It loads p5.js and the Ergon runtime, with strict CSP.

- [ ] **Step 1: Download p5.js**

```bash
mkdir -p /Users/niki_g/conductor/workspaces/ergon/providence/public/sandbox/vendor
curl -o /Users/niki_g/conductor/workspaces/ergon/providence/public/sandbox/vendor/p5.min.js https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js
```

- [ ] **Step 2: Create the sandbox HTML**

Create `public/sandbox/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    http-equiv="Content-Security-Policy"
    content="
      default-src 'none';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob:;
    "
  />
  <title>Ergon Sandbox</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    canvas { display: block; }
    /* p5.js creates a main element — make it fill the viewport */
    main { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <main id="canvas-container"></main>
  <script src="/sandbox/vendor/p5.min.js"></script>
  <script src="/sandbox/runtime.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create a build script for the runtime**

The runtime is TypeScript that needs to be compiled to a single JS file for the iframe. Add a simple esbuild script.

```bash
npm install -D esbuild
```

Add to `package.json` scripts:

```json
"build:runtime": "esbuild src/runtime/index.ts --bundle --outfile=public/sandbox/runtime.js --format=iife --target=es2020 --alias:@/lib/types=src/lib/types.ts --alias:@/runtime/params=src/runtime/params.ts --alias:@/runtime/executor=src/runtime/executor.ts",
"dev:runtime": "npm run build:runtime -- --watch"
```

- [ ] **Step 4: Build the runtime and verify output**

```bash
npm run build:runtime
```

Expected: `public/sandbox/runtime.js` is created. Check it contains the param manager and message listener code.

```bash
ls -la public/sandbox/runtime.js
head -5 public/sandbox/runtime.js
```

- [ ] **Step 5: Commit**

```bash
git add public/sandbox/ package.json package-lock.json
git commit -m "feat: add sandbox shell with p5.js and compiled runtime"
```

---

### Task 5: PostMessage Bridge (Parent-Side)

**Files:**
- Create: `src/lib/bridge.ts`
- Test: `src/__tests__/lib/bridge.test.ts`

The bridge manages communication between the parent frame (Next.js) and the sandbox iframe.

- [ ] **Step 1: Write failing tests for the bridge**

Create `src/__tests__/lib/bridge.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBridge, type Bridge } from "@/lib/bridge";

describe("createBridge", () => {
  let iframe: HTMLIFrameElement;
  let bridge: Bridge;
  let onSchema: ReturnType<typeof vi.fn>;
  let onReady: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    iframe = document.createElement("iframe");
    // Mock contentWindow.postMessage
    Object.defineProperty(iframe, "contentWindow", {
      value: { postMessage: vi.fn() },
      writable: true,
    });

    onSchema = vi.fn();
    onReady = vi.fn();
    onError = vi.fn();

    bridge = createBridge({
      iframe,
      onSchema,
      onReady,
      onError,
    });
  });

  it("sends load message to iframe", () => {
    const code = 'function draw() { background(0); }';
    const params = { count: 50 };
    bridge.load(code, params);

    expect(iframe.contentWindow!.postMessage).toHaveBeenCalledWith(
      { type: "ergon:load", code, params },
      "*"
    );
  });

  it("sends param update to iframe", () => {
    bridge.updateParams({ count: 75 });

    expect(iframe.contentWindow!.postMessage).toHaveBeenCalledWith(
      { type: "ergon:params", values: { count: 75 } },
      "*"
    );
  });

  it("handles schema message from iframe", () => {
    const schema = {
      count: {
        type: "number" as const,
        min: 0,
        max: 100,
        default: 50,
        step: 1,
        label: "Count",
      },
    };

    // Simulate message from iframe
    const event = new MessageEvent("message", {
      data: { type: "ergon:schema", schema },
      source: iframe.contentWindow,
    });
    window.dispatchEvent(event);

    expect(onSchema).toHaveBeenCalledWith(schema);
  });

  it("handles ready message from iframe", () => {
    const event = new MessageEvent("message", {
      data: { type: "ergon:ready" },
      source: iframe.contentWindow,
    });
    window.dispatchEvent(event);

    expect(onReady).toHaveBeenCalled();
  });

  it("handles error message from iframe", () => {
    const event = new MessageEvent("message", {
      data: { type: "ergon:error", message: "Syntax error" },
      source: iframe.contentWindow,
    });
    window.dispatchEvent(event);

    expect(onError).toHaveBeenCalledWith("Syntax error");
  });

  it("cleans up message listener on destroy", () => {
    const spy = vi.spyOn(window, "removeEventListener");
    bridge.destroy();
    expect(spy).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("ignores messages from other sources", () => {
    const event = new MessageEvent("message", {
      data: { type: "ergon:ready" },
      source: null, // Not from our iframe
    });
    window.dispatchEvent(event);

    expect(onReady).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/lib/bridge.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the bridge**

Create `src/lib/bridge.ts`:

```typescript
import type {
  ParamSchema,
  ParamValues,
  ParentMessage,
  ChildMessage,
} from "./types";

export type BridgeCallbacks = {
  iframe: HTMLIFrameElement;
  onSchema: (schema: ParamSchema) => void;
  onReady: () => void;
  onError: (message: string) => void;
};

export type Bridge = {
  load: (code: string, params: ParamValues) => void;
  updateParams: (values: ParamValues) => void;
  destroy: () => void;
};

export function createBridge(callbacks: BridgeCallbacks): Bridge {
  const { iframe, onSchema, onReady, onError } = callbacks;

  function sendToIframe(msg: ParentMessage): void {
    iframe.contentWindow?.postMessage(msg, "*");
  }

  function handleMessage(event: MessageEvent): void {
    // Only accept messages from our iframe
    if (event.source !== iframe.contentWindow) return;

    const msg = event.data as ChildMessage;
    if (!msg || typeof msg.type !== "string") return;

    switch (msg.type) {
      case "ergon:schema":
        onSchema(msg.schema);
        break;
      case "ergon:ready":
        onReady();
        break;
      case "ergon:error":
        onError(msg.message);
        break;
    }
  }

  window.addEventListener("message", handleMessage);

  return {
    load(code: string, params: ParamValues) {
      sendToIframe({ type: "ergon:load", code, params });
    },

    updateParams(values: ParamValues) {
      sendToIframe({ type: "ergon:params", values });
    },

    destroy() {
      window.removeEventListener("message", handleMessage);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/lib/bridge.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bridge.ts src/__tests__/lib/bridge.test.ts
git commit -m "feat: implement parent-side postMessage bridge"
```

---

### Task 6: Drift Template

**Files:**
- Create: `src/lib/templates/drift.ts`, `src/lib/templates/registry.ts`
- Test: `src/__tests__/templates/drift.test.ts`

The Drift template is a flow field particle system — the first thing artists see when they open the studio.

- [ ] **Step 1: Write failing test for drift template**

Create `src/__tests__/templates/drift.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { drift } from "@/lib/templates/drift";
import { validateParamSchema, getDefaultValues } from "@/lib/types";

describe("drift template", () => {
  it("has required metadata", () => {
    expect(drift.name).toBe("Drift");
    expect(drift.description).toBeDefined();
    expect(drift.code).toBeDefined();
    expect(typeof drift.code).toBe("string");
  });

  it("has a valid parameter schema", () => {
    expect(validateParamSchema(drift.schema)).toBe(true);
  });

  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(drift.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });

  it("has sensible default values", () => {
    const defaults = getDefaultValues(drift.schema);
    expect(defaults).toHaveProperty("density");
    expect(defaults).toHaveProperty("speed");
    expect(defaults).toHaveProperty("turbulence");
  });

  it("code contains ergon.params() call", () => {
    expect(drift.code).toContain("ergon.params(");
  });

  it("code contains setup and draw functions", () => {
    expect(drift.code).toContain("function setup");
    expect(drift.code).toContain("function draw");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/templates/drift.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement template registry type**

Create `src/lib/templates/registry.ts`:

```typescript
import type { ParamSchema } from "@/lib/types";

export type Template = {
  id: string;
  name: string;
  description: string;
  schema: ParamSchema;
  code: string;
};
```

- [ ] **Step 4: Implement the Drift template**

Create `src/lib/templates/drift.ts`:

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const driftSchema: ParamSchema = {
  density: {
    type: "number",
    min: 100,
    max: 8000,
    default: 2000,
    step: 100,
    label: "Density",
  },
  speed: {
    type: "number",
    min: 0.2,
    max: 5.0,
    default: 1.0,
    step: 0.1,
    label: "Speed",
  },
  turbulence: {
    type: "number",
    min: 0.001,
    max: 0.02,
    default: 0.005,
    step: 0.001,
    label: "Turbulence",
  },
  trail: {
    type: "number",
    min: 1,
    max: 80,
    default: 20,
    step: 1,
    label: "Trail Length",
  },
  palette: {
    type: "select",
    options: ["Arctic", "Sunset", "Mono", "Neon", "Earth", "Rose"],
    default: "Arctic",
    label: "Color Palette",
  },
};

export const driftCode = `
const palettes = {
  Arctic:  ['#a8dadc', '#457b9d', '#1d3557', '#f1faee', '#e63946'],
  Sunset:  ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a659e'],
  Mono:    ['#ffffff', '#cccccc', '#999999', '#666666', '#333333'],
  Neon:    ['#ff006e', '#fb5607', '#ffbe0b', '#3a86ff', '#8338ec'],
  Earth:   ['#606c38', '#283618', '#fefae0', '#dda15e', '#bc6c25'],
  Rose:    ['#ffccd5', '#ff8fa3', '#ff758f', '#c9184a', '#590d22'],
};

const params = ergon.params({
  density:    { type: 'number', min: 100, max: 8000, default: 2000, step: 100, label: 'Density' },
  speed:      { type: 'number', min: 0.2, max: 5.0, default: 1.0, step: 0.1, label: 'Speed' },
  turbulence: { type: 'number', min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: 'Turbulence' },
  trail:      { type: 'number', min: 1, max: 80, default: 20, step: 1, label: 'Trail Length' },
  palette:    { type: 'select', options: ['Arctic', 'Sunset', 'Mono', 'Neon', 'Earth', 'Rose'], default: 'Arctic', label: 'Color Palette' },
});

let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  initParticles();
}

function initParticles() {
  particles = [];
  for (let i = 0; i < params.density; i++) {
    particles.push({ x: random(width), y: random(height) });
  }
}

function draw() {
  // Fade background for trail effect
  background(0, 0, 5, map(params.trail, 1, 80, 100, 2));

  // Adjust particle count if density changed
  while (particles.length < params.density) {
    particles.push({ x: random(width), y: random(height) });
  }
  if (particles.length > params.density) {
    particles.length = params.density;
  }

  const colors = palettes[params.palette] || palettes.Arctic;
  noStroke();

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const angle = noise(p.x * params.turbulence, p.y * params.turbulence) * TWO_PI * 2;

    p.x += cos(angle) * params.speed;
    p.y += sin(angle) * params.speed;

    // Pick color based on position
    const colorIdx = floor(map(noise(p.x * 0.005, p.y * 0.005), 0, 1, 0, colors.length));
    const c = colors[constrain(colorIdx, 0, colors.length - 1)];
    fill(c);

    circle(p.x, p.y, 1.5);

    // Wrap edges
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
`;

export const drift: Template = {
  id: "drift",
  name: "Drift",
  description: "Particles flowing through a noise field. The hello world of generative art.",
  schema: driftSchema,
  code: driftCode,
};
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/__tests__/templates/drift.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/templates/ src/__tests__/templates/
git commit -m "feat: add Drift template (flow field particles)"
```

---

### Task 7: Zustand Store

**Files:**
- Create: `src/lib/store.ts`

The store manages studio state: current template, parameter values, schema, and sandbox status.

- [ ] **Step 1: Implement the studio store**

Create `src/lib/store.ts`:

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
  code: string;

  // Parameters
  schema: ParamSchema | null;
  values: ParamValues;

  // Sandbox
  status: SandboxStatus;
  error: string | null;

  // Actions
  setTemplate: (template: Template) => void;
  setSchema: (schema: ParamSchema) => void;
  setParamValue: (key: string, value: number | string | boolean) => void;
  setStatus: (status: SandboxStatus) => void;
  setError: (error: string | null) => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  // Initial state: Drift template loaded
  template: drift,
  code: drift.code,
  schema: null,
  values: getDefaultValues(drift.schema),
  status: "loading",
  error: null,

  setTemplate: (template) =>
    set({
      template,
      code: template.code,
      schema: template.schema,
      values: getDefaultValues(template.schema),
      status: "loading",
      error: null,
    }),

  setSchema: (schema) =>
    set((state) => ({
      schema,
      // Merge new defaults with existing values (keep values that still exist)
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
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/store.ts
git commit -m "feat: add Zustand store for studio state"
```

---

### Task 8: Canvas Component

**Files:**
- Create: `src/components/studio/Canvas.tsx`
- Test: `src/__tests__/components/Canvas.test.tsx`

The Canvas component renders the sandboxed iframe and manages the bridge lifecycle.

- [ ] **Step 1: Write failing test**

Create `src/__tests__/components/Canvas.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Canvas } from "@/components/studio/Canvas";

// Mock the store
vi.mock("@/lib/store", () => ({
  useStudioStore: vi.fn((selector) => {
    const state = {
      code: "function draw() {}",
      values: { count: 50 },
      setSchema: vi.fn(),
      setStatus: vi.fn(),
      setError: vi.fn(),
    };
    return selector(state);
  }),
}));

describe("Canvas", () => {
  it("renders an iframe with sandbox attributes", () => {
    render(<Canvas />);
    const iframe = screen.getByTitle("Ergon Sandbox");
    expect(iframe).toBeInTheDocument();
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute("sandbox");
  });

  it("iframe has correct sandbox permissions", () => {
    render(<Canvas />);
    const iframe = screen.getByTitle("Ergon Sandbox");
    const sandbox = iframe.getAttribute("sandbox");
    expect(sandbox).toContain("allow-scripts");
  });

  it("iframe points to sandbox URL", () => {
    render(<Canvas />);
    const iframe = screen.getByTitle("Ergon Sandbox");
    expect(iframe).toHaveAttribute("src", "/sandbox/index.html");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/components/Canvas.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement Canvas component**

Create `src/components/studio/Canvas.tsx`:

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
  const setSchema = useStudioStore((s) => s.setSchema);
  const setStatus = useStudioStore((s) => s.setStatus);
  const setError = useStudioStore((s) => s.setError);

  // Send param updates to iframe when values change
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Destroy previous bridge
    bridgeRef.current?.destroy();

    // Create new bridge
    const bridge = createBridge({
      iframe,
      onSchema: (schema) => {
        setSchema(schema);
      },
      onReady: () => {
        setStatus("ready");
      },
      onError: (message) => {
        setError(message);
      },
    });

    bridgeRef.current = bridge;

    // Load the current code into the sandbox
    // Small delay to ensure the runtime is initialized
    setTimeout(() => {
      bridge.load(code, valuesRef.current);
    }, 100);
  }, [code, setSchema, setStatus, setError]);

  // Send param updates when values change (without reloading code)
  useEffect(() => {
    bridgeRef.current?.updateParams(values);
  }, [values]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bridgeRef.current?.destroy();
    };
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

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/components/Canvas.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/studio/Canvas.tsx src/__tests__/components/
git commit -m "feat: add Canvas component with sandboxed iframe and bridge"
```

---

### Task 9: Parameter Controls

**Files:**
- Create: `src/components/studio/controls/SliderControl.tsx`, `SelectControl.tsx`, `ToggleControl.tsx`, `ColorControl.tsx`
- Create: `src/components/studio/ParameterPanel.tsx`
- Test: `src/__tests__/components/ParameterPanel.test.tsx`, `src/__tests__/components/controls.test.tsx`

- [ ] **Step 1: Write failing tests for controls**

Create `src/__tests__/components/controls.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SliderControl } from "@/components/studio/controls/SliderControl";
import { SelectControl } from "@/components/studio/controls/SelectControl";
import { ToggleControl } from "@/components/studio/controls/ToggleControl";

describe("SliderControl", () => {
  it("renders with label and current value", () => {
    render(
      <SliderControl
        label="Count"
        min={0}
        max={100}
        step={1}
        value={50}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Count")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("calls onChange when slider moves", () => {
    const onChange = vi.fn();
    render(
      <SliderControl
        label="Count"
        min={0}
        max={100}
        step={1}
        value={50}
        onChange={onChange}
      />
    );
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "75" } });
    expect(onChange).toHaveBeenCalledWith(75);
  });
});

describe("SelectControl", () => {
  it("renders options", () => {
    render(
      <SelectControl
        label="Palette"
        options={["warm", "cool"]}
        value="warm"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Palette")).toBeInTheDocument();
    expect(screen.getByText("warm")).toBeInTheDocument();
    expect(screen.getByText("cool")).toBeInTheDocument();
  });
});

describe("ToggleControl", () => {
  it("renders label and toggle", () => {
    render(
      <ToggleControl label="Invert" value={false} onChange={vi.fn()} />
    );
    expect(screen.getByText("Invert")).toBeInTheDocument();
  });

  it("calls onChange when toggled", () => {
    const onChange = vi.fn();
    render(
      <ToggleControl label="Invert" value={false} onChange={onChange} />
    );
    const toggle = screen.getByRole("checkbox");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/components/controls.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement SliderControl**

Create `src/components/studio/controls/SliderControl.tsx`:

```tsx
type Props = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
};

export function SliderControl({ label, min, max, step = 1, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-xs text-neutral-500 tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}
```

- [ ] **Step 4: Implement SelectControl**

Create `src/components/studio/controls/SelectControl.tsx`:

```tsx
type Props = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function SelectControl({ label, options, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              value === option
                ? "bg-white text-black"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement ToggleControl**

Create `src/components/studio/controls/ToggleControl.tsx`:

```tsx
type Props = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleControl({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        {label}
      </label>
      <button
        role="checkbox"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-8 h-4 rounded-full transition-colors ${
          value ? "bg-white" : "bg-neutral-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${
            value ? "translate-x-4 bg-black" : "translate-x-0 bg-neutral-400"
          }`}
        />
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Implement ColorControl**

Create `src/components/studio/controls/ColorControl.tsx`:

```tsx
type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorControl({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run control tests**

```bash
npx vitest run src/__tests__/components/controls.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 8: Write failing test for ParameterPanel**

Create `src/__tests__/components/ParameterPanel.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParameterPanel } from "@/components/studio/ParameterPanel";
import type { ParamSchema } from "@/lib/types";

describe("ParameterPanel", () => {
  const schema: ParamSchema = {
    count: {
      type: "number",
      min: 0,
      max: 100,
      default: 50,
      step: 1,
      label: "Count",
    },
    palette: {
      type: "select",
      options: ["warm", "cool"],
      default: "warm",
      label: "Palette",
    },
    invert: {
      type: "boolean",
      default: false,
      label: "Invert",
    },
  };

  it("renders a control for each parameter", () => {
    render(
      <ParameterPanel
        schema={schema}
        values={{ count: 50, palette: "warm", invert: false }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Count")).toBeInTheDocument();
    expect(screen.getByText("Palette")).toBeInTheDocument();
    expect(screen.getByText("Invert")).toBeInTheDocument();
  });

  it("renders nothing when schema is null", () => {
    const { container } = render(
      <ParameterPanel schema={null} values={{}} onChange={vi.fn()} />
    );
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it("renders a slider for number params", () => {
    render(
      <ParameterPanel
        schema={{ count: schema.count }}
        values={{ count: 50 }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});
```

- [ ] **Step 9: Implement ParameterPanel**

Create `src/components/studio/ParameterPanel.tsx`:

```tsx
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
      return (
        <SliderControl
          key={key}
          label={def.label}
          min={def.min}
          max={def.max}
          step={def.step}
          value={value as number}
          onChange={(v) => onChange(key, v)}
        />
      );
    case "select":
      return (
        <SelectControl
          key={key}
          label={def.label}
          options={def.options}
          value={value as string}
          onChange={(v) => onChange(key, v)}
        />
      );
    case "boolean":
      return (
        <ToggleControl
          key={key}
          label={def.label}
          value={value as boolean}
          onChange={(v) => onChange(key, v)}
        />
      );
    case "color":
      return (
        <ColorControl
          key={key}
          label={def.label}
          value={value as string}
          onChange={(v) => onChange(key, v)}
        />
      );
  }
}

export function ParameterPanel({ schema, values, onChange }: Props) {
  if (!schema) {
    return <div className="flex flex-col gap-4" />;
  }

  return (
    <div className="flex flex-col gap-5">
      {Object.entries(schema).map(([key, def]) =>
        renderControl(key, def, values[key], onChange)
      )}
    </div>
  );
}
```

- [ ] **Step 10: Run ParameterPanel test**

```bash
npx vitest run src/__tests__/components/ParameterPanel.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 11: Commit**

```bash
git add src/components/studio/controls/ src/components/studio/ParameterPanel.tsx src/__tests__/components/
git commit -m "feat: add parameter controls and ParameterPanel component"
```

---

### Task 10: Studio Page

**Files:**
- Create: `src/components/studio/Studio.tsx`, `src/app/studio/page.tsx`

This ties everything together: canvas on the left, parameter panel on the right.

- [ ] **Step 1: Implement Studio layout component**

Create `src/components/studio/Studio.tsx`:

```tsx
"use client";

import { Canvas } from "./Canvas";
import { ParameterPanel } from "./ParameterPanel";
import { useStudioStore } from "@/lib/store";

export function Studio() {
  const schema = useStudioStore((s) => s.schema);
  const values = useStudioStore((s) => s.values);
  const status = useStudioStore((s) => s.status);
  const error = useStudioStore((s) => s.error);
  const template = useStudioStore((s) => s.template);
  const setParamValue = useStudioStore((s) => s.setParamValue);

  return (
    <div className="h-screen w-screen bg-neutral-950 flex">
      {/* Canvas — fills available space */}
      <div className="flex-1 relative">
        <Canvas />

        {/* Status overlay */}
        {status === "error" && error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-950/90 text-red-200 text-xs p-3 rounded-lg font-mono">
            {error}
          </div>
        )}
      </div>

      {/* Parameter Panel — right sidebar */}
      <div className="w-72 bg-neutral-900 border-l border-neutral-800 p-5 flex flex-col overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            {template.name}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {template.description}
          </p>
        </div>

        <ParameterPanel
          schema={schema}
          values={values}
          onChange={setParamValue}
        />

        {/* Status indicator */}
        <div className="mt-auto pt-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                status === "ready"
                  ? "bg-green-500"
                  : status === "error"
                    ? "bg-red-500"
                    : "bg-yellow-500 animate-pulse"
              }`}
            />
            <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
              {status === "ready"
                ? "Running"
                : status === "error"
                  ? "Error"
                  : "Loading"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the studio page**

Create `src/app/studio/page.tsx`:

```tsx
import { Studio } from "@/components/studio/Studio";

export default function StudioPage() {
  return <Studio />;
}
```

- [ ] **Step 3: Build the runtime and verify the app compiles**

```bash
npm run build:runtime && npm run build
```

Expected: both commands succeed. The app builds without errors.

- [ ] **Step 4: Manual verification — run the dev server**

```bash
npm run dev
```

Open `http://localhost:3000` in a browser. You should be redirected to `/studio`. You should see:

1. A dark background with an iframe (possibly black if p5 hasn't loaded yet)
2. A right sidebar with "Drift" title and description
3. Parameter controls: Density, Speed, Turbulence, Trail Length, and Color Palette

If the sandbox is working correctly, the Drift flow field should start rendering in the canvas. Move sliders — the art should respond.

If the canvas is black, check the browser console for errors. Common issues:
- Runtime not compiled: run `npm run build:runtime`
- CSP blocking: check the sandbox attribute on the iframe
- postMessage not connecting: check that the bridge is initialized after iframe loads

- [ ] **Step 5: Commit**

```bash
git add src/components/studio/Studio.tsx src/app/studio/page.tsx
git commit -m "feat: add Studio page with canvas and parameter panel"
```

---

### Task 11: Run All Tests & Final Verification

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests pass. Count should be approximately 15-20 tests across types, bridge, runtime, controls, and ParameterPanel.

- [ ] **Step 2: Run the build**

```bash
npm run build:runtime && npm run build
```

Expected: zero errors.

- [ ] **Step 3: Verify the end-to-end flow manually**

Start the dev server (`npm run dev`) and verify:

1. Navigate to `localhost:3000` → redirects to `/studio`
2. Drift template renders in the canvas (particles flowing)
3. Move the Density slider → particle count changes visibly
4. Move the Speed slider → particle speed changes
5. Move the Turbulence slider → flow pattern changes
6. Move the Trail slider → trail length changes
7. Switch the Palette → colors change
8. No console errors

- [ ] **Step 4: Final commit with all adjustments**

If any fixes were needed during manual testing, commit them:

```bash
git add -A
git commit -m "fix: adjustments from end-to-end testing"
```

---

## What's Next

**Plan 2: Code Editor + Templates** — Adds CodeMirror 6 code editor (pull-up panel), Grid and Pulse templates, template switcher, and code ↔ sandbox reload flow.

**Plan 3: Auth + Publish + Share** — Adds Supabase auth, database schema, save/load, publish flow with thumbnail generation, artist profile pages, and shareable piece URLs.
