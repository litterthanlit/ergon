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
let t = 0;

function scatter() {
  pts = [];
  for (let i = 0; i < params.stars; i++) {
    pts.push({ x: random(width), y: random(height), r: random(0.4, 1.0) });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  scatter();
}

function draw() {
  t += 0.01;
  const pal = palettes[params.palette] || palettes.Night;
  background(pal.bg);

  // Draw lines first
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x + sin(t * 0.5 + i) * 2 - (pts[j].x + sin(t * 0.5 + j) * 2);
      const dy = pts[i].y + cos(t * 0.3 + i * 1.3) * 2 - (pts[j].y + cos(t * 0.3 + j * 1.3) * 2);
      const d = sqrt(dx * dx + dy * dy);
      if (d < params.threshold) {
        const alphaI = sin(t * 2 + i * 0.7) * 0.3 + 0.7;
        const alphaJ = sin(t * 2 + j * 0.7) * 0.3 + 0.7;
        const lineAlpha = (alphaI + alphaJ) * 0.5;
        stroke(pal.line);
        strokeWeight(map(d, 0, params.threshold, 1.0, 0.1) * lineAlpha);
        const xi = pts[i].x + sin(t * 0.5 + i) * 2;
        const yi = pts[i].y + cos(t * 0.3 + i * 1.3) * 2;
        const xj = pts[j].x + sin(t * 0.5 + j) * 2;
        const yj = pts[j].y + cos(t * 0.3 + j * 1.3) * 2;
        line(xi, yi, xj, yj);
      }
    }
  }

  // Draw stars on top
  noStroke();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const alpha = sin(t * 2 + i * 0.7) * 0.3 + 0.7;
    const px = p.x + sin(t * 0.5 + i) * 2;
    const py = p.y + cos(t * 0.3 + i * 1.3) * 2;
    const sz = params.starSize * p.r;
    const starCol = color(pal.star);
    starCol.setAlpha(alpha * 255);
    fill(starCol);
    circle(px, py, sz * 2);
    // soft glow
    const glowCol = color(pal.star);
    glowCol.setAlpha(alpha * 0.2 * 255);
    fill(glowCol);
    circle(px, py, sz * 5);
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); scatter(); }
function mousePressed() { scatter(); }
`;

export const constellation: Template = {
  id: "constellation",
  name: "Constellation",
  description: "Stars connected by proximity. Adjust link distance to find hidden shapes.",
  schema: constellationSchema,
  code: constellationCode,
};
