# Creator V2 — Blender-Grade Visual Animation Tool

**Date:** 2026-04-13
**Status:** Design approved
**Author:** Niki + Claude
**Builds on:** `2026-04-11-3d-creator-design.md`, `handoff-creator-v2.md`

## Vision

Transform the `/create` 3D creator from a preset-based sphere viewer into a real creative tool — "TouchDesigner but easy." Free-form 3D canvas, stackable visual layers, live parameter modulation, branching scene sequencer, and exportable outputs. Play over power, art direction first.

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Animation model | Performative/live + scene sequencer hybrid | TouchDesigner DNA: perform live, record later. Timeline can come as "record what you performed." |
| Object manipulation | Flat-plane drag + physics flavor | "Play over power" = immediate, Figma-like. Shift+drag for rotation. Flagged for potential gizmo rebuild later. |
| Launch layers | Spheres + Tendrils + Dust + Splatter | Moodboard-first selection. Architecture scaffolded for all 9. |
| Live modulation | Direct manipulation in scene + lite oscillator presets | Hands on the canvas, not the sidebar. 3 presets: breathe, pulse, random. |
| Scene sequencer | Branching storyboard — scene graph with trigger-able edges | The storyboard is its own creative canvas. Nodes connected by time/click/threshold triggers. |
| Save/export | Scene state JSON now, video next, embeddable widget as north star | Embeddable live widgets are the viral loop. Video is commoditized. |
| UI layout | Dual panel with drag-to-resize | Full creative tool layout: viewport + right inspector + bottom sequencer. |
| History | Undo/redo (zundo) + snapshots | Snapshots double as scene sequencer atoms. Experiment without fear. |

## Architecture Approach

**Spine-first:** One pass to lay the architectural skeleton (store, layer orchestrator, dual-panel shell, undo). Then vertical slices — each slice adds one layer + panel controls + direct manipulation. Scene sequencer as a final vertical slice.

Build order:
1. Spine — store rewrite, layer orchestrator, dual-panel shell, undo/redo, delete old grid code
2. Spheres refactor — migrate into `layers/SphereCluster.tsx` with per-element params
3. Tendrils — tube geometry along edges, proves the plugin architecture
4. Dust + Splatter — particle systems, complete the launch set
5. Direct manipulation — hover-to-control, lite oscillators
6. Scene sequencer — snapshot system, branching storyboard UI
7. Save/export — JSON serialization, then video via MediaRecorder

---

## 1. Store Architecture

### Types

```typescript
type SceneNode = {
  id: string;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number]; // default [0,0,0], future-proofed
};

type Edge = { from: string; to: string };

type LayerConfig = {
  enabled: boolean;
  intensity: number;       // 0-1
  color?: string;          // override, or null = inherit palette
  params: Record<string, number>;
};

type Layers = {
  spheres: LayerConfig;    // launch
  tendrils: LayerConfig;   // launch
  dust: LayerConfig;       // launch
  splatter: LayerConfig;   // launch
  nebula: LayerConfig;     // scaffolded
  flow: LayerConfig;       // scaffolded
  wireframe: LayerConfig;  // scaffolded
  halos: LayerConfig;      // scaffolded
  lightRays: LayerConfig;  // scaffolded
};

type ModulationPreset = 'none' | 'breathe' | 'pulse' | 'random';

type Modulation = {
  target: string;          // e.g. "layers.spheres.params.scatterRadius"
  preset: ModulationPreset;
  speed: number;           // Hz, 0.1-5
  amplitude: number;       // 0-1 (percentage of slider range)
};

type Snapshot = {
  id: string;
  name: string;
  timestamp: number;
  state: SerializedState;  // full store minus undo history
};

type SceneConnection = {
  id: string;
  from: string;            // snapshot ID
  to: string;              // snapshot ID
  trigger: Trigger;
  transition: {
    duration: number;      // ms
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
};

type Trigger =
  | { type: 'time'; delay: number }
  | { type: 'click' }
  | { type: 'paramThreshold'; param: string; value: number; direction: 'above' | 'below' };

type PostFX = {
  bloom: boolean;
  chromatic: boolean;
  vignette: boolean;
  dof: boolean;
  grain: boolean;
  toneMapping: boolean;
  motionBlur: boolean;
};

type ImagePlane = {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};
```

### Store Shape

```typescript
{
  // Scene graph (replaces grid)
  nodes: SceneNode[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Layers (replaces renderMode)
  layers: Layers;

  // Modulations
  modulations: Modulation[];

  // Global params
  breathe: number;         // 0-30, default 8
  pulseSpeed: number;      // 0-3, default 1.0
  tempo: number;           // 0-3, default 1.0
  seed: number;

  // Visuals
  palette: string[];
  postFX: PostFX;

  // Snapshots & sequencer
  snapshots: Snapshot[];
  connections: SceneConnection[];
  activeSnapshotId: string | null;
  isPlaying: boolean;

  // Assets
  imagePlanes: ImagePlane[];
}
```

