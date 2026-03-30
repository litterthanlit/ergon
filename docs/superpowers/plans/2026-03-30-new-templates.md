# Eight New Studio Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 new generative art templates to Ergon Studio — Spiral, Waves, Constellation, Terrain, Bloom, Glitch, Mesh, and Aurora — each with complete p5.js code, a typed ParamSchema, and a test file. A final task updates the registry.

**Architecture:** Each template follows the exact pattern established in `src/lib/templates/drift.ts`: a named schema export, a named code export (template literal string of p5.js), and a named Template object export. Tests live in `src/__tests__/templates/`. The registry at `src/lib/templates/registry.ts` is updated once at the end. No other files change.

**Pattern reference:** `src/lib/templates/drift.ts`, `src/lib/templates/weave.ts`

---

## File Structure

```
src/
├── lib/
│   └── templates/
│       ├── registry.ts        # MODIFY — add 8 new imports and entries
│       ├── spiral.ts          # CREATE
│       ├── waves.ts           # CREATE
│       ├── constellation.ts   # CREATE
│       ├── terrain.ts         # CREATE
│       ├── bloom.ts           # CREATE
│       ├── glitch.ts          # CREATE
│       ├── mesh.ts            # CREATE
│       └── aurora.ts          # CREATE
└── __tests__/
    └── templates/
        ├── spiral.test.ts     # CREATE
        ├── waves.test.ts      # CREATE
        ├── constellation.test.ts # CREATE
        ├── terrain.test.ts    # CREATE
        ├── bloom.test.ts      # CREATE
        ├── glitch.test.ts     # CREATE
        ├── mesh.test.ts       # CREATE
        └── aurora.test.ts     # CREATE
```

---

## Task 1: Spiral Template

**File:** `src/lib/templates/spiral.ts`
**Test:** `src/__tests__/templates/spiral.test.ts`

Static logarithmic spiral with click-to-regenerate. The `arms` parameter dramatically changes the shape — 1 gives a classic Fibonacci coil, 8 gives a dense sunflower. `style` switches between dots, lines, and mixed rendering.

- [ ] Create `src/lib/templates/spiral.ts`

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const spiralSchema: ParamSchema = {
  arms: { type: "number", min: 1, max: 8, default: 3, step: 1, label: "Arms" },
  density: { type: "number", min: 50, max: 600, default: 200, step: 10, label: "Density" },
  spread: { type: "number", min: 0.05, max: 0.4, default: 0.18, step: 0.01, label: "Spread" },
  style: { type: "select", options: ["Dots", "Lines", "Mixed"], default: "Mixed", label: "Style" },
  palette: { type: "select", options: ["Gold", "Ice", "Ember", "Mono", "Botanical"], default: "Gold", label: "Palette" },
};

export const spiralCode = `
const palettes = {
  Gold:      ['#c8a951', '#e8c97a', '#f5e6b2', '#8b6914', '#3d2e07'],
  Ice:       ['#a8dadc', '#457b9d', '#1d3557', '#f1faee', '#e0fbfc'],
  Ember:     ['#e63946', '#f4a261', '#e76f51', '#264653', '#2a9d8f'],
  Mono:      ['#111111', '#444444', '#777777', '#aaaaaa', '#dddddd'],
  Botanical: ['#386641', '#6a994e', '#a7c957', '#bc4749', '#f2e8cf'],
};

const params = ergon.params({
  arms:    { type: 'number', min: 1, max: 8, default: 3, step: 1, label: 'Arms' },
  density: { type: 'number', min: 50, max: 600, default: 200, step: 10, label: 'Density' },
  spread:  { type: 'number', min: 0.05, max: 0.4, default: 0.18, step: 0.01, label: 'Spread' },
  style:   { type: 'select', options: ['Dots', 'Lines', 'Mixed'], default: 'Mixed', label: 'Style' },
  palette: { type: 'select', options: ['Gold', 'Ice', 'Ember', 'Mono', 'Botanical'], default: 'Gold', label: 'Palette' },
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function draw() {
  background(15);
  const colors = palettes[params.palette] || palettes.Gold;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = min(width, height) * 0.46;

  for (let arm = 0; arm < params.arms; arm++) {
    const armOffset = (TWO_PI / params.arms) * arm;
    for (let i = 0; i < params.density; i++) {
      const t = i / params.density;
      const angle = t * TWO_PI * 5 + armOffset;
      const r = maxR * pow(t, params.spread * 5);
      const x = cx + cos(angle) * r;
      const y = cy + sin(angle) * r;
      const c = colors[floor(t * colors.length)];

      if (params.style === 'Lines' || (params.style === 'Mixed' && i > 0)) {
        const prevT = (i - 1) / params.density;
        const prevAngle = prevT * TWO_PI * 5 + armOffset;
        const prevR = maxR * pow(prevT, params.spread * 5);
        const px = cx + cos(prevAngle) * prevR;
        const py = cy + sin(prevAngle) * prevR;
        stroke(c);
        strokeWeight(1.2);
        noFill();
        line(px, py, x, y);
      }
      if (params.style === 'Dots' || params.style === 'Mixed') {
        noStroke();
        fill(c);
        const dotSize = map(t, 0, 1, 1.5, 5);
        circle(x, y, dotSize);
      }
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); redraw(); }
function mousePressed() { randomSeed(millis()); noiseSeed(millis()); redraw(); }
`;

