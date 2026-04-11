import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const driftSchema: ParamSchema = {
  density: {
    type: "number", min: 100, max: 8000, default: 2000, step: 100, label: "Density",
  },
  speed: {
    type: "number", min: 0.2, max: 5.0, default: 1.0, step: 0.1, label: "Speed",
  },
  turbulence: {
    type: "number", min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: "Turbulence",
  },
  trail: {
    type: "number", min: 1, max: 80, default: 20, step: 1, label: "Trail Length",
  },
  palette: {
    type: "select",
    options: ["Arctic", "Sunset", "Mono", "Neon", "Earth", "Rose"],
    default: "Arctic",
    label: "Color Palette",
  },
  weight: {
    type: "number", min: 0.5, max: 6, default: 1.5, step: 0.5, label: "Weight",
  },
};

export const driftCode = `
const palettes = {
  Arctic:  ['#a8dadc', '#457b9d', '#1d3557', '#f1faee', '#e63946'],
  Sunset:  ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a659e'],
  Mono:    ['#ffffff', '#cccccc', '#999999', '#666666', '#333333'],
  Neon:    ['#ff006e', '#fb5607', '#ffbe0b', '#3a86ff', '#8338ec'],
  Earth:   ['#606c38', '#283618', '#fefae0', '#dda15e', '#bc6c25'],
  Rose:    ['#ffccd5', '#ff8fa3', '#ff758f', '#c9184a', '#590d22'],
};

const sharedPalette = (typeof ergon !== 'undefined' && ergon.palette) ? ergon.palette : null;
const sharedTempo = (typeof ergon !== 'undefined' && ergon.tempo !== undefined) ? ergon.tempo : 1;

const params = ergon.params({
  density:    { type: 'number', min: 100, max: 8000, default: 2000, step: 100, label: 'Density' },
  speed:      { type: 'number', min: 0.2, max: 5.0, default: 1.0, step: 0.1, label: 'Speed' },
  turbulence: { type: 'number', min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: 'Turbulence' },
  trail:      { type: 'number', min: 1, max: 80, default: 20, step: 1, label: 'Trail Length' },
  palette:    { type: 'select', options: ['Arctic', 'Sunset', 'Mono', 'Neon', 'Earth', 'Rose'], default: 'Arctic', label: 'Color Palette' },
  weight:     { type: 'number', min: 0.5, max: 6, default: 1.5, step: 0.5, label: 'Weight' },
});

let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  initParticles();
}

function initParticles() {
  particles = [];
  for (let i = 0; i < params.density; i++) {
    particles.push({ x: random(width), y: random(height) });
  }
}

function draw() {
  background(0, 0, 5, map(params.trail, 1, 80, 100, 2));

  while (particles.length < params.density) {
    particles.push({ x: random(width), y: random(height) });
  }
  if (particles.length > params.density) {
    particles.length = params.density;
  }

  const colors = (sharedPalette && sharedPalette.length >= 3) ? sharedPalette : (palettes[params.palette] || palettes.Arctic);
  noStroke();

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const angle = noise(p.x * params.turbulence, p.y * params.turbulence) * TWO_PI * 2;

    p.x += cos(angle) * params.speed * sharedTempo;
    p.y += sin(angle) * params.speed * sharedTempo;

    const colorIdx = floor(map(noise(p.x * 0.005, p.y * 0.005), 0, 1, 0, colors.length));
    const c = colors[constrain(colorIdx, 0, colors.length - 1)];
    fill(c);

    circle(p.x, p.y, params.weight);

    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
`;

export const drift: Template = {
  id: "drift",
  name: "Drift",
  description: "Particles flowing through a noise field. The hello world of generative art.",
  schema: driftSchema,
  code: driftCode,
  compositionHint: { blendMode: "screen", opacity: 0.6 },
};
