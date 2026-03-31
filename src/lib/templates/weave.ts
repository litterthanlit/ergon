import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const weaveSchema: ParamSchema = {
  depth: { type: "number", min: 1, max: 8, default: 5, step: 1, label: "Depth" },
  splitBias: { type: "number", min: 0.0, max: 1.0, default: 0.5, step: 0.05, label: "Split Bias" },
  colorFill: { type: "number", min: 0.0, max: 1.0, default: 0.3, step: 0.05, label: "Color Fill" },
  gap: { type: "number", min: 0, max: 12, default: 4, step: 1, label: "Gap" },
  palette: { type: "select", options: ["Mondrian", "Pastel", "Mono", "Earth"], default: "Mondrian", label: "Palette" },
};

export const weaveCode = `
const palettes = {
  Mondrian: ['#c4362c', '#2a5faa', '#f7d842', '#ffffff'],
  Pastel:   ['#ffccd5', '#a8dadc', '#ffe5b4', '#d5f5e3', '#e8d5f5'],
  Mono:     ['#000', '#333', '#666', '#999', '#ccc', '#fff'],
  Earth:    ['#606c38', '#dda15e', '#bc6c25', '#fefae0', '#283618'],
};

const params = ergon.params({
  depth:     { type: 'number', min: 1, max: 8, default: 5, step: 1, label: 'Depth' },
  splitBias: { type: 'number', min: 0.0, max: 1.0, default: 0.5, step: 0.05, label: 'Split Bias' },
  colorFill: { type: 'number', min: 0.0, max: 1.0, default: 0.3, step: 0.05, label: 'Color Fill' },
  gap:       { type: 'number', min: 0, max: 12, default: 4, step: 1, label: 'Gap' },
  palette:   { type: 'select', options: ['Mondrian', 'Pastel', 'Mono', 'Earth'], default: 'Mondrian', label: 'Palette' },
});

function setup() { createCanvas(windowWidth, windowHeight); noLoop(); }

function subdivide(x, y, w, h, depth) {
  const colors = palettes[params.palette] || palettes.Mondrian;
  if (depth === 0 || w < 20 || h < 20) {
    if (random() < params.colorFill) { fill(colors[floor(random(colors.length))]); }
    else { fill(255); }
    noStroke();
    rect(x + params.gap / 2, y + params.gap / 2, w - params.gap, h - params.gap);
    return;
  }
  if (random() < params.splitBias) {
    const split = random(0.3, 0.7) * w;
    subdivide(x, y, split, h, depth - 1);
    subdivide(x + split, y, w - split, h, depth - 1);
  } else {
    const split = random(0.3, 0.7) * h;
    subdivide(x, y, w, split, depth - 1);
    subdivide(x, y + split, w, h - split, depth - 1);
  }
}

function draw() { background(255); subdivide(0, 0, width, height, params.depth); }
function windowResized() { resizeCanvas(windowWidth, windowHeight); redraw(); }
function mousePressed() { noiseSeed(millis()); redraw(); }
`;

export const weave: Template = {
  id: "weave",
  name: "Weave",
  description: "Recursive subdivision. Watch the algorithm think at each depth level.",
  schema: weaveSchema,
  code: weaveCode,
  compositionHint: { blendMode: "multiply", opacity: 0.5 },
};
