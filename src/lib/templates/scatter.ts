import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const scatterSchema: ParamSchema = {
  count: { type: "number", min: 5, max: 500, default: 200, step: 5, label: "Count" },
  sizeMax: { type: "number", min: 10, max: 150, default: 60, step: 5, label: "Max Size" },
  opacity: { type: "number", min: 0.05, max: 1.0, default: 0.3, step: 0.05, label: "Opacity" },
  spacing: { type: "number", min: 0, max: 50, default: 0, step: 1, label: "Spacing" },
  palette: { type: "select", options: ["Watercolor", "Warm", "Cool", "Pastel", "Neon", "Mono"], default: "Watercolor", label: "Palette" },
};

export const scatterCode = `
const palettes = {
  Watercolor: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
  Warm:       ['#ff6b35', '#f7c59f', '#ff9f1c', '#e71d36', '#af3800'],
  Cool:       ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
  Pastel:     ['#ffcdb2', '#ffb4a2', '#e5989b', '#b5838d', '#6d6875'],
  Neon:       ['#ff006e', '#fb5607', '#ffbe0b', '#3a86ff', '#8338ec'],
  Mono:       ['#111', '#333', '#555', '#888', '#bbb'],
};

const params = ergon.params({
  count:   { type: 'number', min: 5, max: 500, default: 200, step: 5, label: 'Count' },
  sizeMax: { type: 'number', min: 10, max: 150, default: 60, step: 5, label: 'Max Size' },
  opacity: { type: 'number', min: 0.05, max: 1.0, default: 0.3, step: 0.05, label: 'Opacity' },
  spacing: { type: 'number', min: 0, max: 50, default: 0, step: 1, label: 'Spacing' },
  palette: { type: 'select', options: ['Watercolor', 'Warm', 'Cool', 'Pastel', 'Neon', 'Mono'], default: 'Watercolor', label: 'Palette' },
});

let circles = [];
let t = 0;

function generate() {
  const colors = palettes[params.palette] || palettes.Watercolor;
  circles = [];
  let attempts = 0;
  while (circles.length < params.count && attempts < params.count * 10) {
    const x = random(width), y = random(height);
    const r = random(10, params.sizeMax);
    let tooClose = false;
    if (params.spacing > 0) {
      for (const p of circles) {
        if (dist(x, y, p.x, p.y) < (r + p.r) / 2 + params.spacing) { tooClose = true; break; }
      }
    }
    if (!tooClose) {
      circles.push({ x, y, r, i: circles.length, colorIdx: floor(random(colors.length)) });
    }
    attempts++;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  generate();
}

function draw() {
  t += 0.008;
  background(252);
  noStroke();
  const colors = palettes[params.palette] || palettes.Watercolor;
  for (const circle of circles) {
    const c = color(colors[circle.colorIdx]);
    c.setAlpha(params.opacity * 255);
    fill(c);
    const animR = circle.r + sin(t + circle.i * 0.5) * 3;
    const animX = circle.x + sin(t * 0.5 + circle.i) * 2;
    ellipse(animX, circle.y, animR);
  }
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); generate(); }
function mousePressed() { noiseSeed(millis()); generate(); }
`;

export const scatter: Template = {
  id: "scatter",
  name: "Scatter",
  description: "Controlled randomness. The difference between noise and composition.",
  schema: scatterSchema,
  code: scatterCode,
  compositionHint: { blendMode: "overlay", opacity: 0.6 },
};
