import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const marbleSchema: ParamSchema = {
  complexity: { type: "number", min: 1, max: 8, default: 4, step: 1, label: "Complexity" },
  scale: { type: "number", min: 0.001, max: 0.008, default: 0.003, step: 0.001, label: "Scale" },
  speed: { type: "number", min: 0, max: 2, default: 0.4, step: 0.1, label: "Speed" },
  saturation: { type: "number", min: 0, max: 100, default: 75, step: 5, label: "Saturation" },
  palette: { type: "select", options: ["Iridescent", "Chrome", "Ink", "Warm", "Cool"], default: "Iridescent", label: "Palette" },
};

export const marbleCode = `
const params = ergon.params({
  complexity:  { type: 'number', min: 1, max: 8, default: 4, step: 1, label: 'Complexity' },
  scale:       { type: 'number', min: 0.001, max: 0.008, default: 0.003, step: 0.001, label: 'Scale' },
  speed:       { type: 'number', min: 0, max: 2, default: 0.4, step: 0.1, label: 'Speed' },
  saturation:  { type: 'number', min: 0, max: 100, default: 75, step: 5, label: 'Saturation' },
  palette:     { type: 'select', options: ['Iridescent', 'Chrome', 'Ink', 'Warm', 'Cool'], default: 'Iridescent', label: 'Palette' },
});

let t = 0;
let pg;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelMode(1);
  colorMode(HSB, 360, 100, 100, 100);
  pg = createGraphics(floor(width / 2), floor(height / 2));
  pg.pixelDensity(1);
  pg.colorMode(HSB, 360, 100, 100, 100);
}

// Domain warping: feed noise into itself for organic distortion
function warp(x, y, z, octaves) {
  let wx = x, wy = y;
  for (let i = 0; i < octaves; i++) {
    const nx = noise(wx * 1.7 + 1.7, wy * 1.7 + 9.2, z) * 2 - 1;
    const ny = noise(wx * 1.7 + 5.3, wy * 1.7 + 1.3, z) * 2 - 1;
    wx = x + nx * 0.8;
    wy = y + ny * 0.8;
  }
  return noise(wx, wy, z);
}

function getColor(val) {
  const s = params.saturation;
  switch (params.palette) {
    case 'Chrome': {
      const b = map(val, 0, 1, 20, 100);
      const h = map(val, 0, 1, 200, 280);
      return [h, s * 0.3, b];
    }
    case 'Ink': {
      const b = map(val, 0, 1, 5, 95);
      return [220, s * 0.15, b];
    }
    case 'Warm': {
      const h = map(val, 0, 1, -20, 60);
      const b = map(sin(val * PI * 3), -1, 1, 40, 100);
      return [(h + 360) % 360, s, b];
    }
    case 'Cool': {
      const h = map(val, 0, 1, 180, 300);
      const b = map(sin(val * PI * 2.5), -1, 1, 30, 100);
      return [h, s * 0.8, b];
    }
    default: { // Iridescent
      const h = map(val, 0, 1, 0, 360) * 1.5 % 360;
      const b = map(sin(val * PI * 4), -1, 1, 30, 100);
      const sat = s * map(sin(val * PI * 6), -1, 1, 0.5, 1);
      return [h, sat, b];
    }
  }
}

function draw() {
  pg.loadPixels();
  const w = pg.width;
  const h = pg.height;
  const sc = params.scale;
  const oct = params.complexity;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const val = warp(x * sc, y * sc, t, oct);

      // Add specular-like highlights for glossy feel
      const highlight = pow(val, 3) * 0.3;
      const [hue, sat, bri] = getColor(val);

      pg.set(x, y, pg.color(hue, sat * (1 - highlight), min(bri + highlight * 100, 100)));
    }
  }
  pg.updatePixels();

  image(pg, 0, 0, width, height);
  t += params.speed * 0.003;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pg = createGraphics(floor(width / 2), floor(height / 2));
  pg.pixelDensity(1);
  pg.colorMode(HSB, 360, 100, 100, 100);
}
`;

export const marble: Template = {
  id: "marble",
  name: "Marble",
  description: "Liquid iridescence. Domain-warped noise creates flowing, chrome-like fluid forms.",
  schema: marbleSchema,
  code: marbleCode,
  compositionHint: { blendMode: "overlay", opacity: 0.7 },
};
