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
      { blockId: "marble", role: "base", opacity: 1.0, blendMode: "normal" },
      { blockId: "aurora", role: "color", opacity: 0.7, blendMode: "screen" },
      { blockId: "particles", role: "motion", opacity: 0.6, blendMode: "screen" },
    ],
    drivers: {
      palette: ["#0a0a2e", "#00ff88", "#0088ff", "#8800ff", "#1a1a3e"],
      seed: 42,
      tempo: 0.8,
    },
  },
  {
    id: "swiss-grid",
    name: "Swiss Grid",
    description: "Clean, geometric, editorial",
    mood: "light",
    blocks: [
      { blockId: "terrain", role: "base", opacity: 1.0, blendMode: "normal" },
      { blockId: "grid", role: "shape", opacity: 0.8, blendMode: "multiply" },
      { blockId: "glyphs", role: "texture", opacity: 0.5, blendMode: "overlay" },
    ],
    drivers: {
      palette: ["#ffffff", "#000000", "#c4362c", "#2a5faa", "#f5f5f0"],
      seed: 7,
      tempo: 0,
    },
  },
  {
    id: "ink-flow",
    name: "Ink Flow",
    description: "Organic, flowing, meditative",
    mood: "dark",
    blocks: [
      { blockId: "contour", role: "base", opacity: 1.0, blendMode: "normal" },
      { blockId: "flowfield", role: "motion", opacity: 0.5, blendMode: "screen" },
      { blockId: "bloom", role: "color", opacity: 0.5, blendMode: "screen" },
    ],
    drivers: {
      palette: ["#1a1a1a", "#2a2a2a", "#444444", "#888888", "#f5f5f0"],
      seed: 13,
      tempo: 1.2,
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
