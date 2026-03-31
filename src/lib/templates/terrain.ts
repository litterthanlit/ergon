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
