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
    id: "clay-form",
    name: "Clay Form",
    description: "Shape a living form with your cursor",
    mood: "dark",
    blocks: [
      { blockId: "sculpt", role: "base", opacity: 1.0, blendMode: "normal", paramOverrides: { detail: 24, displacement: 100, speed: 0.6, smoothness: 2.5, palette: "Clay" } },
    ],
    drivers: {
      palette: ["#0a0a0a", "#c4a882", "#8b6f47", "#d4c4b0", "#3a2a1a"],
      seed: 42,
      tempo: 0.8,
    },
  },
  {
    id: "liquid-surface",
    name: "Liquid Surface",
    description: "A pool of living material. Touch to ripple.",
    mood: "dark",
    blocks: [
      { blockId: "fluid", role: "base", opacity: 1.0, blendMode: "normal", paramOverrides: { resolution: 50, waveHeight: 80, speed: 1.2, viscosity: 2.0, material: "Mercury" } },
    ],
    drivers: {
      palette: ["#0a0a0a", "#c0c0c0", "#e8e8e8", "#8888aa", "#ffffff"],
      seed: 7,
      tempo: 1.0,
    },
  },
  {
    id: "breathing-net",
    name: "Breathing Net",
    description: "A living network that reaches toward you",
    mood: "dark",
    blocks: [
      { blockId: "organism", role: "base", opacity: 1.0, blendMode: "normal", paramOverrides: { count: 250, connections: 4, breathe: 1.2, reach: 100, lineWeight: 0.6, mode: "Attract" } },
    ],
    drivers: {
      palette: ["#0a0a0a", "#00ffa3", "#0088ff", "#ffffff", "#001a33"],
      seed: 13,
      tempo: 1.0,
    },
  },
  {
    id: "terrain",
    name: "Terrain",
    description: "Sculpt a landscape. Raise mountains with your cursor.",
    mood: "dark",
    blocks: [
      { blockId: "terrain3d", role: "base", opacity: 1.0, blendMode: "normal", paramOverrides: { resolution: 50, height: 120, erosion: 2.5, speed: 0.4, wireframe: false, colorMode: "Elevation" } },
    ],
    drivers: {
      palette: ["#0a0a0a", "#2d5a27", "#8b6f47", "#e8e8e8", "#1a3a1a"],
      seed: 99,
      tempo: 0.6,
    },
  },
  {
    id: "marble-flow",
    name: "Marble Flow",
    description: "Liquid iridescence. Watch it pour.",
    mood: "dark",
    blocks: [
      { blockId: "marble", role: "base", opacity: 1.0, blendMode: "normal", paramOverrides: { complexity: 3, scale: 0.003, speed: 0.6, saturation: 80, palette: "Iridescent" } },
    ],
    drivers: {
      palette: ["#0a0a0a", "#ff006e", "#3a86ff", "#ffbe0b", "#8338ec"],
      seed: 21,
      tempo: 1.0,
    },
  },
  {
    id: "ink-traces",
    name: "Ink Traces",
    description: "Flowing ink finding its path",
    mood: "dark",
    blocks: [
      { blockId: "flowfield", role: "base", opacity: 1.0, blendMode: "normal", paramOverrides: { density: 800, speed: 2.5, noiseScale: 0.006, lineWeight: 1.0, fadeRate: 12 } },
    ],
    drivers: {
      palette: ["#0a0a0a", "#1a1a2e", "#4a4a6a", "#8888aa", "#e0ddd5"],
      seed: 55,
      tempo: 1.2,
    },
  },
];

export function getRecipe(id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id);
}
