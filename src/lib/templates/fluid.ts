import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const fluidSchema: ParamSchema = {
  resolution: {
    type: "number", min: 20, max: 80, default: 40, step: 2, label: "Resolution",
  },
  waveHeight: {
    type: "number", min: 10, max: 150, default: 60, label: "Wave Height",
  },
  speed: {
    type: "number", min: 0.2, max: 3.0, default: 1.0, step: 0.1, label: "Speed",
  },
  viscosity: {
    type: "number", min: 0.5, max: 4.0, default: 1.5, step: 0.1, label: "Viscosity",
  },
  material: {
    type: "select",
    options: ["Water", "Mercury", "Lava", "Glass", "Ink"],
    default: "Water",
    label: "Material",
  },
};

export const fluidCode = `
const params = ergon.params({
  resolution: { type: 'number', min: 20, max: 80, default: 40, step: 2, label: 'Resolution' },
  waveHeight:  { type: 'number', min: 10, max: 150, default: 60, label: 'Wave Height' },
  speed:       { type: 'number', min: 0.2, max: 3.0, default: 1.0, step: 0.1, label: 'Speed' },
  viscosity:   { type: 'number', min: 0.5, max: 4.0, default: 1.5, step: 0.1, label: 'Viscosity' },
  material:    { type: 'select', options: ['Water', 'Mercury', 'Lava', 'Glass', 'Ink'], default: 'Water', label: 'Material' },
});

const pal = (typeof ergon !== 'undefined' && ergon.palette) ? ergon.palette : null;
const sharedTempo = (typeof ergon !== 'undefined' && ergon.tempo !== undefined) ? ergon.tempo : 1;

let t = 0;
let autoRot = 0;

// Material definitions: [specR, specG, specB, shininess, ambR, ambG, ambB]
const MATERIALS = {
  Water:   { spec: [60, 140, 200],  shine: 60,  amb: [10, 20, 40],   point: [100, 180, 255] },
  Mercury: { spec: [230, 235, 245], shine: 120, amb: [15, 15, 20],   point: [255, 255, 255] },
  Lava:    { spec: [220, 80, 20],   shine: 25,  amb: [40, 10, 5],    point: [255, 120, 0]   },
  Glass:   { spec: [210, 230, 245], shine: 200, amb: [5, 8, 12],     point: [200, 220, 255] },
  Ink:     { spec: [60, 50, 130],   shine: 45,  amb: [8, 5, 15],     point: [80, 60, 200]   },
};

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
}

function draw() {
  t += 0.008 * params.speed * sharedTempo;
  autoRot += 0.002;

  const mat = MATERIALS[params.material] || MATERIALS.Water;

  background(mat.amb[0], mat.amb[1], mat.amb[2]);

  // Lighting rig
  ambientLight(mat.amb[0] * 3, mat.amb[1] * 3, mat.amb[2] * 3);
  directionalLight(255, 245, 230, 0.3, -0.8, -0.6);
  pointLight(mat.point[0], mat.point[1], mat.point[2], -300, -400, 300);
  pointLight(mat.point[0] * 0.4, mat.point[1] * 0.4, mat.point[2] * 0.6, 400, 200, -100);

  // Tilt the camera for a dramatic pool perspective
  rotateX(-0.55);
  rotateY(autoRot);

  // Material surface
  specularMaterial(mat.spec[0], mat.spec[1], mat.spec[2]);
  shininess(mat.shine);

  const res = params.resolution;
  const size = min(width, height) * 0.85;
  const cellW = size / res;
  const cellH = size / res;
  const halfSize = size * 0.5;

  // Normalised mouse position for ripple origin
  const mx = (mouseX - width * 0.5) / width;
  const my = (mouseY - height * 0.5) / height;

  // Render grid as horizontal TRIANGLE_STRIP rows
  for (let row = 0; row < res; row++) {
    beginShape(TRIANGLE_STRIP);
    for (let col = 0; col <= res; col++) {
      for (const r of [row, row + 1]) {
        const px = col * cellW - halfSize;
        const py = r   * cellH - halfSize;

        // Normalised grid position [-0.5, 0.5]
        const nx = col / res - 0.5;
        const ny = r   / res - 0.5;

        // Layered Perlin waves for complex fluid motion
        const wave1 = noise(nx * params.viscosity + t,        ny * params.viscosity - t * 0.8) - 0.5;
        const wave2 = noise(nx * params.viscosity * 1.9 - t * 0.6, ny * params.viscosity * 1.9 + t * 1.1) - 0.5;
        const wave3 = noise(nx * params.viscosity * 3.7 + t * 1.4, ny * params.viscosity * 3.7 - t * 0.3) - 0.5;

        // Mouse ripple — decaying sine expanding from cursor position
        const mouseDist = dist(nx, ny, mx * 0.5, my * 0.5);
        const ripple = sin(mouseDist * 18 - t * 6) * max(0, 1 - mouseDist * 3.5) * 0.4;

        const h = (wave1 * 0.55 + wave2 * 0.3 + wave3 * 0.15 + ripple) * params.waveHeight;

        vertex(px, py, h);
      }
    }
    endShape();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
`;

export const fluid: Template = {
  id: "fluid",
  name: "Fluid",
  description: "A 3D liquid surface pulsing with layered Perlin waves. Mouse creates ripples across water, mercury, lava, or ink.",
  schema: fluidSchema,
  code: fluidCode,
  compositionHint: { blendMode: "normal", opacity: 1.0 },
};
