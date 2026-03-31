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

let t = 0;

function drawPetal(cx, cy, angle, r, colorIdx, colors) {
  const ctrl = r * params.curvature;
  const sway = sin(t + angle) * 5;
  const x1 = cx + cos(angle - 0.5) * r;
  const y1 = cy + sin(angle - 0.5) * r;
  const x2 = cx + cos(angle + 0.5) * r;
  const y2 = cy + sin(angle + 0.5) * r;
  const cpx = cx + cos(angle) * r * 1.6 + cos(angle + HALF_PI) * (ctrl + sway);
  const cpy = cy + sin(angle) * r * 1.6 + sin(angle + HALF_PI) * (ctrl + sway);
  const cpx2 = cx + cos(angle) * r * 1.6 - cos(angle + HALF_PI) * (ctrl + sway);
  const cpy2 = cy + sin(angle) * r * 1.6 - sin(angle + HALF_PI) * (ctrl + sway);

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
}

function draw() {
  t += 0.005;
  randomSeed(seed);
  background(12);
  const colors = palettes[params.palette] || palettes.Cherry;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = min(width, height) * 0.38;

  push();
  translate(cx, cy);
  rotate(sin(t * 0.3) * 0.05);
  translate(-cx, -cy);

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

  pop();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
function mousePressed() { seed = millis(); }
`;

export const bloom: Template = {
  id: "bloom",
  name: "Bloom",
  description: "Generative flowers from bezier petals. Click to grow a new specimen.",
  schema: bloomSchema,
  code: bloomCode,
};
