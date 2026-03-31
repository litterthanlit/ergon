import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const glyphsSchema: ParamSchema = {
  columns:   { type: "number", min: 20, max: 80, default: 50, step: 1, label: "Columns" },
  glyphSize: { type: "number", min: 2, max: 12, default: 6, step: 1, label: "Glyph Size" },
  density:   { type: "number", min: 0.3, max: 1.0, default: 0.85, step: 0.05, label: "Density" },
  shape:     { type: "select", options: ["Staircase", "Diamond", "Circle", "Random"], default: "Staircase", label: "Shape" },
  palette:   { type: "select", options: ["Matrix", "Pastel", "Neon", "Mono", "Warm"], default: "Matrix", label: "Palette" },
};

export const glyphsCode = `
const palettes = {
  Matrix:  ['#4ade80','#22d3ee','#a78bfa','#facc15','#f472b6','#86efac','#67e8f9','#c4b5fd'],
  Pastel:  ['#fbcfe8','#e9d5ff','#bbf7d0','#fed7aa','#fde68a','#bfdbfe','#f5d0fe','#ccfbf1'],
  Neon:    ['#ff00ff','#00ffff','#39ff14','#ff073a','#ff6600','#ffff00','#7df9ff','#bf5fff'],
  Mono:    ['#ffffff','#e5e5e5','#cccccc','#b3b3b3','#999999','#808080','#666666','#4d4d4d'],
  Warm:    ['#ff4500','#ff8c00','#ffd700','#ff6347','#ff7f50','#ffa500','#ffb347','#ff6b6b'],
};

const params = ergon.params({
  columns:   { type: 'number', min: 20, max: 80, default: 50, step: 1, label: 'Columns' },
  glyphSize: { type: 'number', min: 2, max: 12, default: 6, step: 1, label: 'Glyph Size' },
  density:   { type: 'number', min: 0.3, max: 1.0, default: 0.85, step: 0.05, label: 'Density' },
  shape:     { type: 'select', options: ['Staircase', 'Diamond', 'Circle', 'Random'], default: 'Staircase', label: 'Shape' },
  palette:   { type: 'select', options: ['Matrix', 'Pastel', 'Neon', 'Mono', 'Warm'], default: 'Matrix', label: 'Palette' },
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function isInsideMask(col, row, cols, rows, shape) {
  const nx = col / (cols - 1);
  const ny = row / (rows - 1);
  if (shape === 'Staircase') {
    const step = floor(ny * 8) / 8;
    return nx <= step + 0.15;
  }
  if (shape === 'Diamond') {
    return abs(nx - 0.5) + abs(ny - 0.5) < 0.5;
  }
  if (shape === 'Circle') {
    const dx = nx - 0.5;
    const dy = ny - 0.5;
    return dx * dx + dy * dy < 0.25;
  }
  return true;
}

function draw() {
  background(0);
  noFill();
  const colors = palettes[params.palette] || palettes.Matrix;
  const cellW = width / params.columns;
  const rows = floor(height / cellW);
  const offsetX = (width - params.columns * cellW) / 2;
  const offsetY = (height - rows * cellW) / 2;
  const halfGlyph = params.glyphSize / 2;

  for (let col = 0; col < params.columns; col++) {
    for (let row = 0; row < rows; row++) {
      if (!isInsideMask(col, row, params.columns, rows, params.shape)) continue;
      if (random() > params.density) continue;
      const cx = offsetX + col * cellW + cellW / 2;
      const cy = offsetY + row * cellW + cellW / 2;
      const baseColor = colors[floor(random(colors.length))];
      const c = color(baseColor);
      const alpha = random(160, 255);
      stroke(red(c), green(c), blue(c), alpha);
      strokeWeight(random(1, 2));
      const jitter = cellW * 0.15;
      const x = cx + random(-jitter, jitter);
      const y = cy + random(-jitter, jitter);
      line(x, y - halfGlyph, x + random(-1, 1), y + halfGlyph);
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); redraw(); }
function mousePressed() { noiseSeed(millis()); redraw(); }
`;

export const glyphs: Template = {
  id: "glyphs",
  name: "Glyphs",
  description: "Tiny colored marks forming geometric silhouettes. A matrix of micro-compositions.",
  schema: glyphsSchema,
  code: glyphsCode,
};