### Deleted State

- `GridPoint`, `gridCols`, `gridRows`, `initGrid()`, `renderMode`, `setRenderMode()`, `selectedPoint`

### New Actions

```typescript
// Scene nodes
addNode: (position: [number, number, number]) => void;
removeNode: (id: string) => void;
updateNode: (id: string, updates: Partial<SceneNode>) => void;
selectNode: (id: string | null) => void;

// Edges
addEdge: (from: string, to: string) => void;
removeEdge: (from: string, to: string) => void;

// Layers
setLayerEnabled: (layer: keyof Layers, enabled: boolean) => void;
setLayerIntensity: (layer: keyof Layers, intensity: number) => void;
setLayerColor: (layer: keyof Layers, color: string | undefined) => void;
setLayerParam: (layer: keyof Layers, param: string, value: number) => void;

// Modulations
addModulation: (mod: Modulation) => void;
removeModulation: (target: string) => void;
updateModulation: (target: string, updates: Partial<Modulation>) => void;

// Snapshots & sequencer
takeSnapshot: (name: string) => void;
loadSnapshot: (id: string) => void;
deleteSnapshot: (id: string) => void;
addConnection: (from: string, to: string, trigger: Trigger) => void;
removeConnection: (id: string) => void;
updateConnection: (id: string, updates: Partial<SceneConnection>) => void;
setPlaying: (playing: boolean) => void;

// Kept from current
setPreset: (preset: MeshPreset) => void;
setBreathe: (v: number) => void;
setPulseSpeed: (v: number) => void;
setTempo: (v: number) => void;
setPalette: (colors: string[]) => void;
randomizeSeed: () => void;
togglePostFX: (effect: keyof PostFX) => void;
addImagePlane: (url: string, position: [number, number, number]) => void;
removeImagePlane: (id: string) => void;
updateImagePlane: (id: string, transform: Partial<ImagePlane>) => void;
clearAll: () => void;
```

### Undo/Redo

Zustand `zundo` temporal middleware wraps the store. Provides `undo()` and `redo()` via `useTemporalStore()`. Keyboard bindings: `Cmd+Z` / `Cmd+Shift+Z`.

---

## 2. Layer Architecture

### Orchestrator

MeshGraph becomes a thin orchestrator:

```tsx
function MeshGraph() {
  const { layers, nodes, edges } = useCreatorStore(selector);
  return (
    <group>
      {layers.spheres.enabled && <SphereCluster />}
      {layers.tendrils.enabled && <TendrilSystem />}
      {layers.dust.enabled && <DustCloud />}
      {layers.splatter.enabled && <SplatterParticles />}
      {layers.nebula.enabled && <NebulaCloud />}
      {layers.flow.enabled && <FlowParticles />}
      {layers.wireframe.enabled && <WireframeEdges />}
      {layers.halos.enabled && <HaloRings />}
      {layers.lightRays.enabled && <LightRays />}
    </group>
  );
}
```

### Layer Component Contract

Each layer component:
- Reads its own `layers.[name]` config from store (enabled, intensity, color, params)
- Reads `nodes` and `edges` for positioning
- Reads `palette` as fallback when no color override
- Handles its own animation in `useFrame()`
- Respects `AdaptiveQuality` tier for particle/instance counts
- Reads modulated values from `ModulationEngine` ref instead of raw store values when modulations are active

### Launch Layers

**SphereCluster** (refactored from current MeshGraph internals):
- InstancedMesh with MeshPhysicalMaterial
- Params: `countPerVertex` (1-100), `sizeMin` (0.5-5), `sizeMax` (5-30), `scatterRadius` (5-60), `metalness` (0-1), `roughness` (0-1), `transmission` (0-1), `iridescence` (0-1), `emissiveIntensity` (0-2)

**TendrilSystem:**
- TubeGeometry curves growing along edges between connected nodes
- Params: `thickness` (0.5-5), `branchCount` (1-8), `growthSpeed` (0.1-3), `glowIntensity` (0-2)
- Animated: tubes grow over time, subtle undulation

**DustCloud:**
- Points material, dense particle fog concentrated around node positions
- Params: `density` (100-5000), `particleSize` (0.5-4), `drift` (0-2), `opacity` (0-1)
- Denser than ambient ParticleField, tied to cluster positions

