# Plan: Blocks & Recipes — The Composition Architecture

**Date:** 2026-03-31
**Author:** Niki + Claude
**Status:** Draft — pending review

---

## Niki's Vision

> I want the app to be:
> - TouchDesigner but easy to use
> - Create stunning visuals
> - Building blocks / gamified / interactive / feels like play

## The Problem (from Codex audit, 2026-03-31)

The app feels random because layers don't have roles or relationships. It's a flat stack of unrelated effects. The interface exposes tuning before establishing intent. Users tweak parameters without understanding the big picture.

The experience feels like a toolbox, not a composition system.

## The Solution: Blocks + Recipes

### Core Concepts

**Blocks** replace templates. A Block is a visual building block with:
- A **role** (Base, Shape, Color, Motion, Texture) that defines its purpose in a composition
- A **visual identity** — you can see what it does at a glance
- **Default blend/opacity** tuned for its role (a Texture block defaults to `overlay` at 40%, not `normal` at 100%)
- The same code/schema/params as current templates, but wrapped in composition-aware metadata

**Recipes** replace the template grid. A Recipe is a pre-composed stack of 2-4 blocks with:
- Blocks assigned to roles
- Shared drivers (palette, seed, tempo) pre-configured
- A name and mood ("Aurora Night", "Swiss Grid", "Ink Flow")
- The starting point for every session — no blank canvas

**Shared Drivers** sit above the block stack:
- **Palette** — 3-5 colors that all blocks sample from. Change the palette, recolor everything.
- **Seed** — one seed = one artwork. Randomize to explore. Lock to keep.
- **Tempo** — controls all motion. 0 = frozen. 1 = normal. 2 = fast.

### The Play Loop

1. **Pick a recipe** → see it running immediately (no blank canvas ever)
2. **Swap blocks** → drag a different Shape block in, the composition updates live
3. **Tweak shared drivers** → change palette or tempo, everything responds
4. **Solo/mute blocks** → tap to isolate a block, understand what it contributes
5. **Tune individual blocks** → adjust per-block params when you want detail
6. **Export** → PNG or future video

Every action produces immediate visual change. The art is always alive.

---

## Architecture

### Type Changes

```typescript
// NEW: Block roles
type BlockRole = "base" | "shape" | "color" | "motion" | "texture";

// NEW: Block extends Template with role metadata
type Block = {
  id: string;
  name: string;
  description: string;
  role: BlockRole;
  schema: ParamSchema;
  code: string;
  defaults: {
    blendMode: BlendMode;
    opacity: number;
  };
  tags: string[];  // for filtering: ["geometric", "organic", "minimal", etc.]
};

// NEW: Shared composition drivers
type SharedDrivers = {
  palette: string[];           // 3-5 hex colors
  seed: number;
  tempo: number;               // 0-2, multiplier for all motion
};

// NEW: Recipe — a pre-composed stack
type Recipe = {
  id: string;
  name: string;
  description: string;
  mood: string;                // "dark", "light", "warm", "cool", "minimal", "maximal"
  blocks: RecipeBlock[];
  drivers: SharedDrivers;
};

type RecipeBlock = {
  blockId: string;
  role: BlockRole;
  opacity: number;
  blendMode: BlendMode;
  paramOverrides?: Partial<ParamValues>;  // recipe-specific param tweaks
};

// UPDATED: Layer gets role
type Layer = {
  id: string;
  blockId: string;             // was templateId
  role: BlockRole;             // NEW
  name: string;
  code: string;
  schema: ParamSchema | null;
  values: ParamValues;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
};
```

### Store Changes

```typescript
// NEW state
sharedDrivers: SharedDrivers;
activeRecipe: Recipe | null;

// NEW actions
setSharedDrivers: (drivers: Partial<SharedDrivers>) => void;
loadRecipe: (recipe: Recipe) => void;
swapBlock: (layerId: string, newBlockId: string) => void;
soloLayer: (layerId: string) => void;    // mute all others
unsoloAll: () => void;
```

### Shared Drivers → Blocks Communication

When shared drivers change, the store sends updated values to ALL layer bridges:
- `palette` → injected as `ergon.palette` in runtime (array of hex strings)
- `seed` → sent via existing `ergon:seed` message to all layers
- `tempo` → injected as `ergon.tempo` in runtime (multiplier applied to frameCount)

