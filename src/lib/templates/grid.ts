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

let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  t += 0.008;
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
      rotate(sin(t + x * 0.5 + y * 0.3) * params.rotation * PI / 180);
      if (params.shape === 'Circle') { ellipse(0, 0, size * 0.8); }
      else if (params.shape === 'Line') { rectMode(CENTER); rect(0, 0, size * 0.8, 2); }
      else { rectMode(CENTER); rect(0, 0, size * 0.75, size * 0.75); }
      pop();
    }
  }
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); redraw(); }
function mousePressed() { noiseSeed(millis()); redraw(); }
`;

export const grid: Template = {
  id: "grid",
  name: "Grid",
  description: "Geometric repetition with controlled variation. Looks like a Swiss poster.",
  schema: gridSchema,
  code: gridCode,
  compositionHint: { blendMode: "multiply", opacity: 0.5 },
};
