# Plan: Dot Grid Creator — The New Creative Tool

**Date:** 2026-04-11
**Status:** Building

---

## Vision

A grid of dots. You click to connect them. The connections form shapes. The shapes come alive.

This replaces the template/recipe picker as the primary creative experience. Instead of choosing from a menu, you BUILD your art by connecting dots on a grid.

## The Interaction

1. Dark screen filled with a grid of evenly-spaced dots (subtle, like graph paper)
2. Click a dot to start — it highlights
3. Click another dot — an edge connects them
4. Keep clicking — edges form faces/shapes
5. The shape you've built starts auto-animating:
   - Vertices breathe with noise displacement
   - Edges pulse with energy
   - Faces can extrude into 3D
   - Particles flow along edges
6. Shared drivers (palette, tempo) control the look and energy
7. You can keep adding more connections — the form grows

## Architecture

This is a NEW page/component, not a modification of the existing template system.

### New Files

1. `src/components/creator/DotGrid.tsx` — The grid of interactive dots
2. `src/components/creator/MeshRenderer.tsx` — WEBGL renderer that animates the user's mesh
3. `src/components/creator/CreatorPage.tsx` — Full-screen creator experience
4. `src/lib/creator-store.ts` — Zustand store for grid state, connections, animation
5. `src/app/create/page.tsx` — Route at /create

### Types

```typescript
type GridPoint = {
  id: string;        // "x-y" format
  x: number;         // grid position
  y: number;
  worldX: number;    // pixel position
  worldY: number;
};

type Edge = {
  from: string;      // point id
  to: string;        // point id
};

type CreatorState = {
  // Grid
  gridSize: number;           // e.g. 20 = 20x20 grid
  points: GridPoint[];
  edges: Edge[];
  selectedPoint: string | null;

  // Animation
  animating: boolean;
  breatheAmount: number;      // noise displacement strength
  pulseSpeed: number;         // edge pulse speed
  extrudeDepth: number;       // 3D extrusion (0 = flat)

  // Shared drivers
  palette: string[];
  tempo: number;
  seed: number;

  // Actions
  selectPoint: (id: string) => void;
  addEdge: (from: string, to: string) => void;
  removeEdge: (from: string, to: string) => void;
  clearAll: () => void;
  setBreath: (amount: number) => void;
  setPulseSpeed: (speed: number) => void;
  setExtrudeDepth: (depth: number) => void;
};
```

### Rendering

The creator has TWO layers:
1. **Grid overlay** (HTML/SVG) — the dots and click targets. Always visible but subtle.
2. **WEBGL canvas** (p5.js or raw WebGL) — renders the animated mesh behind the grid.

When no connections exist, the grid is the only thing visible.
As you connect dots, the animated mesh appears and grows.

### Animation Behaviors

Connected vertices animate with:
- **Breathe**: vertices oscillate position using Perlin noise (like Organism)
- **Pulse**: edges glow/fade in waves traveling along the edge
- **Color**: vertices/edges colored from shared palette
- **Extrude**: connected faces (triangles) can push into 3D space
- **Particles**: optional particles flowing along edges

### Implementation Tasks

#### Task 1: Creator store
- Zustand store with grid, edges, selection, animation state
- Grid generation (NxN points with world positions)
- Edge add/remove logic
- Shared driver state

#### Task 2: DotGrid component
- Render grid of dots as SVG circles
- Click to select a dot (highlights it)
- Click second dot to create edge
- Visual feedback: hover states, selection glow, edge lines
- Dark background, subtle dot color (#333), bright when connected

#### Task 3: MeshRenderer (WEBGL)
- p5.js WEBGL canvas behind the grid
- Reads edges from store
- Animates connected vertices with noise displacement
- Draws edges as lines with pulse effect
- Colors from palette
- Responds to tempo

#### Task 4: CreatorPage
- Full-screen layout: canvas fills screen
- Minimal floating controls at bottom (breathe, pulse, extrude sliders)
- Palette selector
- Tempo slider
- Clear button
- Export button

#### Task 5: Route + navigation
- /create route
- Landing page links to /create (not /studio)
- "Create" button in nav

#### Task 6: Polish + verify
- Test grid interaction
- Test animation
- Build passes
