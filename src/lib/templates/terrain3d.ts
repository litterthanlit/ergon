import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const terrain3dSchema: ParamSchema = {
  resolution: {
    type: "number", min: 20, max: 80, default: 40, step: 2, label: "Resolution",
  },
  height: {
    type: "number", min: 20, max: 200, default: 100, label: "Height",
  },
  erosion: {
    type: "number", min: 0.5, max: 5.0, default: 2.0, step: 0.1, label: "Erosion",
  },
  speed: {
    type: "number", min: 0.1, max: 2.0, default: 0.3, step: 0.1, label: "Drift Speed",
  },
  wireframe: {
    type: "boolean", default: false, label: "Wireframe",
  },
  colorMode: {
    type: "select",
    options: ["Elevation", "Thermal", "Mono", "Ice"],
    default: "Elevation",
    label: "Color Mode",
  },
};

export const terrain3dCode = `
const sharedPalette = (typeof ergon !== 'undefined' && ergon.palette) ? ergon.palette : null;
const sharedTempo = (typeof ergon !== 'undefined' && ergon.tempo !== undefined) ? ergon.tempo : 1;

const params = ergon.params({
  resolution: { type: 'number', min: 20, max: 80, default: 40, step: 2, label: 'Resolution' },
  height:     { type: 'number', min: 20, max: 200, default: 100, label: 'Height' },
  erosion:    { type: 'number', min: 0.5, max: 5.0, default: 2.0, step: 0.1, label: 'Erosion' },
  speed:      { type: 'number', min: 0.1, max: 2.0, default: 0.3, step: 0.1, label: 'Drift Speed' },
  wireframe:  { type: 'boolean', default: false, label: 'Wireframe' },
  colorMode:  { type: 'select', options: ['Elevation', 'Thermal', 'Mono', 'Ice'], default: 'Elevation', label: 'Color Mode' },
});

let timeOffset = 0;
// Mouse sculpt influence: accumulates raised terrain under cursor
let sculptMap = [];
let lastRes = -1;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(RGB, 255, 255, 255, 255);
  initSculpt();
}

function initSculpt() {
  const res = params.resolution;
  sculptMap = new Array((res + 1) * (res + 1)).fill(0);
  lastRes = res;
}

function draw() {
  const res = params.resolution;
  if (res !== lastRes) initSculpt();

  background(8, 10, 18);

  // Camera: tilt ~30 deg, looking down at terrain
  const camDist = 420;
  const camAngle = radians(58);
  camera(0, -camDist * sin(camAngle), camDist * cos(camAngle),
         0, 0, 0,
         0, 1, 0);

  timeOffset += 0.005 * params.speed * sharedTempo;

  const gridSize = min(width, height) * 0.72;
  const cellSize = gridSize / res;
  const halfGrid = gridSize / 2;

  // Project mouse into terrain plane (approximate: map screen to terrain XZ)
  const mx = mouseX - width / 2;
  const my = mouseY - height / 2;
  // Approximate terrain-space position from screen coords
  const terrainMX = mx * (gridSize / width) * 1.6;
  const terrainMZ = my * (gridSize / height) * 2.2 + halfGrid * 0.3;
  const sculptRadius = cellSize * 3.5;
  const sculptStrength = 0.18;

  // Decay and accumulate sculpt influence
  for (let i = 0; i < sculptMap.length; i++) {
    sculptMap[i] *= 0.97;
  }

  // Raise terrain under mouse
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    for (let zi = 0; zi <= res; zi++) {
      for (let xi = 0; xi <= res; xi++) {
        const wx = xi * cellSize - halfGrid;
        const wz = zi * cellSize - halfGrid;
        const dx = wx - terrainMX;
        const dz = wz - terrainMZ;
        const d = sqrt(dx * dx + dz * dz);
        if (d < sculptRadius) {
          const falloff = (1 - d / sculptRadius) ** 2;
          sculptMap[zi * (res + 1) + xi] += falloff * sculptStrength * params.height;
        }
      }
    }
  }

  // Sample height at grid vertex
  function getHeight(xi, zi) {
    const nx = (xi / res) * params.erosion + timeOffset;
    const nz = (zi / res) * params.erosion;
    // Layered noise for organic terrain
    let h = noise(nx, nz) * 0.6;
    h += noise(nx * 2.1, nz * 2.1 + 100) * 0.25;
    h += noise(nx * 4.3, nz * 4.3 + 200) * 0.15;
    h = h * params.height;
    h += constrain(sculptMap[zi * (res + 1) + xi], 0, params.height * 0.8);
    return -h; // negative = up in WEBGL Y-axis
  }

  // Map height to color
  function heightColor(h, maxH) {
    const t = constrain(-h / maxH, 0, 1); // t=0 low, t=1 high
    let r, g, b;
    if (params.colorMode === 'Elevation') {
      if (t < 0.4) {
        // Green low
        r = lerp(20, 80, t / 0.4);
        g = lerp(80, 120, t / 0.4);
        b = lerp(30, 50, t / 0.4);
      } else if (t < 0.75) {
        // Brown mid
        const tt = (t - 0.4) / 0.35;
        r = lerp(80, 140, tt);
        g = lerp(120, 100, tt);
        b = lerp(50, 70, tt);
      } else {
        // White peak
        const tt = (t - 0.75) / 0.25;
        r = lerp(140, 255, tt);
        g = lerp(100, 255, tt);
        b = lerp(70, 255, tt);
      }
    } else if (params.colorMode === 'Thermal') {
      if (t < 0.5) {
        // Blue cold to red hot
        const tt = t / 0.5;
        r = lerp(20, 220, tt);
        g = lerp(40, 60, tt);
        b = lerp(180, 30, tt);
      } else {
        // Red hot to white peak
        const tt = (t - 0.5) / 0.5;
        r = lerp(220, 255, tt);
        g = lerp(60, 255, tt);
        b = lerp(30, 255, tt);
      }
    } else if (params.colorMode === 'Mono') {
      const v = floor(lerp(20, 255, t));
      r = v; g = v; b = v;
    } else {
      // Ice: dark blue to white
      if (t < 0.6) {
        const tt = t / 0.6;
        r = lerp(10, 80, tt);
        g = lerp(20, 160, tt);
        b = lerp(60, 220, tt);
      } else {
        const tt = (t - 0.6) / 0.4;
        r = lerp(80, 240, tt);
        g = lerp(160, 245, tt);
        b = lerp(220, 255, tt);
      }
    }
    // Tint with shared palette accent on high terrain
    if (sharedPalette && sharedPalette.length >= 1 && t > 0.8) {
      const ac = sharedPalette[0];
      if (ac && ac.startsWith('#') && ac.length >= 7) {
        const ar = parseInt(ac.slice(1, 3), 16);
        const ag = parseInt(ac.slice(3, 5), 16);
        const ab = parseInt(ac.slice(5, 7), 16);
        const blend = (t - 0.8) / 0.2 * 0.3;
        r = lerp(r, ar, blend);
        g = lerp(g, ag, blend);
        b = lerp(b, ab, blend);
      }
    }
    return [r, g, b];
  }

  const maxH = params.height;
  noStroke();

  if (params.wireframe) {
    // Wireframe: draw grid lines
    noFill();
    strokeWeight(0.8);
    for (let zi = 0; zi < res; zi++) {
      for (let xi = 0; xi < res; xi++) {
        const x0 = xi * cellSize - halfGrid;
        const z0 = zi * cellSize - halfGrid;
        const x1 = x0 + cellSize;
        const z1 = z0 + cellSize;
        const h00 = getHeight(xi, zi);
        const h10 = getHeight(xi + 1, zi);
        const h01 = getHeight(xi, zi + 1);
        const h11 = getHeight(xi + 1, zi + 1);
        const avgH = (h00 + h10 + h01 + h11) / 4;
        const [wr, wg, wb] = heightColor(avgH, maxH);
        stroke(wr, wg, wb, 180);
        line(x0, h00, z0, x1, h10, z0);
        line(x0, h00, z0, x0, h01, z1);
      }
    }
    // Last column & row edges
    for (let zi = 0; zi < res; zi++) {
      const x0 = res * cellSize - halfGrid;
      const z0 = zi * cellSize - halfGrid;
      const h00 = getHeight(res, zi);
      const h01 = getHeight(res, zi + 1);
      const [wr, wg, wb] = heightColor(h00, maxH);
      stroke(wr, wg, wb, 180);
      line(x0, h00, z0, x0, h01, z0 + cellSize);
    }
    for (let xi = 0; xi < res; xi++) {
      const x0 = xi * cellSize - halfGrid;
      const z0 = res * cellSize - halfGrid;
      const h00 = getHeight(xi, res);
      const h10 = getHeight(xi + 1, res);
      const [wr, wg, wb] = heightColor(h00, maxH);
      stroke(wr, wg, wb, 180);
      line(x0, h00, z0, x0 + cellSize, h10, z0);
    }
  } else {
    // Solid: draw triangles with per-vertex color via vertex color
    beginShape(TRIANGLES);
    for (let zi = 0; zi < res; zi++) {
      for (let xi = 0; xi < res; xi++) {
        const x0 = xi * cellSize - halfGrid;
        const z0 = zi * cellSize - halfGrid;
        const x1 = x0 + cellSize;
        const z1 = z0 + cellSize;
        const h00 = getHeight(xi, zi);
        const h10 = getHeight(xi + 1, zi);
        const h01 = getHeight(xi, zi + 1);
        const h11 = getHeight(xi + 1, zi + 1);

        const [r00, g00, b00] = heightColor(h00, maxH);
        const [r10, g10, b10] = heightColor(h10, maxH);
        const [r01, g01, b01] = heightColor(h01, maxH);
        const [r11, g11, b11] = heightColor(h11, maxH);

        // Triangle 1: (0,0),(1,0),(0,1)
        fill(r00, g00, b00); vertex(x0, h00, z0);
        fill(r10, g10, b10); vertex(x1, h10, z0);
        fill(r01, g01, b01); vertex(x0, h01, z1);

        // Triangle 2: (1,0),(1,1),(0,1)
        fill(r10, g10, b10); vertex(x1, h10, z0);
        fill(r11, g11, b11); vertex(x1, h11, z1);
        fill(r01, g01, b01); vertex(x0, h01, z1);
      }
    }
    endShape();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initSculpt();
}
`;

export const terrain3d: Template = {
  id: "terrain3d",
  name: "Terrain3D",
  description: "A sculptable 3D landscape — layered noise terrain you can press into like clay. Mouse raises the ground.",
  schema: terrain3dSchema,
  code: terrain3dCode,
  compositionHint: { blendMode: "normal", opacity: 1.0 },
};
