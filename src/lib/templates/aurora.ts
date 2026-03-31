import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const auroraSchema: ParamSchema = {
  bands: {
    type: "number", min: 2, max: 8, default: 4, step: 1, label: "Bands",
  },
  speed: {
    type: "number", min: 0.2, max: 3, default: 1, step: 0.1, label: "Speed",
  },
  amplitude: {
    type: "number", min: 20, max: 200, default: 80, step: 1, label: "Amplitude",
  },
  gradient: {
    type: "gradient",
    default: [
      { color: "#00ff88", position: 0 },
      { color: "#0088ff", position: 0.5 },
      { color: "#8800ff", position: 1 },
    ],
    maxStops: 5,
    label: "Aurora Colors",
  },
};

export const auroraCode = `
const params = ergon.params({
  bands:     { type: 'number', min: 2, max: 8, default: 4, step: 1, label: 'Bands' },
  speed:     { type: 'number', min: 0.2, max: 3, default: 1, step: 0.1, label: 'Speed' },
  amplitude: { type: 'number', min: 20, max: 200, default: 80, step: 1, label: 'Amplitude' },
  gradient: {
    type: 'gradient',
    default: [
      { color: '#00ff88', position: 0 },
      { color: '#0088ff', position: 0.5 },
      { color: '#8800ff', position: 1 },
    ],
    maxStops: 5,
    label: 'Aurora Colors',
  },
});

let t = 0;

const sharedPalette = (typeof ergon !== 'undefined' && ergon.palette) ? ergon.palette : null;
const sharedTempo = (typeof ergon !== 'undefined' && ergon.tempo !== undefined) ? ergon.tempo : 1;

// Interpolate a color from the gradient stops at position t (0-1)
function sampleGradient(stops, pos) {
  if (!stops || stops.length === 0) return [0, 255, 136];
  const sorted = stops.slice().sort((a, b) => a.position - b.position);
  if (pos <= sorted[0].position) return hexToRgb(sorted[0].color);
  if (pos >= sorted[sorted.length - 1].position) return hexToRgb(sorted[sorted.length - 1].color);
  for (let i = 0; i < sorted.length - 1; i++) {
    const s0 = sorted[i];
    const s1 = sorted[i + 1];
    if (pos >= s0.position && pos <= s1.position) {
      const f = (pos - s0.position) / (s1.position - s0.position);
      const c0 = hexToRgb(s0.color);
      const c1 = hexToRgb(s1.color);
      return [
        lerp(c0[0], c1[0], f),
        lerp(c0[1], c1[1], f),
        lerp(c0[2], c1[2], f),
      ];
    }
  }
  return [0, 255, 136];
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function bandY(x, band, time) {
  const n1 = noise(x * 0.003 + band * 3.7, time * 0.01 * params.speed);
  const n2 = noise(x * 0.006 + band * 1.3, time * 0.02 * params.speed + 5);
  return (n1 * 0.7 + n2 * 0.3) * height * 0.5 + height * 0.1 + band * (height * 0.7 / params.bands);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);
}

function draw() {
  background(5, 5, 20, 30);
  t += sharedTempo;
  noStroke();

  for (let band = 0; band < params.bands; band++) {
    // If shared palette available, use it for band colors
    let bandColor;
    if (sharedPalette && sharedPalette.length > 0) {
      const idx = band % sharedPalette.length;
      bandColor = sharedPalette[idx];
    } else {
      // existing gradient sampling logic
      const gradPos = band / max(params.bands - 1, 1);
      bandColor = sampleGradient(params.gradient, gradPos);
    }
    const rgb = Array.isArray(bandColor) ? bandColor : hexToRgb(bandColor);
    const r = rgb[0], g = rgb[1], b = rgb[2];

    for (let x = 0; x < width; x += 6) {
      const midY = bandY(x, band, t);
      const hw = params.amplitude * noise(x * 0.004 + band * 2.1, t * 0.01 * params.speed + 10);
      const alpha = map(noise(x * 0.008, t * 0.005 * params.speed + band * 1.1), 0, 1, 10, 80);

      for (let dy = -hw; dy <= hw; dy += 2) {
        const fade = 1 - abs(dy) / max(hw, 1);
        fill(r, g, b, alpha * fade * 0.7);
        rect(x, midY + dy, 6, 2);
      }
    }
  }

  // Stars
  fill(255, 255, 255, 50);
  randomSeed(42);
  for (let i = 0; i < 80; i++) {
    circle(random(width), random(height * 0.75), random(0.5, 1.5));
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
`;

export const aurora: Template = {
  id: "aurora",
  name: "Aurora",
  description: "Flowing aurora-like bands with gradient colors drifting through a noise field.",
  schema: auroraSchema,
  code: auroraCode,
  compositionHint: { blendMode: "screen", opacity: 0.7 },
};
