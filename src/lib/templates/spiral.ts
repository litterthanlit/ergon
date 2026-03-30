import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const spiralSchema: ParamSchema = {
  arms: {
    type: "number", min: 1, max: 12, default: 5, step: 1, label: "Arms",
  },
  tightness: {
    type: "number", min: 0.01, max: 0.3, default: 0.1, step: 0.01, label: "Tightness",
  },
  points: {
    type: "number", min: 100, max: 3000, default: 1000, step: 100, label: "Points",
  },
  dotSize: {
    type: "number", min: 1, max: 10, default: 3, step: 0.5, label: "Dot Size",
  },
  rotation: {
    type: "number", min: 0, max: 360, default: 0, step: 1, label: "Rotation",
  },
  hueShift: {
    type: "number", min: 0, max: 360, default: 180, step: 1, label: "Hue Shift",
  },
};

export const spiralCode = `
const params = ergon.params({
  arms:      { type: 'number', min: 1, max: 12, default: 5, step: 1, label: 'Arms' },
  tightness: { type: 'number', min: 0.01, max: 0.3, default: 0.1, step: 0.01, label: 'Tightness' },
  points:    { type: 'number', min: 100, max: 3000, default: 1000, step: 100, label: 'Points' },
  dotSize:   { type: 'number', min: 1, max: 10, default: 3, step: 0.5, label: 'Dot Size' },
  rotation:  { type: 'number', min: 0, max: 360, default: 0, step: 1, label: 'Rotation' },
  hueShift:  { type: 'number', min: 0, max: 360, default: 180, step: 1, label: 'Hue Shift' },
});

let offsets = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noLoop();
  initOffsets();
}

function initOffsets() {
  offsets = [];
  for (let a = 0; a < 12; a++) {
    offsets.push(random(TWO_PI));
  }
}

function draw() {
  background(0, 0, 8);
  const cx = width / 2;
  const cy = height / 2;
  const maxR = min(width, height) * 0.45;
  const rotRad = radians(params.rotation);

  for (let arm = 0; arm < params.arms; arm++) {
    const armAngle = (TWO_PI / params.arms) * arm + rotRad + (offsets[arm] || 0);

    for (let i = 0; i < params.points; i++) {
      const t = i / params.points;
      // Archimedean spiral: r grows linearly with angle
      const turns = 1 / params.tightness;
      const angle = t * TWO_PI * turns + armAngle;
      const r = maxR * t;
      const x = cx + cos(angle) * r;
      const y = cy + sin(angle) * r;

      const hue = (t * params.hueShift + arm * (params.hueShift / params.arms)) % 360;
      const sat = map(t, 0, 1, 60, 100);
      const bri = map(t, 0, 1, 100, 70);
      fill(hue, sat, bri, 85);
      noStroke();
      circle(x, y, params.dotSize);
    }
  }
}

function mousePressed() {
  initOffsets();
  redraw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}
`;

export const spiral: Template = {
  id: "spiral",
  name: "Spiral",
  description: "Mathematical spiral patterns with HSB color mapping across arms. Click to randomize.",
  schema: spiralSchema,
  code: spiralCode,
};
