import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const auroraSchema: ParamSchema = {
  bands: { type: "number", min: 2, max: 8, default: 4, step: 1, label: "Bands" },
  shimmer: { type: "number", min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: "Shimmer" },
  opacity: { type: "number", min: 20, max: 120, default: 60, step: 5, label: "Opacity" },
  style: { type: "select", options: ["Curtain", "Ribbons", "Rays", "Veil"], default: "Curtain", label: "Style" },
  palette: { type: "select", options: ["Boreal", "Tropical", "Crimson", "Solar", "Void"], default: "Boreal", label: "Palette" },
};

export const auroraCode = `
const palettes = {
  Boreal:   ['#00ff87', '#00bfff', '#7b2fff', '#ff00c8', '#00ffd5'],
  Tropical: ['#f7971e', '#ffd200', '#00c9ff', '#92fe9d', '#ff6fd8'],
  Crimson:  ['#ff416c', '#ff4b2b', '#f953c6', '#b91d73', '#ff0099'],
  Solar:    ['#f7971e', '#ffd200', '#ff6a00', '#ee0979', '#ff6fd8'],
  Void:     ['#4776e6', '#8e54e9', '#00b4db', '#0083b0', '#c471ed'],
};

const params = ergon.params({
  bands:   { type: 'number', min: 2, max: 8, default: 4, step: 1, label: 'Bands' },
  shimmer: { type: 'number', min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: 'Shimmer' },
  opacity: { type: 'number', min: 20, max: 120, default: 60, step: 5, label: 'Opacity' },
  style:   { type: 'select', options: ['Curtain', 'Ribbons', 'Rays', 'Veil'], default: 'Curtain', label: 'Style' },
  palette: { type: 'select', options: ['Boreal', 'Tropical', 'Crimson', 'Solar', 'Void'], default: 'Boreal', label: 'Palette' },
});

let t = 0;

function bandY(x, band, time) {
  const n1 = noise(x * 0.003 + band * 3.7, time * params.shimmer);
  const n2 = noise(x * 0.006 + band * 1.3, time * params.shimmer * 2 + 5);
  return (n1 * 0.7 + n2 * 0.3) * height * 0.6 + height * 0.1 + band * (height * 0.1);
}

function bandWidth(x, band, time) {
  return noise(x * 0.004 + band * 2.1, time * params.shimmer + 10) * height * 0.12 + 20;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);
}

function draw() {
  background(5, 5, 20, 30);
  t++;
  const colors = palettes[params.palette] || palettes.Boreal;

  for (let band = 0; band < params.bands; band++) {
    const col = colors[band % colors.length];
    const r = parseInt(col.slice(1, 3), 16);
    const g = parseInt(col.slice(3, 5), 16);
    const b = parseInt(col.slice(5, 7), 16);

    if (params.style === 'Rays') {
      // vertical ray columns
      for (let x = 0; x < width; x += 8) {
        const cy = bandY(x, band, t);
        const bw = bandWidth(x, band, t);
        const alpha = map(noise(x * 0.01, t * params.shimmer + band), 0, 1, 0, params.opacity);
        stroke(r, g, b, alpha);
        strokeWeight(3);
        line(x, cy - bw, x, cy + bw);
      }
    } else if (params.style === 'Ribbons') {
      // thin flowing curves stacked
      for (let offset = -2; offset <= 2; offset++) {
        noFill();
        stroke(r, g, b, params.opacity * 0.4);
        strokeWeight(1.5);
        beginShape();
        for (let x = 0; x <= width; x += 6) {
          const cy = bandY(x, band, t) + offset * 8;
          vertex(x, cy);
        }
        endShape();
      }
    } else {
      // Curtain / Veil: filled shape between two noise curves
      const thicknessMod = params.style === 'Veil' ? 2.5 : 1.0;
      noStroke();

      // Draw as a series of thin vertical strips for smooth alpha gradient
      for (let x = 0; x < width; x += 4) {
        const midY = bandY(x, band, t);
        const hw = bandWidth(x, band, t) * thicknessMod;
        const alpha = map(noise(x * 0.008, t * params.shimmer * 0.5 + band * 1.1), 0, 1, 10, params.opacity);

        for (let dy = -hw; dy <= hw; dy += 2) {
          const fade = 1 - abs(dy) / hw;
          fill(r, g, b, alpha * fade * 0.6);
          rect(x, midY + dy, 4, 2);
        }
      }
    }
  }

  // stars in the background
  noStroke();
  fill(255, 255, 255, 60);
  randomSeed(99);
  for (let i = 0; i < 80; i++) {
    const sx = random(width);
    const sy = random(height * 0.7);
    circle(sx, sy, random(0.5, 1.5));
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
`;

export const aurora: Template = {
  id: "aurora",
  name: "Aurora",
  description: "Northern lights rendered as noise-shaped color bands drifting across the sky.",
  schema: auroraSchema,
  code: auroraCode,
};
