import type { ParamSchema } from "./types";
import type { BlendMode } from "./layers";

export type BlockRole = "base" | "shape" | "color" | "motion" | "texture";

export const BLOCK_ROLES: BlockRole[] = ["base", "shape", "color", "motion", "texture"];

export const ROLE_LABELS: Record<BlockRole, string> = {
  base: "Base",
  shape: "Shape",
  color: "Color",
  motion: "Motion",
  texture: "Texture",
};

export type Block = {
  id: string;
  name: string;
  description: string;
  role: BlockRole;
  schema: ParamSchema;
  code: string;
  defaults: {
    blendMode: BlendMode;
    opacity: number;
  };
  tags: string[];
};

// Import all 18 templates
import { drift } from "./templates/drift";
import { grid } from "./templates/grid";
import { pulse } from "./templates/pulse";
import { scatter } from "./templates/scatter";
import { weave } from "./templates/weave";
import { spiral } from "./templates/spiral";
import { waves } from "./templates/waves";
import { constellation } from "./templates/constellation";
import { terrain } from "./templates/terrain";
import { bloom } from "./templates/bloom";
import { glitch } from "./templates/glitch";
import { mesh } from "./templates/mesh";
import { aurora } from "./templates/aurora";
import { flowfield } from "./templates/flowfield";
import { particles } from "./templates/particles";
import { contour } from "./templates/contour";
import { marble } from "./templates/marble";
import { glyphs } from "./templates/glyphs";
import { sculpt } from "./templates/sculpt";
import { fluid } from "./templates/fluid";
import { organism } from "./templates/organism";
import { terrain3d } from "./templates/terrain3d";

// Helper to convert a template to a block
function toBlock(
  template: { id: string; name: string; description: string; schema: ParamSchema; code: string },
  role: BlockRole,
  defaults: { blendMode: BlendMode; opacity: number },
  tags: string[]
): Block {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    role,
    schema: template.schema,
    code: template.code,
    defaults,
    tags,
  };
}

export const blocks: Block[] = [
  toBlock(drift, "motion", { blendMode: "screen", opacity: 0.6 }, ["organic", "particles", "trails"]),
  toBlock(grid, "shape", { blendMode: "multiply", opacity: 0.8 }, ["geometric", "minimal", "grid"]),
  toBlock(pulse, "motion", { blendMode: "screen", opacity: 0.5 }, ["geometric", "rings", "rhythmic"]),
  toBlock(scatter, "shape", { blendMode: "normal", opacity: 0.7 }, ["organic", "circles", "colorful"]),
  toBlock(weave, "shape", { blendMode: "normal", opacity: 0.9 }, ["geometric", "subdivision", "mondrian"]),
  toBlock(spiral, "shape", { blendMode: "multiply", opacity: 0.7 }, ["geometric", "mathematical", "hsb"]),
  toBlock(waves, "motion", { blendMode: "normal", opacity: 0.6 }, ["organic", "sine", "layered"]),
  toBlock(constellation, "texture", { blendMode: "screen", opacity: 0.4 }, ["dots", "connections", "night"]),
  toBlock(terrain, "base", { blendMode: "normal", opacity: 1.0 }, ["organic", "topographic", "lines"]),
  toBlock(bloom, "color", { blendMode: "screen", opacity: 0.5 }, ["organic", "glow", "radial"]),
  toBlock(glitch, "texture", { blendMode: "difference", opacity: 0.3 }, ["digital", "noise", "distortion"]),
  toBlock(mesh, "shape", { blendMode: "multiply", opacity: 0.6 }, ["geometric", "wireframe", "3d"]),
  toBlock(aurora, "color", { blendMode: "screen", opacity: 0.7 }, ["atmospheric", "gradient", "flowing"]),
  toBlock(flowfield, "motion", { blendMode: "screen", opacity: 0.5 }, ["organic", "noise", "trails"]),
  toBlock(particles, "motion", { blendMode: "screen", opacity: 0.6 }, ["interactive", "physics", "mouse"]),
  toBlock(contour, "base", { blendMode: "normal", opacity: 1.0 }, ["organic", "topographic", "minimal"]),
  toBlock(marble, "base", { blendMode: "normal", opacity: 1.0 }, ["organic", "noise", "warping"]),
  toBlock(glyphs, "texture", { blendMode: "overlay", opacity: 0.5 }, ["typography", "marks", "scattered"]),
  toBlock(sculpt, "base", { blendMode: "normal", opacity: 1.0 }, ["3d", "organic", "clay", "deformable"]),
  toBlock(fluid, "base", { blendMode: "normal", opacity: 1.0 }, ["3d", "liquid", "surface", "reflective"]),
  toBlock(organism, "motion", { blendMode: "screen", opacity: 0.8 }, ["3d", "organic", "breathing", "connected"]),
  toBlock(terrain3d, "base", { blendMode: "normal", opacity: 1.0 }, ["3d", "landscape", "sculptable", "heightmap"]),
];

export function getBlock(id: string): Block | undefined {
  return blocks.find((b) => b.id === id);
}

export function getBlocksByRole(role: BlockRole): Block[] {
  return blocks.filter((b) => b.role === role);
}
