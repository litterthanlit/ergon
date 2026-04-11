import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const gridSchema: ParamSchema = {
  columns: { type: "number", min: 3, max: 32, default: 12, step: 1, label: "Columns" },
  rotation: { type: "number", min: 0, max: 180, default: 45, step: 1, label: "Rotation" },
  density: { type: "number", min: 0.1, max: 1.0, default: 0.8, step: 0.05, label: "Density" },
  shape: { type: "select", options: ["Square", "Circle", "Line"], default: "Square", label: "Shape" },
  invert: { type: "boolean", default: false, label: "Invert" },
};

export const gridCode = `
const params = ergon.params({
  columns:  { type: 'number', min: 3, max: 32, default: 12, step: 1, label: 'Columns' },
  rotation: { type: 'number', min: 0, max: 180, default: 45, step: 1, label: 'Rotation' },
  density:  { type: 'number', min: 0.1, max: 1.0, default: 0.8, step: 0.05, label: 'Density' },
  shape:    { type: 'select', options: ['Square', 'Circle', 'Line'], default: 'Square', label: 'Shape' },
  invert:   { type: 'boolean', default: false, label: 'Invert' },
});

const sharedPalette = (typeof ergon !== 'undefined' && ergon.palette) ? ergon.palette : null;
const sharedTempo = (typeof ergon !== 'undefined' && ergon.tempo !== undefined) ? ergon.tempo : 1;

let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  t += 0.008 * sharedTempo;
  const bg = params.invert ? 0 : 255;
  const fg = params.invert ? 255 : 0;
  background(bg);
  noStroke();

  // Read live palette each frame (it can change via shared drivers)
  const pal = (typeof ergon !== 'undefined' && ergon.palette) ? ergon.palette : null;

  const size = min(width, height) / params.columns;
  const offsetX = (width - params.columns * size) / 2;
  const offsetY = (height - params.columns * size) / 2;
  for (let x = 0; x < params.columns; x++) {
    for (let y = 0; y < params.columns; y++) {
      if (random() > params.density) continue;

      // Color: use shared palette with position-based selection
      // Most cells get the primary color (index 1), a few get accents
      if (pal && pal.length >= 3) {
        const n = noise(x * 0.4, y * 0.4);
        if (n > 0.75) {
          fill(pal[2]); // accent 1
        } else if (n > 0.65) {
          fill(pal[3 % pal.length]); // accent 2
        } else if (n > 0.58) {
          fill(pal[4 % pal.length]); // accent 3
        } else {
          fill(pal[1] || fg); // primary (usually dark)
        }
      } else {
        fill(fg);
      }

      push();
      translate(offsetX + x * size + size / 2, offsetY + y * size + size / 2);
      rotate(sin(t + x * 0.5 + y * 0.3) * params.rotation * PI / 180);
      if (params.shape === 'Circle') { ellipse(0, 0, size * 0.8); }
      else if (params.shape === 'Line') { rectMode(CENTER); rect(0, 0, size * 0.8, 2); }
      else { rectMode(CENTER); rect(0, 0, size * 0.75, size * 0.75); }
      pop();
    }
  }
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }
function mousePressed() { noiseSeed(millis()); }
`;

export const grid: Template = {
  id: "grid",
  name: "Grid",
  description: "Geometric repetition with controlled variation. Looks like a Swiss poster.",
  schema: gridSchema,
  code: gridCode,
  compositionHint: { blendMode: "multiply", opacity: 0.5 },
};
