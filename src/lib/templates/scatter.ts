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

function setup() { createCanvas(windowWidth, windowHeight); noLoop(); }

function draw() {
  background(252);
  noStroke();
  const colors = palettes[params.palette] || palettes.Watercolor;
  const placed = [];
  let attempts = 0;
  while (placed.length < params.count && attempts < params.count * 10) {
    const x = random(width), y = random(height);
    const r = random(10, params.sizeMax);
    let tooClose = false;
    if (params.spacing > 0) {
      for (const p of placed) {
        if (dist(x, y, p.x, p.y) < (r + p.r) / 2 + params.spacing) { tooClose = true; break; }
      }
    }
    if (!tooClose) {
      const c = color(colors[floor(random(colors.length))]);
      c.setAlpha(params.opacity * 255);
      fill(c);
      ellipse(x, y, r);
      placed.push({ x, y, r });
    }
    attempts++;
  }
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); redraw(); }
function mousePressed() { noiseSeed(millis()); redraw(); }
`;

export const scatter: Template = {
  id: "scatter",
  name: "Scatter",
  description: "Controlled randomness. The difference between noise and composition.",
  schema: scatterSchema,
  code: scatterCode,
};
