import type { BlockRole } from "./blocks";
import type { BlendMode } from "./layers";
import type { ParamValues } from "./types";

export type SharedDrivers = {
  palette: string[];
  seed: number;
  tempo: number;
};

export type RecipeBlock = {
  blockId: string;
  role: BlockRole;
  opacity: number;
  blendMode: BlendMode;
  paramOverrides?: Partial<ParamValues>;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  mood: string;
  blocks: RecipeBlock[];
  drivers: SharedDrivers;
};

export const recipes: Recipe[] = [
  {
    id: "aurora-night",
    name: "Aurora Night",
    description: "A dark wash of pigment, glow, and drifting breath.",
    mood: "dark",
    blocks: [
      { blockId: "contour", role: "base", opacity: 1.0, blendMode: "normal", paramOverrides: { lines: 30, noiseScale: 0.003 } },
      { blockId: "aurora", role: "color", opacity: 0.85, blendMode: "screen", paramOverrides: { bands: 5, amplitude: 120 } },
      { blockId: "drift", role: "motion", opacity: 0.4, blendMode: "screen", paramOverrides: { density: 800, speed: 0.8, trail: 50, weight: 1.0 } },
    ],
    drivers: {
      palette: ["#0d1117", "#00ffa3", "#0088ff", "#cc44ff", "#001a33"],
      seed: 42,
      tempo: 1.0,
    },
  },
  {
    id: "swiss-grid",
    name: "Swiss Grid",
    description: "A crisp editorial scaffold with restrained color interrupts.",
    mood: "light",
    blocks: [
      { blockId: "grid", role: "shape", opacity: 1.0, blendMode: "normal", paramOverrides: { columns: 16, rotation: 0, density: 0.9, shape: "Square", invert: false } },
      { blockId: "drift", role: "motion", opacity: 0.25, blendMode: "multiply", paramOverrides: { density: 400, speed: 0.3, turbulence: 0.003, trail: 60, weight: 2.0 } },
    ],
    drivers: {
      palette: ["#f5f5f0", "#1a1a1a", "#c4362c", "#2a5faa", "#e8b931"],
      seed: 7,
      tempo: 0.3,
    },
  },
  {
    id: "ink-flow",
    name: "Ink Flow",
    description: "Ink currents, soft bloom, and a slow meditative pulse.",
    mood: "dark",
    blocks: [
      { blockId: "contour", role: "base", opacity: 1.0, blendMode: "normal" },
      { blockId: "flowfield", role: "motion", opacity: 0.7, blendMode: "screen", paramOverrides: { density: 600, speed: 1.5, noiseScale: 0.008, lineWeight: 1.5, fadeRate: 15 } },
      { blockId: "bloom", role: "color", opacity: 0.3, blendMode: "screen", paramOverrides: { petals: 12, layers: 2, curvature: 0.4, style: "Lace" } },
    ],
    drivers: {
      palette: ["#0a0a0a", "#1a1a2e", "#4a4a6a", "#8888aa", "#e0ddd5"],
      seed: 13,
      tempo: 1.0,
    },
  },
  {
    id: "neon-pulse",
    name: "Neon Pulse",
    description: "A charged geometry of neon wash, pulse, and sparks.",
    mood: "dark",
    blocks: [
      { blockId: "mesh", role: "shape", opacity: 0.5, blendMode: "normal" },
      { blockId: "aurora", role: "color", opacity: 0.9, blendMode: "screen", paramOverrides: { bands: 6, speed: 2.0, amplitude: 100 } },
      { blockId: "particles", role: "motion", opacity: 0.5, blendMode: "screen", paramOverrides: { count: 150, gravity: 0.05, friction: 0.99, repel: false } },
    ],
    drivers: {
      palette: ["#0a0a0a", "#ff2d6b", "#00d4ff", "#ffe03d", "#a855f7"],
      seed: 99,
      tempo: 1.5,
    },
  },
  {
    id: "soft-fields",
    name: "Soft Fields",
    description: "A pastel surface with soft scatter and slow drift.",
    mood: "light",
    blocks: [
      { blockId: "scatter", role: "shape", opacity: 0.9, blendMode: "normal", paramOverrides: { count: 300, sizeMax: 80, opacity: 0.15, spacing: 20 } },
      { blockId: "bloom", role: "color", opacity: 0.4, blendMode: "screen", paramOverrides: { petals: 16, layers: 4, curvature: 1.0, style: "Gradient" } },
      { blockId: "drift", role: "motion", opacity: 0.35, blendMode: "screen", paramOverrides: { density: 500, speed: 0.5, trail: 40, weight: 0.8 } },
    ],
    drivers: {
      palette: ["#faf5ef", "#f4b8c1", "#c49dbc", "#7b6d8d", "#dba68a"],
      seed: 21,
      tempo: 0.5,
    },
  },
];

export function getRecipe(id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id);
}
