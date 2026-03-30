import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const wavesSchema: ParamSchema = {
  layers: {
    type: "number", min: 3, max: 20, default: 8, step: 1, label: "Layers",
  },
  amplitude: {
    type: "number", min: 10, max: 150, default: 50, step: 1, label: "Amplitude",
  },
  frequency: {
    type: "number", min: 0.5, max: 5, default: 2, step: 0.1, label: "Frequency",
  },
  speed: {
    type: "number", min: 0.2, max: 3, default: 1, step: 0.1, label: "Speed",
  },
  strokeColor: {
    type: "color", default: "#0a1628", label: "Stroke Color",
  },
  fill: {
    type: "boolean", default: true, label: "Fill",
  },
};

export const wavesCode = `
const params = ergon.params({
  layers:      { type: 'number', min: 3, max: 20, default: 8, step: 1, label: 'Layers' },
  amplitude:   { type: 'number', min: 10, max: 150, default: 50, step: 1, label: 'Amplitude' },
  frequency:   { type: 'number', min: 0.5, max: 5, default: 2, step: 0.1, label: 'Frequency' },
  speed:       { type: 'number', min: 0.2, max: 3, default: 1, step: 0.1, label: 'Speed' },
  strokeColor: { type: 'color', default: '#0a1628', label: 'Stroke Color' },
  fill:        { type: 'boolean', default: true, label: 'Fill' },
});

let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);
}

function draw() {
  background(245, 242, 235);
  t += 0.016 * params.speed;

  const sc = params.strokeColor;
  const sr = parseInt(sc.slice(1, 3), 16);
  const sg = parseInt(sc.slice(3, 5), 16);
  const sb = parseInt(sc.slice(5, 7), 16);

  for (let layer = 0; layer < params.layers; layer++) {
    const progress = layer / params.layers;
    const yBase = map(layer, 0, params.layers - 1, height * 0.1, height * 0.9);
    const alpha = map(layer, 0, params.layers - 1, 40, 200);
    const phase = layer * 0.4;
    const freq = params.frequency * 0.005;

    stroke(sr, sg, sb, alpha);
    strokeWeight(1.2);

    if (params.fill) {
      fill(sr, sg, sb, alpha * 0.25);
      beginShape();
      vertex(0, height);
      for (let x = 0; x <= width; x += 3) {
        const y = yBase + sin(x * freq + t + phase) * params.amplitude;
        vertex(x, y);
      }
      vertex(width, height);
      endShape(CLOSE);
    } else {
      noFill();
      beginShape();
      for (let x = 0; x <= width; x += 3) {
        const y = yBase + sin(x * freq + t + phase) * params.amplitude;
        vertex(x, y);
      }
      endShape();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
`;

export const waves: Template = {
  id: "waves",
  name: "Waves",
  description: "Layered sine waves stacked vertically. Toggle fill to switch between solid and outline styles.",
  schema: wavesSchema,
  code: wavesCode,
};
