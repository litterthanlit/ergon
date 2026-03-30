import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const particlesSchema: ParamSchema = {
  count: {
    type: "number", min: 10, max: 300, default: 100, step: 1, label: "Count",
  },
  gravity: {
    type: "number", min: 0, max: 2, default: 0.1, step: 0.05, label: "Gravity",
  },
  friction: {
    type: "number", min: 0.9, max: 1.0, default: 0.98, step: 0.005, label: "Friction",
  },
  sizeRange: {
    type: "range", min: 2, max: 40, default: { min: 4, max: 20 }, label: "Size Range",
  },
  trailColor: {
    type: "color", default: "#1a1a1a", label: "Trail Color",
  },
  repel: {
    type: "boolean", default: false, label: "Repel",
  },
};

export const particlesCode = `
const params = ergon.params({
  count:      { type: 'number', min: 10, max: 300, default: 100, step: 1, label: 'Count' },
  gravity:    { type: 'number', min: 0, max: 2, default: 0.1, step: 0.05, label: 'Gravity' },
  friction:   { type: 'number', min: 0.9, max: 1.0, default: 0.98, step: 0.005, label: 'Friction' },
  sizeRange:  { type: 'range', min: 2, max: 40, default: { min: 4, max: 20 }, label: 'Size Range' },
  trailColor: { type: 'color', default: '#1a1a1a', label: 'Trail Color' },
  repel:      { type: 'boolean', default: false, label: 'Repel' },
});

let particles = [];

function makeParticle() {
  return {
    x: random(width),
    y: random(height),
    vx: random(-2, 2),
    vy: random(-2, 2),
    size: random(params.sizeRange.min, params.sizeRange.max),
    hue: random(360),
  };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  for (let i = 0; i < params.count; i++) {
    particles.push(makeParticle());
  }
}

function draw() {
  // Trail effect using trailColor
  const tc = params.trailColor;
  const r = parseInt(tc.slice(1, 3), 16);
  const g = parseInt(tc.slice(3, 5), 16);
  const b = parseInt(tc.slice(5, 7), 16);
  colorMode(RGB, 255);
  fill(r, g, b, 30);
  noStroke();
  rect(0, 0, width, height);
  colorMode(HSB, 360, 100, 100, 100);

  // Sync count
  while (particles.length < params.count) particles.push(makeParticle());
  if (particles.length > params.count) particles.length = params.count;

  const mx = mouseX;
  const my = mouseY;
  const direction = params.repel ? -1 : 1;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // Mouse attraction / repulsion
    const dx = mx - p.x;
    const dy = my - p.y;
    const dist = max(sqrt(dx * dx + dy * dy), 1);
    const force = (200 / (dist * dist)) * direction;
    p.vx += (dx / dist) * force;
    p.vy += (dy / dist) * force;

    // Gravity pulls down
    p.vy += params.gravity;

    // Friction
    p.vx *= params.friction;
    p.vy *= params.friction;

    p.x += p.vx;
    p.y += p.vy;

    // Wrap edges
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    // Update size from current sizeRange
    const sz = map(dist, 0, 300, params.sizeRange.max, params.sizeRange.min);
    const clampedSz = constrain(sz, params.sizeRange.min, params.sizeRange.max);

    noStroke();
    fill(p.hue, 80, 95, 90);
    circle(p.x, p.y, clampedSz);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
`;

export const particles: Template = {
  id: "particles",
  name: "Particles",
  description: "Mouse-driven particles attracted or repelled by your cursor, with variable sizes and trails.",
  schema: particlesSchema,
  code: particlesCode,
};