The runtime gets new globals:
```javascript
window.ergon = {
  params: (schema) => { ... },          // existing
  palette: ["#1a1a1a", "#e8b931", ...], // NEW: shared palette
  tempo: 1.0,                           // NEW: speed multiplier
};
```

Templates that want to use shared drivers read `ergon.palette[0]` instead of hardcoding colors, and multiply time by `ergon.tempo`.

### Migration: Templates → Blocks

Every existing template becomes a Block by adding:
- `role` — assigned based on what it does
- `defaults.blendMode` / `defaults.opacity` — tuned for the role
- `tags` — for filtering

```
drift       → role: "motion",  defaults: { blendMode: "screen", opacity: 0.6 }
grid        → role: "shape",   defaults: { blendMode: "multiply", opacity: 0.8 }
pulse       → role: "motion",  defaults: { blendMode: "screen", opacity: 0.5 }
scatter     → role: "shape",   defaults: { blendMode: "normal", opacity: 0.7 }
weave       → role: "shape",   defaults: { blendMode: "normal", opacity: 0.9 }
flowfield   → role: "motion",  defaults: { blendMode: "screen", opacity: 0.5 }
particles   → role: "motion",  defaults: { blendMode: "screen", opacity: 0.6 }
spiral      → role: "shape",   defaults: { blendMode: "multiply", opacity: 0.7 }
aurora      → role: "color",   defaults: { blendMode: "screen", opacity: 0.7 }
waves       → role: "motion",  defaults: { blendMode: "normal", opacity: 0.6 }
constellation → role: "texture", defaults: { blendMode: "screen", opacity: 0.4 }
terrain     → role: "base",    defaults: { blendMode: "normal", opacity: 1.0 }
bloom       → role: "color",   defaults: { blendMode: "screen", opacity: 0.5 }
glitch      → role: "texture", defaults: { blendMode: "difference", opacity: 0.3 }
mesh        → role: "shape",   defaults: { blendMode: "multiply", opacity: 0.6 }
contour     → role: "base",    defaults: { blendMode: "normal", opacity: 1.0 }
marble      → role: "base",    defaults: { blendMode: "normal", opacity: 1.0 }
glyphs      → role: "texture", defaults: { blendMode: "overlay", opacity: 0.5 }
```

### Recipes (5 starter compositions)

**1. "Aurora Night"** — dark, atmospheric, glowing
- Base: marble (dark tones)
- Color: aurora (gradient bands)
- Motion: particles (sparse sparkle)
- Drivers: palette ["#0a0a2e", "#00ff88", "#0088ff", "#8800ff", "#1a1a3e"], tempo 0.8

**2. "Swiss Grid"** — clean, geometric, editorial
- Base: terrain (light contours)
- Shape: grid (black on white)
- Texture: glyphs (subtle overlay)
- Drivers: palette ["#ffffff", "#000000", "#c4362c", "#2a5faa", "#f5f5f0"], tempo 0

**3. "Ink Flow"** — organic, flowing, meditative
- Base: contour (monochrome field)
- Motion: flowfield (dark ink trails)
- Color: bloom (subtle color bleed)
- Drivers: palette ["#1a1a1a", "#2a2a2a", "#444444", "#888888", "#f5f5f0"], tempo 1.2

**4. "Neon Pulse"** — energetic, bright, rhythmic
- Base: mesh (dark wireframe)
- Motion: pulse (expanding rings)
- Color: aurora (neon gradient)
- Texture: glitch (subtle digital noise)
- Drivers: palette ["#0a0a0a", "#ff006e", "#3a86ff", "#ffbe0b", "#8338ec"], tempo 1.5

**5. "Soft Fields"** — pastel, organic, gentle
- Base: waves (layered sine)
- Shape: scatter (soft circles)
- Motion: drift (floating particles)
- Drivers: palette ["#f5f0eb", "#ffcdb2", "#b5838d", "#6d6875", "#e5989b"], tempo 0.6

---

## Implementation Plan

### Task 1: Block type and registry migration
**Files:** `src/lib/blocks.ts` (new), update `src/lib/templates/registry.ts`
- Define `Block`, `BlockRole` types
- Create `blocks` array by wrapping all 18 templates with role + defaults + tags
- Export `getBlock(id)`, `getBlocksByRole(role)` helpers
- Keep backward compat: `templates` still exported as alias

