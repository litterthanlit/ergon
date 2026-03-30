import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const glitchSchema: ParamSchema = {
  intensity: { type: "number", min: 1, max: 60, default: 20, step: 1, label: "Intensity" },
  frequency: { type: "number", min: 0.01, max: 0.5, default: 0.1, step: 0.01, label: "Frequency" },
  scanlines: { type: "boolean", default: true, label: "Scanlines" },
  shape: { type: "select", options: ["Rects", "Grid", "Bars", "Cross"], default: "Rects", label: "Shape" },
  palette: { type: "select", options: ["VHS", "Terminal", "Infrared", "Cyber", "Grayscale"], default: "VHS", label: "Palette" },
};

export const glitchCode = `
const palettes = {
  VHS:       { bg: '#0a0014', shapes: ['#ff006e', '#3a86ff', '#ffbe0b', '#ffffff'] },
  Terminal:  { bg: '#000a00', shapes: ['#00ff41', '#00cc33', '#009922', '#006611'] },
  Infrared:  { bg: '#000000', shapes: ['#ff0000', '#ff4400', '#ff8800', '#ffcc00'] },
  Cyber:     { bg: '#000010', shapes: ['#00ffff', '#0088ff', '#8800ff', '#ff00ff'] },
  Grayscale: { bg: '#111111', shapes: ['#ffffff', '#aaaaaa', '#666666', '#333333'] },
};

const params = ergon.params({
  intensity: { type: 'number', min: 1, max: 60, default: 20, step: 1, label: 'Intensity' },
  frequency: { type: 'number', min: 0.01, max: 0.5, default: 0.1, step: 0.01, label: 'Frequency' },
  scanlines: { type: 'boolean', default: true, label: 'Scanlines' },
  shape:     { type: 'select', options: ['Rects', 'Grid', 'Bars', 'Cross'], default: 'Rects', label: 'Shape' },
  palette:   { type: 'select', options: ['VHS', 'Terminal', 'Infrared', 'Cyber', 'Grayscale'], default: 'VHS', label: 'Palette' },
});

let glitchBands = [];
let glitchTimer = 0;

function fireGlitch() {
  glitchBands = [];
  const count = floor(random(3, 10));
  for (let i = 0; i < count; i++) {
    glitchBands.push({
      y: random(height),
      h: random(2, params.intensity * 1.5),
      dx: random(-params.intensity * 2, params.intensity * 2),
      life: random(3, 12),
    });
  }
}

function drawShapes(colors) {
  const cols = params.shape === 'Grid' ? 6 : params.shape === 'Bars' ? 12 : 4;
  const rows = params.shape === 'Bars' ? cols : floor(cols * (height / width));
  const cw = width / cols;
  const ch = height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw;
      const y = r * ch;
      fill(colors[floor((r + c) % colors.length)] + 'cc');
      noStroke();
      if (params.shape === 'Cross') {
        rect(x + cw * 0.35, y, cw * 0.3, ch);
        rect(x, y + ch * 0.35, cw, ch * 0.3);
      } else {
        const pad = params.shape === 'Rects' ? random(2, 12) : 1;
        rect(x + pad, y + pad, cw - pad * 2, ch - pad * 2);
      }
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30);
}

function draw() {
  const pal = palettes[params.palette] || palettes.VHS;
  background(pal.bg);

  drawShapes(pal.shapes);

  glitchTimer++;
  if (random() < params.frequency) fireGlitch();

  // apply glitch bands (RGB split effect via layered semi-transparent rects)
  noStroke();
  for (let i = glitchBands.length - 1; i >= 0; i--) {
    const b = glitchBands[i];
    // red channel shift
    fill(255, 0, 80, 60);
    rect(b.dx * 1.3, b.y, width, b.h);
    // blue channel shift
    fill(0, 100, 255, 60);
    rect(-b.dx, b.y + b.h * 0.3, width, b.h);
    // white flash band
    fill(255, 255, 255, 30);
    rect(b.dx, b.y, width, b.h * 0.5);
    b.life--;
    if (b.life <= 0) glitchBands.splice(i, 1);
  }

  if (params.scanlines) {
    noFill();
    stroke(0, 0, 0, 60);
    strokeWeight(1);
    for (let y = 0; y < height; y += 3) {
      line(0, y, width, y);
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
`;

export const glitch: Template = {
  id: "glitch",
  name: "Glitch",
  description: "Geometric shapes corrupted by scanlines, RGB splits, and data errors.",
  schema: glitchSchema,
  code: glitchCode,
};