**SplatterParticles:**
- Billboard sprites with paint-splat textures
- Params: `count` (10-500), `size` (2-20), `spread` (10-100), `splashiness` (0-1)
- Yellow/orange default color (moodboard reference), random rotation per sprite

### Scaffolded Stubs

NebulaCloud, FlowParticles, WireframeEdges, HaloRings, LightRays — each exports a component returning `null` with the expected param interface typed. Store and panel are ready for them.

---

## 3. UI Layout

### Dual Panel Structure

```
+--------------------------------------------------+----------+
|                                                  |          |
|                  VIEWPORT                        |  RIGHT   |
|              (3D R3F canvas)                     |  PANEL   |
|                                                  |  240px   |
|                                                  |          |
+--------------------------------------------------+          |
|====== drag-to-resize handle ======================|          |
+--------------------------------------------------+          |
|  SCENES |  [scene graph canvas]                  |          |
|  [play] |  node1 --2s--> node2                   |          |
|         |       \--tap--> node3                  |          |
+--------------------------------------------------+----------+
```

### Right Panel Sections

1. **SCENE PRESETS** — horizontal pill buttons (Deep Sea, Cosmos, Laboratory, Bioluminescence, Electric)
2. **LAYERS** — collapsible list, each layer row shows: expand arrow, name, intensity bar, ON/OFF toggle. Expanded: 2-column grid of param sliders + modulation icon per slider
3. **PALETTE** — 5 gradient circles, click to apply. Active state: ring border
4. **EFFECTS** — pill toggles (Bloom, Chromatic, Vignette, DOF, Grain, Tone Map, Motion Blur)
5. **ACTIONS** — Shuffle + Snapshot buttons

### Bottom Sequencer Panel

- Transport column (60px): SCENES label + play/pause button
- Scene graph canvas (remaining width): draggable scene nodes with connection edges
- Nodes show: scene number label, name, active layers summary
- Connections show: dashed lines with trigger badge (time, click, threshold) at midpoint
- "+" ghost node at the end invites adding scenes
- Progressive: hidden (0px) until second snapshot created

### Resize

- Horizontal drag handle between viewport and bottom panel
- Min bottom panel: 80px, max: 50% of viewport height
- Right panel: fixed 240px (matches current)

---

## 4. Free-Form 3D Canvas Interaction

### Object Placement

- Click empty viewport space → raycast to invisible ground plane (z=0) → `addNode()` at hit position
- New nodes spawn with default sphere cluster using current layer/palette settings

### Object Manipulation

- **Drag** cluster → move on XY plane (flat, Figma-like)
- **Scroll on cluster** → scale up/down
- **Shift+drag** → rotate (subtle, future-proofed)
- **Right-click** → delete with fade-out animation
- **Drag from cluster to cluster** → create a scene edge (tendrils/wireframe render along these edges). These are 3D scene edges, not sequencer connections.

### Physics Flavor

- Drop after drag: gentle spring settle (overshoot + ease-back, ~200ms)
- Mouse proximity: soft repel on individual spheres within a cluster radius
- Idle: subtle drift/breathing on all spheres (driven by `breathe` param)

### Direct Manipulation

Hover a cluster + modifier keys for contextual parameter changes:
- No modifier + scroll: scale
- Alt + scroll: intensity of dominant layer
- Cmd + scroll: scatter radius

### Camera

- Default: parallax mouse tracking (current, +-15px offset, 0.08 easing)
- Alt+drag: orbit (current OrbitControls)
- Scroll on empty space: zoom
- Double-click empty space: reset to `[0, 0, 500]`

### Implementation

R3F event system: `onPointerDown`, `onPointerMove`, `onPointerUp` on mesh groups. `useThree()` raycaster for empty-space clicks. No SVG overlay. All interaction in `SceneInteraction.tsx`.

---

## 5. Live Modulation System

### Oscillator Presets

| Preset | Behavior | Use case |
|--------|----------|----------|
| `breathe` | Smooth sine wave | Organic pulsing, scale/opacity |
| `pulse` | Steep sine (square-ish) | Rhythmic on/off, strobing |
| `random` | Perlin-interpolated noise | Organic drift, unpredictable life |

### UI

- Every slider in the right panel has a small modulation icon
- Click icon → cycle: none → breathe → pulse → random
- When active, slider thumb oscillates visually
- Per-modulation sub-params: **speed** (0.1-5 Hz) and **amplitude** (0-100% of slider range)

### Engine

`ModulationEngine.tsx` — a `useFrame()` loop that:
1. Reads all active `modulations[]` from store
2. Computes current oscillator value based on elapsed time + preset type
3. Writes results to a shared ref (`modulatedValues`)
4. Layer components read from `modulatedValues` ref when modulations are active, falling back to raw store values when not

