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
    description: "Dark, atmospheric, glowing",
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
    description: "Clean, geometric, editorial",
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
    description: "Organic, flowing, meditative",
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
    description: "Energetic, bright, rhythmic",
    mood: "dark",
    blocks: [
      { blockId: "mesh", role: "shape", opacity: 0.6, blendMode: "normal" },
      { blockId: "pulse", role: "motion", opacity: 0.5, blendMode: "screen" },
      { blockId: "aurora", role: "color", opacity: 0.7, blendMode: "screen" },
      { blockId: "glitch", role: "texture", opacity: 0.3, blendMode: "difference" },
    ],
    drivers: {
      palette: ["#0a0a0a", "#ff006e", "#3a86ff", "#ffbe0b", "#8338ec"],
      seed: 99,
      tempo: 1.5,
    },
  },
  {
    id: "soft-fields",
    name: "Soft Fields",
    description: "Pastel, organic, gentle",
    mood: "light",
    blocks: [
      { blockId: "waves", role: "base", opacity: 0.6, blendMode: "normal" },
      { blockId: "scatter", role: "shape", opacity: 0.7, blendMode: "normal" },
      { blockId: "drift", role: "motion", opacity: 0.6, blendMode: "screen" },
    ],
    drivers: {
      palette: ["#f5f0eb", "#ffcdb2", "#b5838d", "#6d6875", "#e5989b"],
      seed: 21,
      tempo: 0.6,
    },
  },
];

export function getRecipe(id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id);
}
