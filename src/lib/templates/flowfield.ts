import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const flowfieldSchema: ParamSchema = {
  density: {
    type: "number", min: 50, max: 2000, default: 300, step: 1, label: "Density",
  },
  speed: {
    type: "number", min: 0.5, max: 5, default: 2, step: 0.1, label: "Speed",
  },
  noiseScale: {
    type: "number", min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: "Noise Scale",
  },
  lineWeight: {
    type: "number", min: 0.5, max: 4, default: 1, step: 0.5, label: "Line Weight",
  },
  palette: {
    type: "select",
    options: ["Ink", "Ocean", "Sunset", "Forest", "Mono"],
    default: "Ink",
    label: "Palette",
  },
  fadeRate: {
    type: "number", min: 1, max: 40, default: 8, step: 1, label: "Fade Rate",
  },
};

export const flowfieldCode = `
const palettes = {
  Ink:    ['#0d0d0d', '#1a1a2e', '#16213e', '#0f3460', '#533483'],
  Ocean:  ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
  Sunset: ['#ff6b35', '#f7c59f', '#ffbe0b', '#e63946', '#c9184a'],
  Forest: ['#1b4332', '#2d6a4f', '#40916c', '#74c69d', '#d8f3dc'],
  Mono:   ['#ffffff', '#cccccc', '#999999', '#666666', '#333333'],
};

const params = ergon.params({
  density:    { type: 'number', min: 50, max: 2000, default: 300, step: 1, label: 'Density' },
  speed:      { type: 'number', min: 0.5, max: 5, default: 2, step: 0.1, label: 'Speed' },
  noiseScale: { type: 'number', min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: 'Noise Scale' },
  lineWeight: { type: 'number', min: 0.5, max: 4, default: 1, step: 0.5, label: 'Line Weight' },
  palette:    { type: 'select', options: ['Ink', 'Ocean', 'Sunset', 'Forest', 'Mono'], default: 'Ink', label: 'Palette' },
  fadeRate:   { type: 'number', min: 1, max: 40, default: 8, step: 1, label: 'Fade Rate' },
});

let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);
  initParticles();
}

function initParticles() {
  particles = [];
  for (let i = 0; i < params.density; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      colorIdx: floor(random(5)),
    });
  }
}

function draw() {
  const alpha = map(params.fadeRate, 1, 40, 255, 6);
  background(10, 10, 20, alpha);

  while (particles.length < params.density) {
    particles.push({ x: random(width), y: random(height), colorIdx: floor(random(5)) });
  }
  if (particles.length > params.density) particles.length = params.density;

  const colors = palettes[params.palette] || palettes.Ink;
  strokeWeight(params.lineWeight);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const angle = noise(p.x * params.noiseScale, p.y * params.noiseScale) * TWO_PI * 2;
    const nx = p.x + cos(angle) * params.speed;
    const ny = p.y + sin(angle) * params.speed;

    const c = colors[p.colorIdx % colors.length];
    stroke(c);
    line(p.x, p.y, nx, ny);

    p.x = nx;
    p.y = ny;

    if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
      p.x = random(width);
      p.y = random(height);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initParticles();
}
`;

export const flowfield: Template = {
  id: "flowfield",
  name: "FlowField",
  description: "Organic flow lines trace paths through a Perlin noise vector field.",
  schema: flowfieldSchema,
  code: flowfieldCode,
  compositionHint: { blendMode: "screen", opacity: 0.7 },
};
