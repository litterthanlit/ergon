import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const organismSchema: ParamSchema = {
  count: {
    type: "number", min: 50, max: 500, default: 200, step: 10, label: "Vertex Count",
  },
  connections: {
    type: "number", min: 1, max: 8, default: 3, step: 1, label: "Connections",
  },
  breathe: {
    type: "number", min: 0.1, max: 3.0, default: 1.0, step: 0.1, label: "Breathe Speed",
  },
  reach: {
    type: "number", min: 20, max: 200, default: 80, label: "Reach",
  },
  lineWeight: {
    type: "number", min: 0.3, max: 3.0, default: 0.8, step: 0.1, label: "Line Weight",
  },
  mode: {
    type: "select",
    options: ["Attract", "Repel", "Orbit"],
    default: "Attract",
    label: "Mouse Mode",
  },
};

export const organismCode = `
const sharedPalette = (typeof ergon !== 'undefined' && ergon.palette) ? ergon.palette : null;
const sharedTempo = (typeof ergon !== 'undefined' && ergon.tempo !== undefined) ? ergon.tempo : 1;

const params = ergon.params({
  count:       { type: 'number', min: 50, max: 500, default: 200, step: 10, label: 'Vertex Count' },
  connections: { type: 'number', min: 1, max: 8, default: 3, step: 1, label: 'Connections' },
  breathe:     { type: 'number', min: 0.1, max: 3.0, default: 1.0, step: 0.1, label: 'Breathe Speed' },
  reach:       { type: 'number', min: 20, max: 200, default: 80, label: 'Reach' },
  lineWeight:  { type: 'number', min: 0.3, max: 3.0, default: 0.8, step: 0.1, label: 'Line Weight' },
  mode:        { type: 'select', options: ['Attract', 'Repel', 'Orbit'], default: 'Attract', label: 'Mouse Mode' },
});

let pts = [];
let rotX = 0, rotY = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(RGB, 255, 255, 255, 255);
  buildPoints();
}

function buildPoints() {
  pts = [];
  const n = params.count;
  const goldenRatio = (1 + sqrt(5)) / 2;
  for (let i = 0; i < n; i++) {
    const theta = acos(1 - 2 * (i + 0.5) / n);
    const phi = TWO_PI * i / goldenRatio;
    const r = params.reach;
    pts.push({
      bx: r * sin(theta) * cos(phi),
      by: r * sin(theta) * sin(phi),
      bz: r * cos(theta),
      phase: random(TWO_PI),
      x: 0, y: 0, z: 0,
    });
  }
}

function draw() {
  // Rebuild points when count changes
  if (pts.length !== params.count) buildPoints();

  background(8, 8, 14);

  // Gentle auto-rotation
  rotX += 0.002 * sharedTempo;
  rotY += 0.003 * sharedTempo;
  rotateX(rotX);
  rotateY(rotY);

  const t = frameCount * 0.01 * params.breathe * sharedTempo;
  const r = params.reach;

  // Project mouse into rotated local space (approximate: use screen mouse as angle)
  const mx = (mouseX - width / 2);
  const my = (mouseY - height / 2);
  const mouseWorld = createVector(
    mx * cos(-rotY) - 0 * sin(-rotY),
    my * cos(-rotX),
    mx * sin(-rotY) + my * sin(-rotX)
  );

  // Update vertex positions with breathing + mouse influence
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const breathScale = 1.0 + 0.18 * sin(t + p.phase);
    p.x = p.bx * breathScale;
    p.y = p.by * breathScale;
    p.z = p.bz * breathScale;

    const dx = p.x - mouseWorld.x;
    const dy = p.y - mouseWorld.y;
    const dz = p.z - mouseWorld.z;
    const dist = sqrt(dx * dx + dy * dy + dz * dz);
    const influence = constrain(map(dist, 0, r * 1.5, 1.0, 0.0), 0, 1);
    const force = influence * r * 0.4;

    if (dist > 0.01) {
      if (params.mode === 'Attract') {
        p.x -= (dx / dist) * force;
        p.y -= (dy / dist) * force;
        p.z -= (dz / dist) * force;
      } else if (params.mode === 'Repel') {
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
        p.z += (dz / dist) * force;
      } else {
        // Orbit: deflect perpendicular to mouse direction
        const tangX = dz / dist;
        const tangZ = -dx / dist;
        p.x += tangX * force * 0.5;
        p.z += tangZ * force * 0.5;
      }
    }
  }

  // Determine line color from shared palette or default white
  const lineColors = (sharedPalette && sharedPalette.length >= 2)
    ? sharedPalette
    : ['#ffffff', '#aaddff', '#66aaff', '#4488cc'];

  strokeWeight(params.lineWeight);
  noFill();

  // Draw k-nearest neighbor connections
  const k = params.connections;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];

    // Find k nearest by squared distance
    const dists = [];
    for (let j = 0; j < pts.length; j++) {
      if (i === j) continue;
      const q = pts[j];
      const d2 = (p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2;
      dists.push({ j, d2 });
    }
    dists.sort((a, b) => a.d2 - b.d2);

    for (let n = 0; n < min(k, dists.length); n++) {
      const q = pts[dists[n].j];
      // Only draw each edge once (i < j)
      if (dists[n].j <= i) continue;

      // Fade with depth & distance
      const maxDist2 = (r * 2.2) ** 2;
      const alpha = floor(constrain(map(dists[n].d2, 0, maxDist2, 200, 0), 0, 200));
      const colorIdx = floor(map(n, 0, k, 0, lineColors.length));
      const c = lineColors[constrain(colorIdx, 0, lineColors.length - 1)];

      // Parse hex color and apply alpha
      let rr = 255, gg = 255, bb = 255;
      if (c && c.startsWith('#') && c.length >= 7) {
        rr = parseInt(c.slice(1, 3), 16);
        gg = parseInt(c.slice(3, 5), 16);
        bb = parseInt(c.slice(5, 7), 16);
      }
      stroke(rr, gg, bb, alpha);
      line(p.x, p.y, p.z, q.x, q.y, q.z);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
`;

export const organism: Template = {
  id: "organism",
  name: "Organism",
  description: "A breathing neural network — living vertices connected across a sphere. Mouse pulls and repels the form.",
  schema: organismSchema,
  code: organismCode,
  compositionHint: { blendMode: "screen", opacity: 0.8 },
};
