import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const meshSchema: ParamSchema = {
  cols: { type: "number", min: 4, max: 30, default: 12, step: 1, label: "Columns" },
  displacement: { type: "number", min: 0, max: 120, default: 40, step: 5, label: "Displacement" },
  showPoints: { type: "boolean", default: true, label: "Show Points" },
  fill: { type: "select", options: ["Wire", "Solid", "Mixed", "Gradient"], default: "Mixed", label: "Fill Mode" },
  palette: { type: "select", options: ["Steel", "Copper", "Jade", "Bone", "Neon"], default: "Steel", label: "Palette" },
};

export const meshCode = `
const palettes = {
  Steel:  { bg: '#0d1117', edge: '#8b949e', face: '#21262d', point: '#58a6ff' },
  Copper: { bg: '#0d0800', edge: '#c87941', face: '#3d2010', point: '#f0a060' },
  Jade:   { bg: '#000d08', edge: '#2da44e', face: '#0d2318', point: '#56d364' },
  Bone:   { bg: '#1a1814', edge: '#d4c5a9', face: '#2e2a22', point: '#f5f0e8' },
  Neon:   { bg: '#000010', edge: '#ff006e', face: '#10001a', point: '#fb5607' },
};

const params = ergon.params({
  cols:         { type: 'number', min: 4, max: 30, default: 12, step: 1, label: 'Columns' },
  displacement: { type: 'number', min: 0, max: 120, default: 40, step: 5, label: 'Displacement' },
  showPoints:   { type: 'boolean', default: true, label: 'Show Points' },
  fill:         { type: 'select', options: ['Wire', 'Solid', 'Mixed', 'Gradient'], default: 'Mixed', label: 'Fill Mode' },
  palette:      { type: 'select', options: ['Steel', 'Copper', 'Jade', 'Bone', 'Neon'], default: 'Steel', label: 'Palette' },
});

let nSeed = 0;

function buildGrid() {
  const rows = floor(params.cols * (height / width));
  const cw = width / params.cols;
  const ch = height / rows;
  const pts = [];
  for (let r = 0; r <= rows; r++) {
    const row = [];
    for (let c = 0; c <= params.cols; c++) {
      const bx = c * cw;
      const by = r * ch;
      const dx = noise(c * 0.3 + nSeed, r * 0.3) * 2 - 1;
      const dy = noise(c * 0.3 + nSeed + 100, r * 0.3) * 2 - 1;
      row.push({ x: bx + dx * params.displacement, y: by + dy * params.displacement });
    }
    pts.push(row);
  }
  return { pts, rows };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function draw() {
  const pal = palettes[params.palette] || palettes.Steel;
  background(pal.bg);

  const { pts, rows } = buildGrid();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < params.cols; c++) {
      const a = pts[r][c];
      const b = pts[r][c + 1];
      const d = pts[r + 1][c];
      const e = pts[r + 1][c + 1];
      const t = (r + c) / (rows + params.cols);

      if (params.fill === 'Solid' || params.fill === 'Mixed' || params.fill === 'Gradient') {
        const faceColor = params.fill === 'Gradient'
          ? lerpColor(color(pal.face), color(pal.edge), t)
          : color(pal.face);
        fill(faceColor);
        stroke(pal.edge);
        strokeWeight(0.5);
        triangle(a.x, a.y, b.x, b.y, d.x, d.y);
        triangle(b.x, b.y, e.x, e.y, d.x, d.y);
      }
      if (params.fill === 'Wire' || params.fill === 'Mixed') {
        noFill();
        stroke(pal.edge);
        strokeWeight(params.fill === 'Mixed' ? 0.4 : 1);
        line(a.x, a.y, b.x, b.y);
        line(a.x, a.y, d.x, d.y);
        line(b.x, b.y, d.x, d.y);
      }
    }
  }

  if (params.showPoints) {
    noStroke();
    fill(pal.point);
    for (const row of pts) {
      for (const p of row) {
        circle(p.x, p.y, 4);
      }
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); redraw(); }
function mousePressed() { nSeed = random(1000); redraw(); }
`;

export const mesh: Template = {
  id: "mesh",
  name: "Mesh",
  description: "Triangulated grid warped by noise displacement. Click to shift the warp field.",
  schema: meshSchema,
  code: meshCode,
};