### Task 2: Recipe type and starter recipes
**Files:** `src/lib/recipes.ts` (new)
- Define `Recipe`, `RecipeBlock` types
- Create 5 starter recipes with block references and shared driver configs
- Export `recipes` array and `getRecipe(id)` helper

### Task 3: Shared drivers — store + runtime
**Files:** `src/lib/store.ts`, `src/lib/types.ts`, `src/runtime/index.ts`, `src/lib/bridge.ts`
- Add `SharedDrivers` type
- Add `sharedDrivers` state to store with default values
- Add `setSharedDrivers(partial)` action
- Add `ergon:drivers` parent message type
- Runtime: expose `ergon.palette` and `ergon.tempo` globals
- Bridge: add `updateDrivers(drivers)` method
- Canvas: send shared drivers to all layer bridges when they change

### Task 4: Update Layer type with role
**Files:** `src/lib/layers.ts`, `src/lib/store.ts`
- Add `role: BlockRole` to Layer type
- Update `createLayer` to accept role
- Update `addLayer` store action to use block defaults (blend, opacity)
- Add `swapBlock(layerId, newBlockId)` — replaces a layer's code/schema with a new block
- Add `soloLayer(layerId)` / `unsoloAll()` — mute everything except one

### Task 5: Recipe loader
**Files:** `src/lib/store.ts`
- Add `loadRecipe(recipe)` action
- When loading: create Layer for each RecipeBlock, set shared drivers, enter composition mode
- Apply paramOverrides from recipe
- Set `activeRecipe` in store

### Task 6: Sidebar redesign — Recipe Picker replaces Templates tab
**Files:** `src/components/studio/RecipePicker.tsx` (new), `src/components/studio/Studio.tsx`
- New component: grid of recipe cards with mood/name
- Clicking a recipe loads it (calls `loadRecipe`)
- Visual: each card shows the recipe name + mood color + block count
- Replace "Templates" tab with "Recipes" tab
- Keep "Controls" tab (now shows shared drivers at top + active block params below)
- Keep "Layers" tab (now shows blocks with roles)

### Task 7: Shared Drivers panel
**Files:** `src/components/studio/SharedDriversPanel.tsx` (new), `src/components/studio/Studio.tsx`
- Renders at top of Controls tab (above per-block params)
- Palette: 5 color swatches, click to edit
- Seed: number + randomize button
- Tempo: slider 0-2

### Task 8: Block Picker in Layer Panel
**Files:** `src/components/studio/LayerPanel.tsx`, `src/components/studio/BlockPicker.tsx` (new)
- Replace template picker with block picker grouped by role
- Show blocks filtered by role tabs: Base | Shape | Color | Motion | Texture
- Each block card shows name + role badge
- Clicking adds block to stack with role-appropriate defaults
- "Swap" action on existing layers opens picker filtered to same role

### Task 9: Solo/mute interaction
**Files:** `src/components/studio/LayerItem.tsx`, `src/lib/store.ts`
- Add solo button to each layer item (headphone icon)
- Solo = mute all other layers, highlight the soloed one
- Click again to unsolo (restore all visibility)
- Visual: soloed layer glows, others dim

### Task 10: Update block code to read shared drivers
**Files:** Multiple template files
- Update 5 recipe-featured blocks to read `ergon.palette` and `ergon.tempo`
- Blocks that don't read shared drivers still work (they just use their own colors/speed)
- This is opt-in per block, not mandatory

### Task 11: Runtime shared drivers support
**Files:** `src/runtime/index.ts`, rebuild `public/sandbox/runtime.js`
- Handle `ergon:drivers` message
- Update `ergon.palette` and `ergon.tempo` globals when drivers change
- Palette changes trigger `redraw()` for noLoop sketches

### Task 12: First-run experience
**Files:** `src/components/studio/Studio.tsx`
- On first load, auto-load a random recipe (not blank canvas)
- Show a subtle toast: "This is [Recipe Name]. Swap blocks, change colors, make it yours."
- No onboarding modal, no tutorial — the art is already running

### Task 13: Build + test + verify
- `npm run build:runtime`
- `npx vitest run`
- `npm run build`
- Manual verification: load recipe, swap blocks, change palette, solo layers, export

---

## What This Does NOT Include (deferred)

