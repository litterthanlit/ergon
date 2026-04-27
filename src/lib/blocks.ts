import type { ParamSchema } from "./types";
import type { BlendMode } from "./layers";

export type BlockRole = "base" | "shape" | "color" | "motion" | "texture";

export const BLOCK_ROLES: BlockRole[] = ["base", "shape", "color", "motion", "texture"];

export const ROLE_LABELS: Record<BlockRole, string> = {
  base: "Ground",
  shape: "Form",
  color: "Pigment",
  motion: "Motion",
  texture: "Surface",
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

// Helper to convert a template to a block
function toBlock(
  template: {
    id: string;
    name: string;
    description: string;
    schema: ParamSchema;
    code: string;
  },
  role: BlockRole,
  defaults: { blendMode: BlendMode; opacity: number },
  tags: string[],
  description?: string
): Block {
  return {
    id: template.id,
    name: template.name,
    description: description ?? template.description,
    role,
    schema: template.schema,
    code: template.code,
    defaults,
    tags,
  };
}

export const blocks: Block[] = [
  toBlock(drift, "motion", { blendMode: "screen", opacity: 0.6 }, ["soft", "atmospheric", "trail"], "Suspends specks and quiet trails in a slow drifting current."),
  toBlock(grid, "shape", { blendMode: "multiply", opacity: 0.8 }, ["editorial", "structural", "clean"], "Lays down a crisp editorial scaffold with measured rhythm."),
  toBlock(pulse, "motion", { blendMode: "screen", opacity: 0.5 }, ["rhythmic", "rings", "energy"], "Pushes concentric energy outward in a steady beat."),
  toBlock(scatter, "shape", { blendMode: "normal", opacity: 0.7 }, ["organic", "dots", "pigment"], "Spreads soft forms like pigment tossed across the surface."),
  toBlock(weave, "shape", { blendMode: "normal", opacity: 0.9 }, ["interlocked", "bands", "structure"], "Interlocks structure into calm woven bands."),
  toBlock(spiral, "shape", { blendMode: "multiply", opacity: 0.7 }, ["rotational", "focus", "gesture"], "Twists the field into a focused rotational gesture."),
  toBlock(waves, "motion", { blendMode: "normal", opacity: 0.6 }, ["layered", "undulating", "breath"], "Undulates the surface in layered, breathing ripples."),
  toBlock(constellation, "texture", { blendMode: "screen", opacity: 0.4 }, ["celestial", "dots", "light"], "Pins quiet points of light into a sparse celestial field."),
  toBlock(terrain, "base", { blendMode: "normal", opacity: 1.0 }, ["topographic", "ground", "foundation"], "Builds a grounded surface the composition can grow from."),
  toBlock(bloom, "color", { blendMode: "screen", opacity: 0.5 }, ["luminous", "petal", "glow"], "Lets color spread outward in soft luminous petals."),
  toBlock(glitch, "texture", { blendMode: "difference", opacity: 0.3 }, ["digital", "fracture", "noise"], "Fractures the surface with sharp digital tension."),
  toBlock(mesh, "shape", { blendMode: "multiply", opacity: 0.6 }, ["skeletal", "wireframe", "frame"], "Exposes a skeletal frame and wire-like depth."),
  toBlock(aurora, "color", { blendMode: "screen", opacity: 0.7 }, ["atmospheric", "gradient", "flowing"], "Washes the piece in flowing bands of pigment and glow."),
  toBlock(flowfield, "motion", { blendMode: "screen", opacity: 0.5 }, ["currents", "flow", "directional"], "Pulls marks into currents that drift and curl."),
  toBlock(particles, "motion", { blendMode: "screen", opacity: 0.6 }, ["charged", "fragments", "scatter"], "Releases charged fragments into motion."),
  toBlock(contour, "base", { blendMode: "normal", opacity: 1.0 }, ["calm", "carved", "lines"], "Carves a calm field of lines and shaded depth."),
  toBlock(marble, "base", { blendMode: "normal", opacity: 1.0 }, ["flowing", "grain", "mass"], "Pours a flowing body of grain, veining, and mass."),
  toBlock(glyphs, "texture", { blendMode: "overlay", opacity: 0.5 }, ["inscribed", "marks", "signs"], "Etches marks and signs into the skin of the image."),
];

export function getBlock(id: string): Block | undefined {
  return blocks.find((b) => b.id === id);
}

export function getBlocksByRole(role: BlockRole): Block[] {
  return blocks.filter((b) => b.role === role);
}