export const spiral: Template = {
  id: "spiral",
  name: "Spiral",
  description: "Logarithmic spirals branching into arms. Click to shift the seed.",
  schema: spiralSchema,
  code: spiralCode,
};
```

- [ ] Create `src/__tests__/templates/spiral.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { spiral } from "@/lib/templates/spiral";
import { validateParamSchema } from "@/lib/types";

describe("spiral template", () => {
  it("has required metadata", () => {
    expect(spiral.name).toBe("Spiral");
    expect(spiral.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(spiral.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(spiral.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

---

## Task 2: Waves Template

**File:** `src/lib/templates/waves.ts`
**Test:** `src/__tests__/templates/waves.test.ts`

Animated overlapping sine waves that create interference patterns. `layers` is the dramatic param — going from 2 to 12 shifts between clean ripples and a churning moiré. `speed` controls animation rate. `waveform` selects sine, square, or sawtooth character.

- [ ] Create `src/lib/templates/waves.ts`

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const wavesSchema: ParamSchema = {
  layers: { type: "number", min: 2, max: 12, default: 5, step: 1, label: "Layers" },
  amplitude: { type: "number", min: 10, max: 120, default: 40, step: 5, label: "Amplitude" },
  speed: { type: "number", min: 0.2, max: 4.0, default: 1.0, step: 0.1, label: "Speed" },
  waveform: { type: "select", options: ["Sine", "Square", "Sawtooth", "Noise"], default: "Sine", label: "Waveform" },
  palette: { type: "select", options: ["Ocean", "Lava", "Void", "Prism", "Dusk"], default: "Ocean", label: "Palette" },
};

export const wavesCode = `
const palettes = {
  Ocean:  ['#03045e', '#023e8a', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
  Lava:   ['#03071e', '#370617', '#6a040f', '#d00000', '#f48c06', '#ffba08'],
  Void:   ['#10002b', '#240046', '#3c096c', '#7b2d8b', '#c77dff', '#e0aaff'],
  Prism:  ['#ff006e', '#fb5607', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0'],
  Dusk:   ['#2d1b69', '#11998e', '#38ef7d', '#fc4a1a', '#f7b733', '#c94b4b'],
};

const params = ergon.params({
  layers:    { type: 'number', min: 2, max: 12, default: 5, step: 1, label: 'Layers' },
  amplitude: { type: 'number', min: 10, max: 120, default: 40, step: 5, label: 'Amplitude' },
  speed:     { type: 'number', min: 0.2, max: 4.0, default: 1.0, step: 0.1, label: 'Speed' },
  waveform:  { type: 'select', options: ['Sine', 'Square', 'Sawtooth', 'Noise'], default: 'Sine', label: 'Waveform' },
  palette:   { type: 'select', options: ['Ocean', 'Lava', 'Void', 'Prism', 'Dusk'], default: 'Ocean', label: 'Palette' },
});

let t = 0;

function waveY(x, layer, time) {
  const freq = 0.004 + layer * 0.002;
  const phase = time * params.speed + layer * 0.7;
  const raw = x * freq + phase;
  if (params.waveform === 'Sine') return sin(raw);
  if (params.waveform === 'Square') return raw % TWO_PI < PI ? 1 : -1;
  if (params.waveform === 'Sawtooth') return (raw % TWO_PI) / PI - 1;
  return noise(x * freq * 0.5, time * 0.3 + layer * 0.4) * 2 - 1;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);
}

function draw() {
  background(10, 10, 20, 40);
  t += 0.016;
  const colors = palettes[params.palette] || palettes.Ocean;

  for (let layer = 0; layer < params.layers; layer++) {
    const yBase = map(layer, 0, params.layers - 1, height * 0.2, height * 0.8);
    const c = colors[layer % colors.length];
    stroke(c);
    strokeWeight(1.5);
    noFill();

    beginShape();
    for (let x = 0; x <= width; x += 3) {
      const y = yBase + waveY(x, layer, t) * params.amplitude;
      vertex(x, y);
    }
    endShape();
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
`;

export const waves: Template = {
  id: "waves",
  name: "Waves",
  description: "Overlapping waveforms create interference patterns that breathe and shift.",
  schema: wavesSchema,
  code: wavesCode,
};
```

- [ ] Create `src/__tests__/templates/waves.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { waves } from "@/lib/templates/waves";
import { validateParamSchema } from "@/lib/types";

describe("waves template", () => {
  it("has required metadata", () => {
    expect(waves.name).toBe("Waves");
    expect(waves.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(waves.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(waves.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

---

## Task 3: Constellation Template

**File:** `src/lib/templates/constellation.ts`
**Test:** `src/__tests__/templates/constellation.test.ts`

Random star field with proximity-based connection lines. `threshold` is the dramatic param — small values show isolated stars, large values create a dense web. `starSize` and `glow` add atmosphere. Click to scatter a new field.

- [ ] Create `src/lib/templates/constellation.ts`

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const constellationSchema: ParamSchema = {
  stars: { type: "number", min: 20, max: 300, default: 80, step: 5, label: "Stars" },
  threshold: { type: "number", min: 30, max: 250, default: 120, step: 5, label: "Link Distance" },
  starSize: { type: "number", min: 1, max: 6, default: 2, step: 0.5, label: "Star Size" },
  palette: { type: "select", options: ["Night", "Nebula", "Dawn", "Void", "Coral"], default: "Night", label: "Palette" },
};

export const constellationCode = `
const palettes = {
  Night:  { bg: '#0a0a1a', star: '#ffffff', line: '#334477' },
  Nebula: { bg: '#08001a', star: '#e0aaff', line: '#7b2d8b' },
  Dawn:   { bg: '#0d1b2a', star: '#f5cba7', line: '#c0392b' },
  Void:   { bg: '#000000', star: '#cccccc', line: '#333333' },
  Coral:  { bg: '#0d1b2a', star: '#ff6b6b', line: '#c0392b' },
};

const params = ergon.params({
  stars:     { type: 'number', min: 20, max: 300, default: 80, step: 5, label: 'Stars' },
  threshold: { type: 'number', min: 30, max: 250, default: 120, step: 5, label: 'Link Distance' },
  starSize:  { type: 'number', min: 1, max: 6, default: 2, step: 0.5, label: 'Star Size' },
  palette:   { type: 'select', options: ['Night', 'Nebula', 'Dawn', 'Void', 'Coral'], default: 'Night', label: 'Palette' },
});

let pts = [];

function scatter() {
  pts = [];
  for (let i = 0; i < params.stars; i++) {
    pts.push({ x: random(width), y: random(height), r: random(0.4, 1.0) });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
  scatter();
}

function draw() {
  const pal = palettes[params.palette] || palettes.Night;
  background(pal.bg);

  // Draw lines first
  stroke(pal.line);
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = dist(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
      if (d < params.threshold) {
        strokeWeight(map(d, 0, params.threshold, 1.0, 0.1));
        line(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
      }
    }
  }

  // Draw stars on top
  noStroke();
  for (const p of pts) {
    fill(pal.star);
    const sz = params.starSize * p.r;
    circle(p.x, p.y, sz * 2);
    // soft glow
    fill(pal.star + '33');
    circle(p.x, p.y, sz * 5);
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); scatter(); redraw(); }
function mousePressed() { scatter(); redraw(); }
`;

export const constellation: Template = {
  id: "constellation",
  name: "Constellation",
  description: "Stars connected by proximity. Adjust link distance to find hidden shapes.",
  schema: constellationSchema,
  code: constellationCode,
};
```

- [ ] Create `src/__tests__/templates/constellation.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { constellation } from "@/lib/templates/constellation";
import { validateParamSchema } from "@/lib/types";

describe("constellation template", () => {
  it("has required metadata", () => {
    expect(constellation.name).toBe("Constellation");
    expect(constellation.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(constellation.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(constellation.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

---

## Task 4: Terrain Template

**File:** `src/lib/templates/terrain.ts`
**Test:** `src/__tests__/templates/terrain.test.ts`

Animated wireframe terrain rendered as a perspective grid using Perlin noise. `roughness` is the dramatic param — it goes from gently rolling hills to jagged mountain peaks. `rotation` controls how fast the terrain drifts forward. `view` selects flat-top, angled, or bird's-eye projection.

- [ ] Create `src/lib/templates/terrain.ts`

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const terrainSchema: ParamSchema = {
  roughness: { type: "number", min: 20, max: 300, default: 100, step: 10, label: "Roughness" },
  resolution: { type: "number", min: 5, max: 30, default: 15, step: 1, label: "Resolution" },
  speed: { type: "number", min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: "Speed" },
  view: { type: "select", options: ["Flight", "Angled", "Top"], default: "Flight", label: "View" },
  palette: { type: "select", options: ["Matrix", "Topo", "Arctic", "Magma", "Wire"], default: "Matrix", label: "Palette" },
};

export const terrainCode = `
const palettes = {
  Matrix: { bg: '#000a00', low: '#003300', high: '#00ff41', stroke: '#00ff41' },
  Topo:   { bg: '#0a0a14', low: '#264653', high: '#2a9d8f', stroke: '#e9c46a' },
  Arctic: { bg: '#0d1b2a', low: '#1d3557', high: '#a8dadc', stroke: '#f1faee' },
  Magma:  { bg: '#0a0000', low: '#370617', high: '#f48c06', stroke: '#ffba08' },
  Wire:   { bg: '#111111', low: '#222222', high: '#888888', stroke: '#ffffff' },
};

const params = ergon.params({
  roughness:  { type: 'number', min: 20, max: 300, default: 100, step: 10, label: 'Roughness' },
  resolution: { type: 'number', min: 5, max: 30, default: 15, step: 1, label: 'Resolution' },
  speed:      { type: 'number', min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: 'Speed' },
  view:       { type: 'select', options: ['Flight', 'Angled', 'Top'], default: 'Flight', label: 'View' },
  palette:    { type: 'select', options: ['Matrix', 'Topo', 'Arctic', 'Magma', 'Wire'], default: 'Matrix', label: 'Palette' },
});

let yOffset = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();
}

function projectPoint(gx, gz, elevation) {
  const cx = width / 2;
  if (params.view === 'Top') {
    return { x: gx, y: gz, z: elevation };
  }
  const tiltFactor = params.view === 'Flight' ? 0.55 : 0.35;
  const fov = 600;
  const camY = -height * tiltFactor;
  const camZ = -fov;
  const relZ = gz - camZ;
  const scale = fov / max(relZ, 1);
  return {
    x: cx + (gx - cx) * scale,
    y: height * 0.5 + (camY + elevation) * scale,
    z: elevation,
  };
}

function draw() {
  const pal = palettes[params.palette] || palettes.Matrix;
  background(pal.bg);

  const cols = params.resolution;
  const rows = params.resolution;
  const cellW = width / cols;
  const cellH = height / rows;

  yOffset += params.speed;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellW;
      const z = row * cellH;
      const elevation = noise(col * 0.15, row * 0.15 + yOffset) * params.roughness - params.roughness * 0.5;
      const t = map(elevation, -params.roughness * 0.5, params.roughness * 0.5, 0, 1);
      stroke(lerpColor(color(pal.low), color(pal.high), t));
      strokeWeight(0.8);

      const p = projectPoint(x, z, -elevation);
      if (col < cols - 1) {
        const rVal = noise((col + 1) * 0.15, row * 0.15 + yOffset) * params.roughness - params.roughness * 0.5;
        const rT = map(rVal, -params.roughness * 0.5, params.roughness * 0.5, 0, 1);
        stroke(lerpColor(color(pal.low), color(pal.high), (t + rT) * 0.5));
        const pr = projectPoint(x + cellW, z, -rVal);
        line(p.x, p.y, pr.x, pr.y);
      }
      if (row < rows - 1) {
        const dVal = noise(col * 0.15, (row + 1) * 0.15 + yOffset) * params.roughness - params.roughness * 0.5;
        const dT = map(dVal, -params.roughness * 0.5, params.roughness * 0.5, 0, 1);
        stroke(lerpColor(color(pal.low), color(pal.high), (t + dT) * 0.5));
        const pd = projectPoint(x, z + cellH, -dVal);
        line(p.x, p.y, pd.x, pd.y);
      }
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
`;

export const terrain: Template = {
  id: "terrain",
  name: "Terrain",
  description: "Noise-driven wireframe landscape scrolling toward you forever.",
  schema: terrainSchema,
  code: terrainCode,
};
```

- [ ] Create `src/__tests__/templates/terrain.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { terrain } from "@/lib/templates/terrain";
import { validateParamSchema } from "@/lib/types";

describe("terrain template", () => {
  it("has required metadata", () => {
    expect(terrain.name).toBe("Terrain");
    expect(terrain.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(terrain.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(terrain.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

---

## Task 5: Bloom Template

**File:** `src/lib/templates/bloom.ts`
**Test:** `src/__tests__/templates/bloom.test.ts`

Generative radial flowers drawn with petal curves. `petals` is the dramatic param — 3 gives a lily, 8 a dahlia, 24 a mandala-like disc. `layers` adds nested rings of petals at scaled radii. Click to regenerate with a new random seed.

- [ ] Create `src/lib/templates/bloom.ts`

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const bloomSchema: ParamSchema = {
  petals: { type: "number", min: 3, max: 24, default: 8, step: 1, label: "Petals" },
  layers: { type: "number", min: 1, max: 5, default: 3, step: 1, label: "Layers" },
  curvature: { type: "number", min: 0.1, max: 1.5, default: 0.7, step: 0.05, label: "Curvature" },
  style: { type: "select", options: ["Outline", "Filled", "Gradient", "Lace"], default: "Filled", label: "Style" },
  palette: { type: "select", options: ["Cherry", "Iris", "Sunflower", "Midnight", "Sage"], default: "Cherry", label: "Palette" },
};

export const bloomCode = `
const palettes = {
  Cherry:    ['#ffccd5', '#ff8fa3', '#ff758f', '#c9184a', '#590d22'],
  Iris:      ['#e0aaff', '#c77dff', '#9d4edd', '#7b2d8b', '#3c096c'],
  Sunflower: ['#fff3b0', '#fee440', '#f7b731', '#e07b00', '#8b4513'],
  Midnight:  ['#10002b', '#240046', '#3c096c', '#7b2d8b', '#c77dff'],
  Sage:      ['#d8f3dc', '#b7e4c7', '#74c69d', '#40916c', '#1b4332'],
};

const params = ergon.params({
  petals:    { type: 'number', min: 3, max: 24, default: 8, step: 1, label: 'Petals' },
  layers:    { type: 'number', min: 1, max: 5, default: 3, step: 1, label: 'Layers' },
  curvature: { type: 'number', min: 0.1, max: 1.5, default: 0.7, step: 0.05, label: 'Curvature' },
  style:     { type: 'select', options: ['Outline', 'Filled', 'Gradient', 'Lace'], default: 'Filled', label: 'Style' },
  palette:   { type: 'select', options: ['Cherry', 'Iris', 'Sunflower', 'Midnight', 'Sage'], default: 'Cherry', label: 'Palette' },
});

let seed = 42;

function drawPetal(cx, cy, angle, r, colorIdx, colors) {
  const ctrl = r * params.curvature;
  const x1 = cx + cos(angle - 0.5) * r;
  const y1 = cy + sin(angle - 0.5) * r;
  const x2 = cx + cos(angle + 0.5) * r;
  const y2 = cy + sin(angle + 0.5) * r;
  const cpx = cx + cos(angle) * r * 1.6 + cos(angle + HALF_PI) * ctrl;
  const cpy = cy + sin(angle) * r * 1.6 + sin(angle + HALF_PI) * ctrl;
  const cpx2 = cx + cos(angle) * r * 1.6 - cos(angle + HALF_PI) * ctrl;
  const cpy2 = cy + sin(angle) * r * 1.6 - sin(angle + HALF_PI) * ctrl;

  const c = colors[colorIdx % colors.length];
  if (params.style === 'Outline' || params.style === 'Lace') {
    noFill();
    stroke(c);
    strokeWeight(params.style === 'Lace' ? 0.8 : 1.5);
  } else {
    fill(c + (params.style === 'Gradient' ? '99' : 'cc'));
    stroke(c);
    strokeWeight(0.8);
  }

  beginShape();
  vertex(cx, cy);
  bezierVertex(x1, y1, cpx, cpy, cx + cos(angle) * r * 1.6, cy + sin(angle) * r * 1.6);
  bezierVertex(cpx2, cpy2, x2, y2, cx, cy);
  endShape(CLOSE);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function draw() {
  randomSeed(seed);
  background(12);
  const colors = palettes[params.palette] || palettes.Cherry;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = min(width, height) * 0.38;

  for (let layer = params.layers; layer >= 1; layer--) {
    const r = (maxR / params.layers) * layer;
    const petalCount = params.petals * (params.style === 'Lace' ? 2 : 1);
    const offset = random(TWO_PI);
    for (let i = 0; i < petalCount; i++) {
      const angle = (TWO_PI / petalCount) * i + offset;
      drawPetal(cx, cy, angle, r, layer + i, colors);
    }
  }
  // centre circle
  noStroke();
  fill(colors[0]);
  circle(cx, cy, maxR * 0.12);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); redraw(); }
function mousePressed() { seed = millis(); redraw(); }
`;

export const bloom: Template = {
  id: "bloom",
  name: "Bloom",
  description: "Generative flowers from bezier petals. Click to grow a new specimen.",
  schema: bloomSchema,
  code: bloomCode,
};
```

- [ ] Create `src/__tests__/templates/bloom.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { bloom } from "@/lib/templates/bloom";
import { validateParamSchema } from "@/lib/types";

describe("bloom template", () => {
  it("has required metadata", () => {
    expect(bloom.name).toBe("Bloom");
    expect(bloom.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(bloom.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(bloom.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

---

## Task 6: Glitch Template

**File:** `src/lib/templates/glitch.ts`
**Test:** `src/__tests__/templates/glitch.test.ts`

Animated glitch effect: geometric rectangles are rendered with scanline displacement and RGB channel splitting. `intensity` is the dramatic param — at low values the geometry is recognisable, at max it falls apart completely. `frequency` controls how often a new glitch burst fires.

- [ ] Create `src/lib/templates/glitch.ts`

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const glitchSchema: ParamSchema = {
  intensity: { type: "number", min: 1, max: 60, default: 20, step: 1, label: "Intensity" },
  frequency: { type: "number", min: 0.01, max: 0.5, default: 0.1, step: 0.01, label: "Frequency" },
  scanlines: { type: "boolean", default: true, label: "Scanlines" },
  shape: { type: "select", options: ["Rects", "Grid", "Bars", "Cross"], default: "Rects", label: "Shape" },
  palette: { type: "select", options: ["VHS", "Terminal", "Infrared", "Cyber", "Grayscale"], default: "VHS", label: "Palette" },
};

export const glitchCode = `
const palettes = {
  VHS:       { bg: '#0a0014', shapes: ['#ff006e', '#3a86ff', '#ffbe0b', '#ffffff'] },
  Terminal:  { bg: '#000a00', shapes: ['#00ff41', '#00cc33', '#009922', '#006611'] },
  Infrared:  { bg: '#000000', shapes: ['#ff0000', '#ff4400', '#ff8800', '#ffcc00'] },
  Cyber:     { bg: '#000010', shapes: ['#00ffff', '#0088ff', '#8800ff', '#ff00ff'] },
  Grayscale: { bg: '#111111', shapes: ['#ffffff', '#aaaaaa', '#666666', '#333333'] },
};

const params = ergon.params({
  intensity: { type: 'number', min: 1, max: 60, default: 20, step: 1, label: 'Intensity' },
  frequency: { type: 'number', min: 0.01, max: 0.5, default: 0.1, step: 0.01, label: 'Frequency' },
  scanlines: { type: 'boolean', default: true, label: 'Scanlines' },
  shape:     { type: 'select', options: ['Rects', 'Grid', 'Bars', 'Cross'], default: 'Rects', label: 'Shape' },
  palette:   { type: 'select', options: ['VHS', 'Terminal', 'Infrared', 'Cyber', 'Grayscale'], default: 'VHS', label: 'Palette' },
});

let glitchBands = [];
let glitchTimer = 0;

function fireGlitch() {
  glitchBands = [];
  const count = floor(random(3, 10));
  for (let i = 0; i < count; i++) {
    glitchBands.push({
      y: random(height),
      h: random(2, params.intensity * 1.5),
      dx: random(-params.intensity * 2, params.intensity * 2),
      life: random(3, 12),
    });
  }
}

function drawShapes(colors) {
  const cols = params.shape === 'Grid' ? 6 : params.shape === 'Bars' ? 12 : 4;
  const rows = params.shape === 'Bars' ? cols : floor(cols * (height / width));
  const cw = width / cols;
  const ch = height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw;
      const y = r * ch;
      fill(colors[floor((r + c) % colors.length)] + 'cc');
      noStroke();
      if (params.shape === 'Cross') {
        rect(x + cw * 0.35, y, cw * 0.3, ch);
        rect(x, y + ch * 0.35, cw, ch * 0.3);
      } else {
        const pad = params.shape === 'Rects' ? random(2, 12) : 1;
        rect(x + pad, y + pad, cw - pad * 2, ch - pad * 2);
      }
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30);
}

function draw() {
  const pal = palettes[params.palette] || palettes.VHS;
  background(pal.bg);
  drawShapes(pal.shapes);

  glitchTimer++;
  if (random() < params.frequency) fireGlitch();

  // apply glitch bands (RGB split effect via layered semi-transparent rects)
  noStroke();
  for (let i = glitchBands.length - 1; i >= 0; i--) {
    const b = glitchBands[i];
    // red channel shift
    fill(255, 0, 80, 60);
    rect(b.dx * 1.3, b.y, width, b.h);
    // blue channel shift
    fill(0, 100, 255, 60);
    rect(-b.dx, b.y + b.h * 0.3, width, b.h);
    // white flash band
    fill(255, 255, 255, 30);
    rect(b.dx, b.y, width, b.h * 0.5);
    b.life--;
    if (b.life <= 0) glitchBands.splice(i, 1);
  }

  if (params.scanlines) {
    noFill();
    stroke(0, 0, 0, 60);
    strokeWeight(1);
    for (let y = 0; y < height; y += 3) {
      line(0, y, width, y);
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
`;

export const glitch: Template = {
  id: "glitch",
  name: "Glitch",
  description: "Geometric shapes corrupted by scanlines, RGB splits, and data errors.",
  schema: glitchSchema,
  code: glitchCode,
};
```

- [ ] Create `src/__tests__/templates/glitch.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { glitch } from "@/lib/templates/glitch";
import { validateParamSchema } from "@/lib/types";

describe("glitch template", () => {
  it("has required metadata", () => {
    expect(glitch.name).toBe("Glitch");
    expect(glitch.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(glitch.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(glitch.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

---

## Task 7: Mesh Template

**File:** `src/lib/templates/mesh.ts`
**Test:** `src/__tests__/templates/mesh.test.ts`

Triangulated grid mesh with Perlin-noise vertex displacement. `displacement` is the dramatic param — at zero it's a perfect grid, at max the mesh becomes an abstract terrain. `showPoints` toggles vertex dots. `fill` switches between wireframe, solid-face, and mixed rendering. Click to re-seed displacement.

- [ ] Create `src/lib/templates/mesh.ts`

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const meshSchema: ParamSchema = {
  cols: { type: "number", min: 4, max: 30, default: 12, step: 1, label: "Columns" },
  displacement: { type: "number", min: 0, max: 120, default: 40, step: 5, label: "Displacement" },
  showPoints: { type: "boolean", default: true, label: "Show Points" },
  fill: { type: "select", options: ["Wire", "Solid", "Mixed", "Gradient"], default: "Mixed", label: "Fill Mode" },
  palette: { type: "select", options: ["Steel", "Copper", "Jade", "Bone", "Neon"], default: "Steel", label: "Palette" },
};

export const meshCode = `
const palettes = {
  Steel:  { bg: '#0d1117', edge: '#8b949e', face: '#21262d', point: '#58a6ff' },
  Copper: { bg: '#0d0800', edge: '#c87941', face: '#3d2010', point: '#f0a060' },
  Jade:   { bg: '#000d08', edge: '#2da44e', face: '#0d2318', point: '#56d364' },
  Bone:   { bg: '#1a1814', edge: '#d4c5a9', face: '#2e2a22', point: '#f5f0e8' },
  Neon:   { bg: '#000010', edge: '#ff006e', face: '#10001a', point: '#fb5607' },
};

const params = ergon.params({
  cols:         { type: 'number', min: 4, max: 30, default: 12, step: 1, label: 'Columns' },
  displacement: { type: 'number', min: 0, max: 120, default: 40, step: 5, label: 'Displacement' },
  showPoints:   { type: 'boolean', default: true, label: 'Show Points' },
  fill:         { type: 'select', options: ['Wire', 'Solid', 'Mixed', 'Gradient'], default: 'Mixed', label: 'Fill Mode' },
  palette:      { type: 'select', options: ['Steel', 'Copper', 'Jade', 'Bone', 'Neon'], default: 'Steel', label: 'Palette' },
});

let nSeed = 0;

function buildGrid() {
  const rows = floor(params.cols * (height / width));
  const cw = width / params.cols;
  const ch = height / rows;
  const pts = [];
  for (let r = 0; r <= rows; r++) {
    const row = [];
    for (let c = 0; c <= params.cols; c++) {
      const bx = c * cw;
      const by = r * ch;
      const dx = noise(c * 0.3 + nSeed, r * 0.3) * 2 - 1;
      const dy = noise(c * 0.3 + nSeed + 100, r * 0.3) * 2 - 1;
      row.push({ x: bx + dx * params.displacement, y: by + dy * params.displacement });
    }
    pts.push(row);
  }
  return { pts, rows };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function draw() {
  const pal = palettes[params.palette] || palettes.Steel;
  background(pal.bg);

  const { pts, rows } = buildGrid();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < params.cols; c++) {
      const a = pts[r][c];
      const b = pts[r][c + 1];
      const d = pts[r + 1][c];
      const e = pts[r + 1][c + 1];
      const t = (r + c) / (rows + params.cols);

      if (params.fill === 'Solid' || params.fill === 'Mixed' || params.fill === 'Gradient') {
        const faceColor = params.fill === 'Gradient'
          ? lerpColor(color(pal.face), color(pal.edge), t)
          : color(pal.face);
        fill(faceColor);
        stroke(pal.edge);
        strokeWeight(0.5);
        triangle(a.x, a.y, b.x, b.y, d.x, d.y);
        triangle(b.x, b.y, e.x, e.y, d.x, d.y);
      }
      if (params.fill === 'Wire' || params.fill === 'Mixed') {
        noFill();
        stroke(pal.edge);
        strokeWeight(params.fill === 'Mixed' ? 0.4 : 1);
        line(a.x, a.y, b.x, b.y);
        line(a.x, a.y, d.x, d.y);
        line(b.x, b.y, d.x, d.y);
      }
    }
  }

  if (params.showPoints) {
    noStroke();
    fill(pal.point);
    for (const row of pts) {
      for (const p of row) {
        circle(p.x, p.y, 4);
      }
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); redraw(); }
function mousePressed() { nSeed = random(1000); redraw(); }
`;

export const mesh: Template = {
  id: "mesh",
  name: "Mesh",
  description: "Triangulated grid warped by noise displacement. Click to shift the warp field.",
  schema: meshSchema,
  code: meshCode,
};
```

- [ ] Create `src/__tests__/templates/mesh.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { mesh } from "@/lib/templates/mesh";
import { validateParamSchema } from "@/lib/types";

describe("mesh template", () => {
  it("has required metadata", () => {
    expect(mesh.name).toBe("Mesh");
    expect(mesh.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(mesh.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(mesh.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

---

## Task 8: Aurora Template

**File:** `src/lib/templates/aurora.ts`
**Test:** `src/__tests__/templates/aurora.test.ts`

Animated flowing color bands that simulate northern lights using layered noise-shaped curves. `bands` is the dramatic param — 2 gives a simple curtain, 8 produces a full polar display. `shimmer` controls how fast the bands ripple. `style` switches between curtain, ribbons, and rays rendering modes.

- [ ] Create `src/lib/templates/aurora.ts`

```typescript
import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const auroraSchema: ParamSchema = {
  bands: { type: "number", min: 2, max: 8, default: 4, step: 1, label: "Bands" },
  shimmer: { type: "number", min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: "Shimmer" },
  opacity: { type: "number", min: 20, max: 120, default: 60, step: 5, label: "Opacity" },
  style: { type: "select", options: ["Curtain", "Ribbons", "Rays", "Veil"], default: "Curtain", label: "Style" },
  palette: { type: "select", options: ["Boreal", "Tropical", "Crimson", "Solar", "Void"], default: "Boreal", label: "Palette" },
};

export const auroraCode = `
const palettes = {
  Boreal:   ['#00ff87', '#00bfff', '#7b2fff', '#ff00c8', '#00ffd5'],
  Tropical: ['#f7971e', '#ffd200', '#00c9ff', '#92fe9d', '#ff6fd8'],
  Crimson:  ['#ff416c', '#ff4b2b', '#f953c6', '#b91d73', '#ff0099'],
  Solar:    ['#f7971e', '#ffd200', '#ff6a00', '#ee0979', '#ff6fd8'],
  Void:     ['#4776e6', '#8e54e9', '#00b4db', '#0083b0', '#c471ed'],
};

const params = ergon.params({
  bands:   { type: 'number', min: 2, max: 8, default: 4, step: 1, label: 'Bands' },
  shimmer: { type: 'number', min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: 'Shimmer' },
  opacity: { type: 'number', min: 20, max: 120, default: 60, step: 5, label: 'Opacity' },
  style:   { type: 'select', options: ['Curtain', 'Ribbons', 'Rays', 'Veil'], default: 'Curtain', label: 'Style' },
  palette: { type: 'select', options: ['Boreal', 'Tropical', 'Crimson', 'Solar', 'Void'], default: 'Boreal', label: 'Palette' },
});

let t = 0;

function bandY(x, band, time) {
  const n1 = noise(x * 0.003 + band * 3.7, time * params.shimmer);
  const n2 = noise(x * 0.006 + band * 1.3, time * params.shimmer * 2 + 5);
  return (n1 * 0.7 + n2 * 0.3) * height * 0.6 + height * 0.1 + band * (height * 0.1);
}

function bandWidth(x, band, time) {
  return noise(x * 0.004 + band * 2.1, time * params.shimmer + 10) * height * 0.12 + 20;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);
}

function draw() {
  background(5, 5, 20, 30);
  t++;
  const colors = palettes[params.palette] || palettes.Boreal;

  for (let band = 0; band < params.bands; band++) {
    const col = colors[band % colors.length];
    const r = parseInt(col.slice(1, 3), 16);
    const g = parseInt(col.slice(3, 5), 16);
    const b = parseInt(col.slice(5, 7), 16);

    if (params.style === 'Rays') {
      // vertical ray columns
      for (let x = 0; x < width; x += 8) {
        const cy = bandY(x, band, t);
        const bw = bandWidth(x, band, t);
        const alpha = map(noise(x * 0.01, t * params.shimmer + band), 0, 1, 0, params.opacity);
        stroke(r, g, b, alpha);
        strokeWeight(3);
        line(x, cy - bw, x, cy + bw);
      }
    } else if (params.style === 'Ribbons') {
      // thin flowing curves stacked
      for (let offset = -2; offset <= 2; offset++) {
        noFill();
        stroke(r, g, b, params.opacity * 0.4);
        strokeWeight(1.5);
        beginShape();
        for (let x = 0; x <= width; x += 6) {
          const cy = bandY(x, band, t) + offset * 8;
          vertex(x, cy);
        }
        endShape();
      }
    } else {
      // Curtain / Veil: filled shape between two noise curves
      const thicknessMod = params.style === 'Veil' ? 2.5 : 1.0;
      noStroke();

      // Draw as a series of thin vertical strips for smooth alpha gradient
      for (let x = 0; x < width; x += 4) {
        const midY = bandY(x, band, t);
        const hw = bandWidth(x, band, t) * thicknessMod;
        const alpha = map(noise(x * 0.008, t * params.shimmer * 0.5 + band * 1.1), 0, 1, 10, params.opacity);

        for (let dy = -hw; dy <= hw; dy += 2) {
          const fade = 1 - abs(dy) / hw;
          fill(r, g, b, alpha * fade * 0.6);
          rect(x, midY + dy, 4, 2);
        }
      }
    }
  }

  // stars in the background
  noStroke();
  fill(255, 255, 255, 60);
  randomSeed(99);
  for (let i = 0; i < 80; i++) {
    const sx = random(width);
    const sy = random(height * 0.7);
    circle(sx, sy, random(0.5, 1.5));
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
`;

export const aurora: Template = {
  id: "aurora",
  name: "Aurora",
  description: "Northern lights rendered as noise-shaped color bands drifting across the sky.",
  schema: auroraSchema,
  code: auroraCode,
};
```

- [ ] Create `src/__tests__/templates/aurora.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { aurora } from "@/lib/templates/aurora";
import { validateParamSchema } from "@/lib/types";

describe("aurora template", () => {
  it("has required metadata", () => {
    expect(aurora.name).toBe("Aurora");
    expect(aurora.code).toContain("ergon.params(");
  });
  it("has a valid parameter schema", () => {
    expect(validateParamSchema(aurora.schema)).toBe(true);
  });
  it("has between 3 and 6 parameters", () => {
    const count = Object.keys(aurora.schema).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
  });
});
```

---

## Task 9: Update Registry

**File:** `src/lib/templates/registry.ts`

Add all 8 new template imports and append them to the `templates` array. No other changes.

- [ ] Edit `src/lib/templates/registry.ts`

Replace the file contents with:

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
import { spiral } from "./spiral";
import { waves } from "./waves";
import { constellation } from "./constellation";
import { terrain } from "./terrain";
import { bloom } from "./bloom";
import { glitch } from "./glitch";
import { mesh } from "./mesh";
import { aurora } from "./aurora";

export const templates: Template[] = [
  drift,
  grid,
  pulse,
  scatter,
  weave,
  spiral,
  waves,
  constellation,
  terrain,
  bloom,
  glitch,
  mesh,
  aurora,
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
```

---

## Verification

After all tasks are complete, run the test suite to confirm all 8 new test files pass:

```bash
npx vitest run src/__tests__/templates/
```

Expected: 24 new passing tests (3 per template × 8 templates) with no regressions on existing template tests.
