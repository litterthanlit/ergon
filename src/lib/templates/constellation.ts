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

function scatter() {
  pts = [];
  for (let i = 0; i < params.stars; i++) {
    pts.push({ x: random(width), y: random(height), r: random(0.4, 1.0) });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
  scatter();
}

function draw() {
  const pal = palettes[params.palette] || palettes.Night;
  background(pal.bg);

  // Draw lines first
  stroke(pal.line);
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = dist(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
      if (d < params.threshold) {
        strokeWeight(map(d, 0, params.threshold, 1.0, 0.1));
        line(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
      }
    }
  }

  // Draw stars on top
  noStroke();
  for (const p of pts) {
    fill(pal.star);
    const sz = params.starSize * p.r;
    circle(p.x, p.y, sz * 2);
    // soft glow
    fill(pal.star + '33');
    circle(p.x, p.y, sz * 5);
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); scatter(); redraw(); }
function mousePressed() { scatter(); redraw(); }
`;

export const constellation: Template = {
  id: "constellation",
  name: "Constellation",
  description: "Stars connected by proximity. Adjust link distance to find hidden shapes.",
  schema: constellationSchema,
  code: constellationCode,
};
