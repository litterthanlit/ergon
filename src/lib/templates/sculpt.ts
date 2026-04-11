import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const sculptSchema: ParamSchema = {
  detail: {
    type: "number", min: 4, max: 40, default: 20, step: 1, label: "Detail",
  },
  displacement: {
    type: "number", min: 10, max: 200, default: 80, label: "Displacement",
  },
  speed: {
    type: "number", min: 0.1, max: 3.0, default: 0.5, step: 0.1, label: "Speed",
  },
  smoothness: {
    type: "number", min: 0.5, max: 5.0, default: 2.0, step: 0.1, label: "Smoothness",
  },
  palette: {
    type: "select",
    options: ["Clay", "Stone", "Chrome", "Obsidian", "Ice"],
    default: "Clay",
    label: "Material",
  },
};

export const sculptCode = `
const params = ergon.params({
  detail:       { type: 'number', min: 4, max: 40, default: 20, step: 1, label: 'Detail' },
  displacement: { type: 'number', min: 10, max: 200, default: 80, label: 'Displacement' },
  speed:        { type: 'number', min: 0.1, max: 3.0, default: 0.5, step: 0.1, label: 'Speed' },
  smoothness:   { type: 'number', min: 0.5, max: 5.0, default: 2.0, step: 0.1, label: 'Smoothness' },
  palette:      { type: 'select', options: ['Clay', 'Stone', 'Chrome', 'Obsidian', 'Ice'], default: 'Clay', label: 'Material' },
});

const pal = (typeof ergon !== 'undefined' && ergon.palette) ? ergon.palette : null;
const sharedTempo = (typeof ergon !== 'undefined' && ergon.tempo !== undefined) ? ergon.tempo : 1;

let t = 0;
let rotX = 0, rotY = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
}

function draw() {
  t += 0.005 * params.speed + 0.003 * sharedTempo;

  background(10);

  // Gentle auto-rotation + mouse orbit
  rotX += (mouseY / height - 0.5) * 0.02;
  rotY += (mouseX / width - 0.5) * 0.02;
  rotateX(rotX * 0.3);
  rotateY(rotY * 0.3 + t * 0.1);

  // Layered lighting for sculptural depth
  ambientLight(30);
  directionalLight(255, 250, 240, 0.5, -1, -0.5);
  pointLight(200, 200, 255, -200, -200, 200);
  pointLight(80, 60, 40, 300, 300, -100);

  // Material color based on palette
  const colors = {
    Clay:     [180, 140, 100],
    Stone:    [160, 160, 155],
    Chrome:   [220, 220, 230],
    Obsidian: [40, 35, 50],
    Ice:      [180, 210, 240],
  };
  const shineMap = {
    Clay: 8, Stone: 15, Chrome: 80, Obsidian: 40, Ice: 60,
  };
  const c = colors[params.palette] || (pal ? [parseInt(pal[2].slice(1,3),16), parseInt(pal[2].slice(3,5),16), parseInt(pal[2].slice(5,7),16)] : [180, 140, 100]);
  specularMaterial(c[0], c[1], c[2]);
  shininess(shineMap[params.palette] || 20);

  // Deformable sphere using TRIANGLE_STRIP bands
  const detail = params.detail;
  const radius = min(width, height) * 0.3;

  // Mouse influence — projects roughly onto the sphere face
  const mx = (mouseX - width * 0.5) / width;
  const my = (mouseY - height * 0.5) / height;

  for (let i = 0; i < detail; i++) {
    const lat1 = map(i,     0, detail, -HALF_PI, HALF_PI);
    const lat2 = map(i + 1, 0, detail, -HALF_PI, HALF_PI);

    beginShape(TRIANGLE_STRIP);
    for (let j = 0; j <= detail; j++) {
      const lon = map(j, 0, detail, -PI, PI);

      for (const lat of [lat1, lat2]) {
        const x = cos(lat) * cos(lon);
        const y = sin(lat);
        const z = cos(lat) * sin(lon);

        // Layered noise for rich organic deformation
        const n =
          noise(x * params.smoothness + t,       y * params.smoothness + t * 0.7, z * params.smoothness + t * 0.5) * 0.6 +
          noise(x * params.smoothness * 2 + t * 1.3, y * params.smoothness * 2,  z * params.smoothness * 2 - t * 0.4) * 0.3 +
          noise(x * params.smoothness * 4 - t * 0.8, y * params.smoothness * 4,  z * params.smoothness * 4 + t * 0.6) * 0.1;

        // Mouse proximity boost — finger pushes nearby surface outward
        const mouseDist = dist(x * 0.5, y * 0.5, mx, my);
        const mouseInfluence = max(0, 1 - mouseDist * 2.5) * 0.35;

        const d = radius + (n - 0.5) * params.displacement + mouseInfluence * params.displacement;

        vertex(x * d, y * d, z * d);
      }
    }
    endShape();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
`;

export const sculpt: Template = {
  id: "sculpt",
  name: "Sculpt",
  description: "A deformable 3D blob shaped by Perlin noise. Mouse pushes the surface like clay — organic, tactile, alive.",
  schema: sculptSchema,
  code: sculptCode,
  compositionHint: { blendMode: "normal", opacity: 1.0 },
};
