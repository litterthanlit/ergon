import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const pulseSchema: ParamSchema = {
  rings: { type: "number", min: 3, max: 30, default: 12, step: 1, label: "Rings" },
  tempo: { type: "number", min: 0.2, max: 4.0, default: 1.0, step: 0.1, label: "Tempo" },
  amplitude: { type: "number", min: 5, max: 120, default: 40, step: 1, label: "Amplitude" },
  colorShift: { type: "number", min: 0, max: 360, default: 0, step: 1, label: "Color Shift" },
  strokeWeight: { type: "number", min: 0.5, max: 6, default: 1.5, step: 0.5, label: "Stroke" },
};

export const pulseCode = `
const params = ergon.params({
  rings:        { type: 'number', min: 3, max: 30, default: 12, step: 1, label: 'Rings' },
  tempo:        { type: 'number', min: 0.2, max: 4.0, default: 1.0, step: 0.1, label: 'Tempo' },
  amplitude:    { type: 'number', min: 5, max: 120, default: 40, step: 1, label: 'Amplitude' },
  colorShift:   { type: 'number', min: 0, max: 360, default: 0, step: 1, label: 'Color Shift' },
  strokeWeight: { type: 'number', min: 0.5, max: 6, default: 1.5, step: 0.5, label: 'Stroke' },
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
}

function draw() {
  background(0, 0, 5);
  noFill();
  translate(width / 2, height / 2);
  for (let i = 0; i < params.rings; i++) {
    const phase = (i / params.rings) * TWO_PI;
    const baseRadius = map(i, 0, params.rings, 40, min(width, height) * 0.45);
    const radius = baseRadius + sin(frameCount * 0.02 * params.tempo + phase) * params.amplitude;
    const hue = (i / params.rings * params.colorShift) % 360;
    const alpha = map(i, 0, params.rings, 100, 30);
    stroke(hue, params.colorShift > 0 ? 60 : 0, 100, alpha);
    strokeWeight(params.strokeWeight);
    ellipse(0, 0, radius * 2);
  }
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }
`;

export const pulse: Template = {
  id: "pulse",
  name: "Pulse",
  description: "Concentric rings breathing with sine-wave rhythm. Time as a creative variable.",
  schema: pulseSchema,
  code: pulseCode,
};
