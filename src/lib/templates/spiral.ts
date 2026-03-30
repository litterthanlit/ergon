import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const spiralSchema: ParamSchema = {
  arms: { type: "number", min: 1, max: 8, default: 3, step: 1, label: "Arms" },
  density: { type: "number", min: 50, max: 600, default: 200, step: 10, label: "Density" },
  spread: { type: "number", min: 0.05, max: 0.4, default: 0.18, step: 0.01, label: "Spread" },
  style: { type: "select", options: ["Dots", "Lines", "Mixed"], default: "Mixed", label: "Style" },
  palette: { type: "select", options: ["Gold", "Ice", "Ember", "Mono", "Botanical"], default: "Gold", label: "Palette" },
};

export const spiralCode = `
const palettes = {
  Gold:      ['#c8a951', '#e8c97a', '#f5e6b2', '#8b6914', '#3d2e07'],
  Ice:       ['#a8dadc', '#457b9d', '#1d3557', '#f1faee', '#e0fbfc'],
  Ember:     ['#e63946', '#f4a261', '#e76f51', '#264653', '#2a9d8f'],
  Mono:      ['#111111', '#444444', '#777777', '#aaaaaa', '#dddddd'],
  Botanical: ['#386641', '#6a994e', '#a7c957', '#bc4749', '#f2e8cf'],
};

const params = ergon.params({
  arms:    { type: 'number', min: 1, max: 8, default: 3, step: 1, label: 'Arms' },
  density: { type: 'number', min: 50, max: 600, default: 200, step: 10, label: 'Density' },
  spread:  { type: 'number', min: 0.05, max: 0.4, default: 0.18, step: 0.01, label: 'Spread' },
  style:   { type: 'select', options: ['Dots', 'Lines', 'Mixed'], default: 'Mixed', label: 'Style' },
  palette: { type: 'select', options: ['Gold', 'Ice', 'Ember', 'Mono', 'Botanical'], default: 'Gold', label: 'Palette' },
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function draw() {
  background(15);
  const colors = palettes[params.palette] || palettes.Gold;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = min(width, height) * 0.46;

  for (let arm = 0; arm < params.arms; arm++) {
    const armOffset = (TWO_PI / params.arms) * arm;
    for (let i = 0; i < params.density; i++) {
      const t = i / params.density;
      const angle = t * TWO_PI * 5 + armOffset;
      const r = maxR * pow(t, params.spread * 5);
      const x = cx + cos(angle) * r;
      const y = cy + sin(angle) * r;
      const c = colors[floor(t * colors.length)];

      if (params.style === 'Lines' || (params.style === 'Mixed' && i > 0)) {
        const prevT = (i - 1) / params.density;
        const prevAngle = prevT * TWO_PI * 5 + armOffset;
        const prevR = maxR * pow(prevT, params.spread * 5);
        const px = cx + cos(prevAngle) * prevR;
        const py = cy + sin(prevAngle) * prevR;
        stroke(c);
        strokeWeight(1.2);
        noFill();
        line(px, py, x, y);
      }
      if (params.style === 'Dots' || params.style === 'Mixed') {
        noStroke();
        fill(c);
        const dotSize = map(t, 0, 1, 1.5, 5);
        circle(x, y, dotSize);
      }
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); redraw(); }
function mousePressed() { randomSeed(millis()); noiseSeed(millis()); redraw(); }
`;

export const spiral: Template = {
  id: "spiral",
  name: "Spiral",
  description: "Logarithmic spirals branching into arms. Click to shift the seed.",
  schema: spiralSchema,
  code: spiralCode,
};
