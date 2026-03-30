import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const contourSchema: ParamSchema = {
  lines: { type: "number", min: 20, max: 200, default: 80, step: 1, label: "Lines" },
  amplitude: { type: "number", min: 10, max: 200, default: 80, step: 1, label: "Amplitude" },
  noiseScale: { type: "number", min: 0.001, max: 0.015, default: 0.004, step: 0.001, label: "Noise Scale" },
  weight: { type: "number", min: 0.3, max: 4, default: 1, step: 0.1, label: "Weight" },
  speed: { type: "number", min: 0, max: 2, default: 0.3, step: 0.1, label: "Speed" },
  invert: { type: "boolean", default: false, label: "Invert" },
};

export const contourCode = `
const params = ergon.params({
  lines:      { type: 'number', min: 20, max: 200, default: 80, step: 1, label: 'Lines' },
  amplitude:  { type: 'number', min: 10, max: 200, default: 80, step: 1, label: 'Amplitude' },
  noiseScale: { type: 'number', min: 0.001, max: 0.015, default: 0.004, step: 0.001, label: 'Noise Scale' },
  weight:     { type: 'number', min: 0.3, max: 4, default: 1, step: 0.1, label: 'Weight' },
  speed:      { type: 'number', min: 0, max: 2, default: 0.3, step: 0.1, label: 'Speed' },
  invert:     { type: 'boolean', default: false, label: 'Invert' },
});

let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  if (params.speed === 0) noLoop();
}

function draw() {
  const bg = params.invert ? 0 : 255;
  const fg = params.invert ? 255 : 0;
  background(bg);
  stroke(fg);
  strokeWeight(params.weight);
  noFill();

  const spacing = height / (params.lines + 1);

  for (let i = 1; i <= params.lines; i++) {
    const baseY = i * spacing;
    beginShape();
    for (let x = 0; x <= width; x += 3) {
      // Multiple octaves of noise for rich displacement
      const n1 = noise(x * params.noiseScale, i * 0.15, t);
      const n2 = noise(x * params.noiseScale * 2.5, i * 0.15 + 100, t * 0.7);
      const displacement = (n1 - 0.5) * params.amplitude * 2 + (n2 - 0.5) * params.amplitude * 0.8;

      // Extra displacement in center creates the dramatic valleys
      const centerPull = sin(x / width * PI) * 0.5 + 0.5;
      const y = baseY + displacement * (0.5 + centerPull);

      vertex(x, y);
    }
    endShape();
  }

  t += params.speed * 0.005;
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
function mousePressed() { if (params.speed === 0) { noiseSeed(millis()); redraw(); } }
`;

export const contour: Template = {
  id: "contour",
  name: "Contour",
  description: "Displacement lines. Where they bunch, darkness pools. Where they spread, light breathes.",
  schema: contourSchema,
  code: contourCode,
  compositionHint: { blendMode: "multiply", opacity: 0.8 },
};