- Layers referencing each other (mask, influence maps) — v2
- Drag-to-reorder with animation — nice-to-have
- Per-block thumbnails in layer panel — nice-to-have, adds complexity
- Custom block creation (user-authored) — v2
- Persistence of compositions (save/load recipes) — after auth is solid
- Node-based visual programming — v3 (the "building blocks" ultimate form)

---

## Migration Strategy

This is additive, not destructive:
- All 18 templates remain as blocks (same code, same params)
- The `templates` export stays for backward compat
- Single template mode still works
- Composition mode gains recipes + shared drivers + roles
- Existing tests should pass without changes (new features are additions)

## Dependencies

- Codex's stability fixes (Supabase config, bridge lifecycle, React ref cleanup) should be merged first
- The plan assumes the current Canvas composition rendering (stacked iframes + CSS blend modes) stays
- Shared drivers require a new runtime message type and globals

## Implementation Clarifications

These decisions are intended to reduce ambiguity during build and keep the first implementation aligned with product goals.

### Recipe loading behavior

- `loadRecipe(recipe)` should replace the entire current composition stack for v1
- loading a recipe should also set `activeRecipe` and replace `sharedDrivers`
- if the user has already made edits, it is acceptable in v1 to treat loading a recipe as starting a new composition rather than merging

Rationale:

- recipes are the starting point for a composition, not additive presets
- replacement behavior is simpler, more predictable, and keeps the mental model clean

### Block swapping behavior

- `swapBlock(layerId, newBlockId)` should preserve the layer slot and role, but replace the block implementation
- when swapping, prefer this value strategy:
  - keep any param values whose keys exist in both old and new schemas and have compatible types
  - use the new block defaults for anything else
- keep the current layer visibility, opacity, and blend mode unless the product explicitly wants swap to re-apply block defaults

Rationale:

- swapping should feel playful and exploratory, not destructive
- preserving compatible values reduces friction while still respecting the new block shape

### Role strictness

- for v1, role should be treated as strongly advisory rather than absolutely enforced
- the default UI path should encourage adding/swapping within the same role
- if needed later, cross-role swapping can be enabled intentionally as an advanced move

Rationale:

- the system should feel guided, not rigid
- strong defaults matter more than hard constraints in the first version

### Solo and visibility behavior

- `soloLayer(layerId)` should temporarily mute all non-soloed layers without destroying the user's manual visibility choices
- `unsoloAll()` should restore the previous visibility state exactly as it was before solo
- if a layer was already hidden before solo, it should return to hidden after unsolo

Rationale:

- solo is an inspection tool, not a destructive visibility edit

### Backward compatibility contract

- existing template code should remain intact during the migration
- `templates` should continue to export for backward compatibility during the transition
- `blocks` should become the new primary registry API
- any existing single-template workflows should continue to function until the new recipe-first flow fully replaces them

Rationale:

- this lets the architecture evolve without forcing a big-bang rewrite

### Shared-driver-aware blocks for v1

The first implementation should update the recipe-featured blocks first, not the entire catalog.

Suggested initial set:

- `aurora`
- `particles`
- `flowfield`
- `drift`
- `bloom`

Behavior expectations:

- blocks that support shared drivers should read from `ergon.palette` and `ergon.tempo`
- blocks that do not yet support shared drivers should still work normally using their local params/defaults
- palette changes should visibly affect the composition, even if only some blocks respond in v1

Rationale:

- this keeps scope tight while making the new system feel real immediately

### First-run recipe selection

- on first load, the app should auto-load a recipe instead of showing a blank canvas
- for v1, a random recipe is acceptable
- if a deterministic default is preferred later, switch to a curated default recipe rather than returning to a blank state

Rationale:

- “no blank canvas ever” should be treated as a product rule

### Composition mode vs legacy mode

- v1 can keep legacy single-template behavior in the codebase, but the primary studio experience should move to composition mode
- new UI decisions should optimize for recipes, blocks, shared drivers, and multi-layer composition first
- legacy template-only behavior should be treated as compatibility support, not the main product path

Rationale:

- this prevents the UI from becoming split-brain between two equally primary models

## Success Criteria

After this plan ships:
1. Opening Ergon shows a running composition (never blank)
2. Users can swap blocks and see immediate visual change
3. Changing the shared palette recolors the entire composition
4. Each block has a visible role in the stack
5. Solo/mute lets users understand what each block contributes
6. The experience feels like play, not programming