Store values remain the "center point" — modulation oscillates around them.

### Future Extensions

Audio input, MIDI CC, tap-tempo — each is just a new `ModulationPreset` type that plugs into the same system. Not in V2 scope.

---

## 6. Snapshot & Scene Sequencer

### Snapshots

A snapshot captures the full store state (nodes, edges, layers, palette, postFX, modulations) minus undo history.

**Auto-snapshot triggers:**
- Loading a scene preset
- Significant parameter changes (debounced, 5s of no changes)

**Manual snapshot:** "Snapshot" button in right panel → names the snapshot (default: "Scene N")

### Scene Graph

Snapshots are the atoms of the sequencer. Each scene node in the bottom panel IS a snapshot.

**Data model:** `snapshots[]` + `connections[]` in the store (see types in Section 1).

### Bottom Panel Interaction

- Scene nodes: draggable cards in a 2D canvas (pan with middle-click, zoom with scroll)
- Drag from output port to input port → creates connection
- Click trigger badge on connection → popover to pick trigger type + params
- Click scene node → loads snapshot into viewport for editing
- Double-click scene node → rename
- Right-click scene node → delete (confirms if connections exist)

### Playback

- Play button → starts at `activeSnapshotId`
- Trigger fires → crossfade to target snapshot over `transition.duration`
- Crossfade: lerp all numeric params, fade layers in/out by opacity
- Branch: first trigger to fire wins
- No outgoing connections: loop current scene (configurable: loop/stop)
- Pause: freezes at current interpolation state

### Progressive Disclosure

Bottom panel hidden (0px) until second snapshot is created. First snapshot saves silently. Second snapshot reveals the sequencer with both nodes + auto-created time connection (3s default).

---

## 7. Save & Export

### Scene State (JSON) — ships with spine

- `Cmd+S` serializes full store to JSON
- Stored in `localStorage` keyed by UUID scene ID
- Load picker: list of saved scenes with name, timestamp, palette preview
- Future: backend sync when Ergon has accounts

### Video Export — ships after launch layers

- "Record" button in actions bar
- `MediaRecorder` API on the R3F canvas element
- Records at canvas resolution, outputs WebM
- Red dot indicator + timer during recording
- Scene sequencer playback can be recorded end-to-end
- Auto-stop when sequence ends (or manual stop)

### Embeddable Widget — north star

- "Export as Embed" generates self-contained HTML
- Bundles minimal R3F runtime + scene JSON
- Output: single `.html` file or `<script>` embed tag
- Runs live: interactive, responsive, animating
- "Made with Ergon" watermark links back to platform

---

## 8. File Map

### Delete

- `src/components/creator/DotGrid.tsx`
- `src/components/creator/MeshRenderer.tsx`

### Rewrite

- `src/lib/creator-store.ts` — new types, new actions, zundo middleware
- `src/components/creator/CreatorPage.tsx` — dual-panel layout, collapsible layers, snapshot button
- `src/components/creator/three/MeshGraph.tsx` — thin layer orchestrator

### New Files

- `src/components/creator/three/layers/SphereCluster.tsx`
- `src/components/creator/three/layers/TendrilSystem.tsx`
- `src/components/creator/three/layers/DustCloud.tsx`
- `src/components/creator/three/layers/SplatterParticles.tsx`
- `src/components/creator/three/layers/NebulaCloud.tsx` (stub)
- `src/components/creator/three/layers/FlowParticles.tsx` (stub)
- `src/components/creator/three/layers/WireframeEdges.tsx` (stub)
- `src/components/creator/three/layers/HaloRings.tsx` (stub)
- `src/components/creator/three/layers/LightRays.tsx` (stub)
- `src/components/creator/three/ModulationEngine.tsx`
- `src/components/creator/three/SceneInteraction.tsx`
- `src/components/creator/SequencerPanel.tsx`
- `src/components/creator/SequencerNode.tsx`
- `src/components/creator/SequencerConnection.tsx`

### Unchanged

- `src/components/creator/ThreeRenderer.tsx` (minor: add ModulationEngine + SceneInteraction to children)
- `src/components/creator/three/CameraRig.tsx`
- `src/components/creator/three/ParticleField.tsx`
- `src/components/creator/three/PostStack.tsx`
- `src/components/creator/three/AdaptiveQuality.tsx`
- `src/components/creator/three/shaders/*`

---

## Constraints

- `npm run build` must pass at every step
- `npx vitest run` — all tests stay green
- Current PBR sphere rendering is the foundation — refactor into SphereCluster, don't rewrite from scratch
- Respect AdaptiveQuality tiers in all new layer components
- No grid/dot paradigm remnants — clean removal of GridPoint, DotGrid, initGrid, col/row
