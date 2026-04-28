import type { ParamSchema, ParamValue, ParamValues } from "./types";

export type TexturePortType = "texture";
export type TextureRendererBackend = "webgpu" | "webgl2";
export type TextureQuality = "preview" | "final";
export type TextureOperatorCategory = "generator" | "simulation" | "modifier" | "network" | "output";
export type TexturePersistentBuffer = "feedback" | "simulation";
export type TextureOperatorBrowserTab = "TOP" | "CHOP" | "SOP" | "MAT" | "DAT";

export type TextureOperatorType =
  | "noise"
  | "gradient"
  | "voronoi"
  | "shape"
  | "curl-noise"
  | "reaction-diffusion"
  | "transform"
  | "blur"
  | "displace"
  | "fluid-advection"
  | "raymarch-glass"
  | "levels"
  | "colorize"
  | "bloom"
  | "chromatic-aberration"
  | "film-grain"
  | "color-grade"
  | "composite"
  | "feedback"
  | "null"
  | "out";

export type TexturePort = {
  id: string;
  label: string;
  type: TexturePortType;
  multiple?: boolean;
};

export type TextureOperatorDefinition = {
  type: TextureOperatorType;
  label: string;
  family: "TOP";
  category: TextureOperatorCategory;
  description: string;
  inputs: TexturePort[];
  outputs: TexturePort[];
  schema: ParamSchema;
  defaults: ParamValues;
  shader: string;
  shaderModules: Partial<Record<TextureRendererBackend, string>>;
  supportsFeedback?: boolean;
  persistentBuffer?: TexturePersistentBuffer;
  paramGroups?: { label: string; keys: string[] }[];
  presets?: { id: string; label: string; params: Partial<ParamValues> }[];
};

export type TextureNode = {
  id: string;
  type: TextureOperatorType;
  label: string;
  position: { x: number; y: number };
  params: ParamValues;
  bypass: boolean;
  lock: boolean;
  viewerActive: boolean;
  errors: string[];
  runtime: {
    cookMs: number;
    resolution: [number, number];
  };
};

export type TextureEdge = {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
};

export type TextureTimeline = {
  fps: number;
  durationFrames: number;
  loop: boolean;
  currentFrame: number;
};

export type TexturePatch = {
  id: string;
  name: string;
  resolution: [number, number];
  rendererBackend: TextureRendererBackend;
  quality: TextureQuality;
  timeline?: TextureTimeline;
  selectedNodeId: string;
  viewerNodeId: string;
  nodes: TextureNode[];
  edges: TextureEdge[];
};

export type TextureRenderPass = {
  nodeId: string;
  type: TextureOperatorType;
  label: string;
  shader: string;
  shaderModules: Partial<Record<TextureRendererBackend, string>>;
  params: ParamValues;
  inputNodeIds: string[];
  bypass: boolean;
  usesFeedback: boolean;
  persistentBuffer: TexturePersistentBuffer | null;
};

export type TextureRenderPlan = {
  id: string;
  name: string;
  resolution: [number, number];
  rendererBackend: TextureRendererBackend;
  quality: TextureQuality;
  passes: TextureRenderPass[];
  outputNodeId: string;
  viewerNodeId: string;
  errors: string[];
};

export type TextureRuntimeStats = {
  frame: number;
  fps: number;
  cookMs: number;
  backend: TextureRendererBackend;
  requestedBackend: TextureRendererBackend;
  quality: TextureQuality;
  persistentBuffers: number;
  nodeStats: Record<string, { cookMs: number; resolution: [number, number] }>;
};

const colorBlack = "#02040a";
const colorCyan = "#6ee7f9";
const colorViolet = "#a78bfa";
const colorWarm = "#f7c978";

function schemaDefaults(schema: ParamSchema): ParamValues {
  return Object.fromEntries(Object.entries(schema).map(([key, def]) => [key, def.default])) as ParamValues;
}

function numberParam(label: string, min: number, max: number, defaultValue: number, step = 0.01) {
  return { type: "number" as const, label, min, max, default: defaultValue, step };
}

function colorParam(label: string, defaultValue: string) {
  return { type: "color" as const, label, default: defaultValue };
}

function selectParam(label: string, options: string[], defaultValue: string) {
  return { type: "select" as const, label, options, default: defaultValue };
}

const textureIn = (id = "in1", label = "Input"): TexturePort => ({ id, label, type: "texture" });
const textureOut: TexturePort = { id: "out", label: "Texture", type: "texture" };

const motionGroup = { label: "Motion", keys: ["scale", "speed", "flow", "driftX", "driftY", "rotate"] };
const materialGroup = { label: "Material", keys: ["strength", "depth", "refraction", "softness", "radius", "gain"] };
const gradeGroup = {
  label: "Grade",
  keys: ["exposure", "contrast", "gamma", "saturation", "temperature", "intensity", "vignette", "grain"],
};
const colorGroup = { label: "Palette", keys: ["colorA", "colorB", "colorC"] };

const textureOperatorDefinitions: Omit<TextureOperatorDefinition, "defaults" | "shaderModules">[] = [
  {
    type: "curl-noise",
    label: "Curl Noise TOP",
    family: "TOP",
    category: "generator",
    description: "A premium turbulent source with directional curl flow and luminous ridges.",
    inputs: [],
    outputs: [textureOut],
    schema: {
      scale: numberParam("Scale", 1, 24, 8.5, 0.1),
      speed: numberParam("Speed", 0, 2.5, 0.34, 0.01),
      flow: numberParam("Flow", 0, 4, 1.55, 0.01),
      contrast: numberParam("Contrast", 0.2, 4, 1.65, 0.01),
      seed: numberParam("Seed", 0, 100, 18, 1),
      colorA: colorParam("Shadow", colorBlack),
      colorB: colorParam("Body", colorCyan),
      colorC: colorParam("Highlight", colorViolet),
    },
    shader: "curlNoise",
    paramGroups: [motionGroup, colorGroup],
    presets: [
      { id: "liquid", label: "Liquid Ridges", params: { scale: 7.8, flow: 1.8, contrast: 1.7 } },
      { id: "smoke", label: "Chromatic Smoke", params: { scale: 5.2, flow: 2.4, contrast: 1.2 } },
    ],
  },
  {
    type: "reaction-diffusion",
    label: "Reaction Diffusion TOP",
    family: "TOP",
    category: "simulation",
    description: "A persistent organic field that grows, erodes, and remembers previous frames.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      scale: numberParam("Scale", 1, 28, 11, 0.1),
      speed: numberParam("Speed", 0, 2, 0.2, 0.01),
      diffusion: numberParam("Diffusion", 0, 1, 0.36, 0.01),
      sharpness: numberParam("Sharpness", 0, 3, 1.45, 0.01),
      flow: numberParam("Flow", 0, 4, 0.9, 0.01),
      colorA: colorParam("Shadow", colorBlack),
      colorB: colorParam("Body", "#8cf8d2"),
      colorC: colorParam("Highlight", colorWarm),
    },
    shader: "reactionDiffusion",
    supportsFeedback: true,
    persistentBuffer: "simulation",
    paramGroups: [motionGroup, materialGroup, colorGroup],
  },
  {
    type: "noise",
    label: "Noise TOP",
    family: "TOP",
    category: "generator",
    description: "Procedural turbulent texture with animated FBM noise.",
    inputs: [],
    outputs: [textureOut],
    schema: {
      scale: numberParam("Scale", 1, 18, 7, 0.1),
      speed: numberParam("Speed", 0, 3, 0.55, 0.01),
      contrast: numberParam("Contrast", 0.2, 4, 1.55, 0.01),
      seed: numberParam("Seed", 0, 100, 12, 1),
    },
    shader: "noise",
    paramGroups: [motionGroup],
  },
  {
    type: "gradient",
    label: "Gradient TOP",
    family: "TOP",
    category: "generator",
    description: "A smooth color ramp for backgrounds and masks.",
    inputs: [],
    outputs: [textureOut],
    schema: {
      colorA: colorParam("Color A", colorBlack),
      colorB: colorParam("Color B", colorCyan),
      angle: numberParam("Angle", 0, 6.28, 0.72, 0.01),
      softness: numberParam("Softness", 0.2, 2.5, 1, 0.01),
    },
    shader: "gradient",
    paramGroups: [colorGroup, materialGroup],
  },
  {
    type: "voronoi",
    label: "Voronoi TOP",
    family: "TOP",
    category: "generator",
    description: "Cellular texture for glass, biology, and crystalline masks.",
    inputs: [],
    outputs: [textureOut],
    schema: {
      cells: numberParam("Cells", 2, 24, 9, 1),
      jitter: numberParam("Jitter", 0, 1, 0.72, 0.01),
      speed: numberParam("Speed", 0, 2, 0.24, 0.01),
      edge: numberParam("Edge", 0, 1, 0.36, 0.01),
    },
    shader: "voronoi",
    paramGroups: [motionGroup, materialGroup],
  },
  {
    type: "shape",
    label: "Shape TOP",
    family: "TOP",
    category: "generator",
    description: "Soft primitive masks for comping and displacement.",
    inputs: [],
    outputs: [textureOut],
    schema: {
      shape: selectParam("Shape", ["Circle", "Box", "Ring"], "Circle"),
      size: numberParam("Size", 0.05, 1.4, 0.55, 0.01),
      feather: numberParam("Feather", 0.001, 0.5, 0.18, 0.01),
      colorA: colorParam("Fill", "#ffffff"),
    },
    shader: "shape",
    paramGroups: [materialGroup, colorGroup],
  },
  {
    type: "fluid-advection",
    label: "Fluid Advection TOP",
    family: "TOP",
    category: "modifier",
    description: "Warps an incoming image through curl flow for liquid, smoke, and veil motion.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      strength: numberParam("Strength", -0.22, 0.22, 0.058, 0.001),
      scale: numberParam("Scale", 1, 20, 8.8, 0.1),
      speed: numberParam("Speed", 0, 2.5, 0.28, 0.01),
      flow: numberParam("Flow", 0, 4, 1.4, 0.01),
      mix: numberParam("Mix", 0, 1, 0.82, 0.01),
    },
    shader: "fluidAdvection",
    paramGroups: [motionGroup, materialGroup],
  },
  {
    type: "raymarch-glass",
    label: "Raymarch Glass TOP",
    family: "TOP",
    category: "modifier",
    description: "Adds refractive depth, normals, and glossy highlights over an input texture.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      depth: numberParam("Depth", 0, 3, 1.15, 0.01),
      refraction: numberParam("Refraction", 0, 0.16, 0.045, 0.001),
      softness: numberParam("Softness", 0.1, 3, 1.18, 0.01),
      strength: numberParam("Specular", 0, 2, 0.75, 0.01),
      scale: numberParam("Facet Scale", 1, 24, 8, 0.1),
    },
    shader: "raymarchGlass",
    paramGroups: [materialGroup, motionGroup],
    presets: [
      { id: "veil", label: "Soft Veil", params: { depth: 0.8, refraction: 0.032, softness: 1.8 } },
      { id: "cut-glass", label: "Cut Glass", params: { depth: 1.7, refraction: 0.064, softness: 0.8 } },
    ],
  },
  {
    type: "transform",
    label: "Transform TOP",
    family: "TOP",
    category: "modifier",
    description: "Move, scale, and rotate incoming texture coordinates.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      translateX: numberParam("Translate X", -1, 1, 0, 0.01),
      translateY: numberParam("Translate Y", -1, 1, 0, 0.01),
      scale: numberParam("Scale", 0.2, 4, 1, 0.01),
      rotate: numberParam("Rotate", -3.14, 3.14, 0, 0.01),
    },
    shader: "transform",
    paramGroups: [motionGroup],
  },
  {
    type: "blur",
    label: "Blur TOP",
    family: "TOP",
    category: "modifier",
    description: "Softens a texture with a compact blur.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      radius: numberParam("Radius", 0, 24, 5, 0.1),
      gain: numberParam("Gain", 0, 2, 1, 0.01),
    },
    shader: "blur",
    paramGroups: [materialGroup],
  },
  {
    type: "displace",
    label: "Displace TOP",
    family: "TOP",
    category: "modifier",
    description: "Warps one texture with another input or procedural turbulence.",
    inputs: [textureIn("image", "Image"), textureIn("map", "Map")],
    outputs: [textureOut],
    schema: {
      strength: numberParam("Strength", -0.25, 0.25, 0.055, 0.001),
      scale: numberParam("Map Scale", 1, 18, 6, 0.1),
      speed: numberParam("Speed", 0, 3, 0.35, 0.01),
    },
    shader: "displace",
    paramGroups: [motionGroup, materialGroup],
  },
  {
    type: "bloom",
    label: "Bloom TOP",
    family: "TOP",
    category: "modifier",
    description: "Extracts highlights and lays them back in as soft cinematic light.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      strength: numberParam("Strength", 0, 3, 0.95, 0.01),
      threshold: numberParam("Threshold", 0, 1, 0.34, 0.01),
      radius: numberParam("Radius", 0, 28, 9, 0.1),
      softness: numberParam("Softness", 0, 2, 0.82, 0.01),
    },
    shader: "bloom",
    paramGroups: [materialGroup],
  },
  {
    type: "chromatic-aberration",
    label: "Chromatic Aberration TOP",
    family: "TOP",
    category: "modifier",
    description: "Adds restrained lens separation and edge energy without breaking the image.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      aberration: numberParam("Aberration", 0, 0.045, 0.012, 0.001),
      softness: numberParam("Edge Falloff", 0.1, 2.5, 1.1, 0.01),
      mix: numberParam("Mix", 0, 1, 0.74, 0.01),
    },
    shader: "chromaticAberration",
    paramGroups: [materialGroup],
  },
  {
    type: "film-grain",
    label: "Film Grain TOP",
    family: "TOP",
    category: "modifier",
    description: "Adds grain, vignette, and subtle tonal texture for a finished still.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      grain: numberParam("Grain", 0, 0.35, 0.08, 0.001),
      vignette: numberParam("Vignette", 0, 1.2, 0.38, 0.01),
      intensity: numberParam("Intensity", 0.5, 1.5, 1, 0.01),
    },
    shader: "filmGrain",
    paramGroups: [gradeGroup],
  },
  {
    type: "color-grade",
    label: "Color Grade TOP",
    family: "TOP",
    category: "modifier",
    description: "Premium palette mapping, exposure, temperature, and saturation in one finishing pass.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      colorA: colorParam("Shadow", colorBlack),
      colorB: colorParam("Mid", "#7dd3fc"),
      colorC: colorParam("Highlight", "#f8fafc"),
      exposure: numberParam("Exposure", -1, 1.5, 0.08, 0.01),
      contrast: numberParam("Contrast", 0, 3, 1.18, 0.01),
      saturation: numberParam("Saturation", 0, 3, 1.08, 0.01),
      temperature: numberParam("Temperature", -1, 1, -0.08, 0.01),
      intensity: numberParam("Palette", 0, 1, 0.58, 0.01),
    },
    shader: "colorGrade",
    paramGroups: [colorGroup, gradeGroup],
    presets: [
      { id: "editorial", label: "Editorial Black", params: { colorA: "#01040a", colorB: "#81d8f7", colorC: "#f8fafc", exposure: -0.05, contrast: 1.35, saturation: 0.92, temperature: -0.12 } },
      { id: "warm-silver", label: "Warm Silver", params: { colorA: "#050505", colorB: "#b8d7de", colorC: colorWarm, exposure: 0.05, contrast: 1.18, saturation: 0.86, temperature: 0.18 } },
    ],
  },
  {
    type: "levels",
    label: "Levels TOP",
    family: "TOP",
    category: "modifier",
    description: "Brightness, contrast, gamma, and saturation treatment.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      brightness: numberParam("Brightness", -1, 1, 0, 0.01),
      contrast: numberParam("Contrast", 0, 3, 1.12, 0.01),
      gamma: numberParam("Gamma", 0.2, 3, 0.92, 0.01),
      saturation: numberParam("Saturation", 0, 3, 1.18, 0.01),
    },
    shader: "levels",
    paramGroups: [gradeGroup],
  },
  {
    type: "colorize",
    label: "Colorize TOP",
    family: "TOP",
    category: "modifier",
    description: "Maps luminance into a three-color palette.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      colorA: colorParam("Low", colorBlack),
      colorB: colorParam("Mid", colorCyan),
      colorC: colorParam("High", colorViolet),
      intensity: numberParam("Intensity", 0, 2.5, 1.15, 0.01),
    },
    shader: "colorize",
    paramGroups: [colorGroup, gradeGroup],
  },
  {
    type: "composite",
    label: "Composite TOP",
    family: "TOP",
    category: "network",
    description: "Blends two textures with over, add, screen, or multiply modes.",
    inputs: [textureIn("base", "Base"), textureIn("over", "Over")],
    outputs: [textureOut],
    schema: {
      mode: selectParam("Mode", ["Over", "Add", "Screen", "Multiply"], "Screen"),
      opacity: numberParam("Opacity", 0, 1, 0.7, 0.01),
    },
    shader: "composite",
  },
  {
    type: "feedback",
    label: "Feedback TOP",
    family: "TOP",
    category: "network",
    description: "Adds temporal memory with decay and drift using persistent ping-pong textures.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {
      decay: numberParam("Decay", 0, 0.995, 0.91, 0.001),
      amount: numberParam("Amount", 0, 1, 0.58, 0.01),
      driftX: numberParam("Drift X", -0.02, 0.02, 0.004, 0.001),
      driftY: numberParam("Drift Y", -0.02, 0.02, -0.002, 0.001),
    },
    shader: "feedback",
    supportsFeedback: true,
    persistentBuffer: "feedback",
    paramGroups: [motionGroup],
  },
  {
    type: "null",
    label: "Null TOP",
    family: "TOP",
    category: "network",
    description: "A named pass-through and viewer checkpoint.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {},
    shader: "copy",
  },
  {
    type: "out",
    label: "Out TOP",
    family: "TOP",
    category: "output",
    description: "The final output texture for export, save, and publish.",
    inputs: [textureIn()],
    outputs: [textureOut],
    schema: {},
    shader: "copy",
  },
];

export const textureOperatorBrowserTabs: TextureOperatorBrowserTab[] = ["TOP", "CHOP", "SOP", "MAT", "DAT"];

export const textureOperatorCategoryLabels: Record<TextureOperatorCategory, string> = {
  generator: "Generators",
  simulation: "Fields",
  modifier: "Filters",
  network: "Blend",
  output: "Render",
};

export const textureOperators: TextureOperatorDefinition[] = textureOperatorDefinitions.map((operator) => ({
  ...operator,
  defaults: schemaDefaults(operator.schema),
  shaderModules: { webgl2: operator.shader, webgpu: operator.shader },
}));

const operatorMap = new Map(textureOperators.map((operator) => [operator.type, operator]));

export function getTextureOperator(type: TextureOperatorType): TextureOperatorDefinition | undefined {
  return operatorMap.get(type);
}

export function listTextureOperators(category?: TextureOperatorCategory): TextureOperatorDefinition[] {
  return category ? textureOperators.filter((operator) => operator.category === category) : textureOperators;
}

export function searchTextureOperators(
  tab: TextureOperatorBrowserTab,
  query = ""
): Record<TextureOperatorCategory, TextureOperatorDefinition[]> {
  const emptyGroups = {
    generator: [],
    simulation: [],
    modifier: [],
    network: [],
    output: [],
  } satisfies Record<TextureOperatorCategory, TextureOperatorDefinition[]>;
  if (tab !== "TOP") return emptyGroups;
  const normalized = query.trim().toLowerCase();
  const groups: Record<TextureOperatorCategory, TextureOperatorDefinition[]> = {
    generator: [],
    simulation: [],
    modifier: [],
    network: [],
    output: [],
  };
  for (const operator of textureOperators) {
    const haystack = `${operator.label} ${operator.description} ${operator.type}`.toLowerCase();
    if (!normalized || haystack.includes(normalized)) groups[operator.category].push(operator);
  }
  return groups;
}

export function createTextureNode(
  type: TextureOperatorType,
  position: { x: number; y: number },
  overrides: Partial<Omit<TextureNode, "params">> & { params?: Partial<ParamValues> } = {}
): TextureNode {
  const operator = getTextureOperator(type);
  if (!operator) throw new Error(`Unknown texture operator: ${type}`);
  const id = overrides.id ?? `${type}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    type,
    label: overrides.label ?? operator.label,
    position,
    params: { ...operator.defaults, ...(overrides.params ?? {}) } as ParamValues,
    bypass: overrides.bypass ?? false,
    lock: overrides.lock ?? false,
    viewerActive: overrides.viewerActive ?? false,
    errors: overrides.errors ?? [],
    runtime: overrides.runtime ?? { cookMs: 0, resolution: [0, 0] },
  };
}

function edgeId(source: string, target: string, targetPort = "in1") {
  return `${source}:${target}:${targetPort}`;
}

export function createTextureEdge(
  source: string,
  target: string,
  targetPort = "in1",
  sourcePort = "out"
): TextureEdge {
  return { id: edgeId(source, target, targetPort), source, target, targetPort, sourcePort };
}

function makePatch(
  id: string,
  name: string,
  selectedNodeId: string,
  viewerNodeId: string,
  nodes: TextureNode[],
  edges: TextureEdge[],
  quality: TextureQuality = "preview"
): TexturePatch {
  return {
    id,
    name,
    resolution: [1600, 900],
    rendererBackend: "webgpu",
    quality,
    timeline: { fps: 60, durationFrames: 720, loop: true, currentFrame: 96 },
    selectedNodeId,
    viewerNodeId,
    nodes,
    edges,
  };
}

export function createLiquidAuroraPatch(): TexturePatch {
  const nodes = [
    createTextureNode("curl-noise", { x: 0, y: 20 }, { id: "curl-1", params: { scale: 8.4, speed: 0.28, flow: 1.62, contrast: 1.48, seed: 18, colorA: "#02040a", colorB: "#3ec7e8", colorC: "#8b5cf6" } }),
    createTextureNode("fluid-advection", { x: 220, y: 20 }, { id: "advection-1", params: { strength: 0.046, scale: 8.5, speed: 0.2, flow: 1.42, mix: 0.78 } }),
    createTextureNode("raymarch-glass", { x: 450, y: 20 }, { id: "glass-1", params: { depth: 1.05, refraction: 0.034, softness: 1.22, strength: 0.52, scale: 8.4 } }),
    createTextureNode("bloom", { x: 680, y: 20 }, { id: "bloom-1", params: { strength: 0.62, threshold: 0.46, radius: 9, softness: 0.76 } }),
    createTextureNode("color-grade", { x: 910, y: 20 }, { id: "grade-1", viewerActive: true, params: { colorA: "#01040a", colorB: "#67d7ee", colorC: "#b8c6d4", exposure: -0.18, contrast: 1.08, saturation: 1, temperature: -0.12, intensity: 0.38 } }),
    createTextureNode("film-grain", { x: 1140, y: 20 }, { id: "grain-1", params: { grain: 0.055, vignette: 0.5, intensity: 0.98 } }),
    createTextureNode("out", { x: 1370, y: 20 }, { id: "out-1" }),
  ];

  return makePatch("texture-liquid-aurora", "Liquid Aurora", "grade-1", "out-1", nodes, [
    createTextureEdge("curl-1", "advection-1"),
    createTextureEdge("advection-1", "glass-1"),
    createTextureEdge("glass-1", "bloom-1"),
    createTextureEdge("bloom-1", "grade-1"),
    createTextureEdge("grade-1", "grain-1"),
    createTextureEdge("grain-1", "out-1"),
  ]);
}

export type TextureRecipeId = "liquid-aurora" | "glass-veil" | "bloom-signal" | "reaction-field" | "chromatic-smoke";

export type TextureRecipe = {
  id: TextureRecipeId;
  label: string;
  description: string;
  thumbnail: string;
  accent: string;
  tags: string[];
  featuredOperatorTypes: TextureOperatorType[];
  create: () => TexturePatch;
};

export type TextureStarter = {
  id: string;
  label: string;
  thumbnail: string;
  accent: string;
  description: string;
  tags: string[];
  recipeId: TextureRecipeId;
};

export const textureRecipes: TextureRecipe[] = [
  {
    id: "liquid-aurora",
    label: "Liquid Aurora",
    description: "Curl flow, glass refraction, bloom, and silver-cyan color grade.",
    thumbnail: "organic-refraction",
    accent: "#67e8f9",
    tags: ["glass", "curl", "bloom"],
    featuredOperatorTypes: ["curl-noise", "fluid-advection", "raymarch-glass", "bloom", "color-grade"],
    create: createLiquidAuroraPatch,
  },
  {
    id: "glass-veil",
    label: "Glass Veil",
    description: "A refractive gradient system with soft folds and restrained highlights.",
    thumbnail: "volumetric-veil",
    accent: "#a7f3d0",
    tags: ["refraction", "veil", "soft"],
    featuredOperatorTypes: ["gradient", "curl-noise", "displace", "raymarch-glass", "color-grade"],
    create: () => {
      const nodes = [
        createTextureNode("gradient", { x: 0, y: -50 }, { id: "gradient-1", params: { colorA: "#01040a", colorB: "#a7f3d0", angle: 0.58, softness: 1.25 } }),
        createTextureNode("curl-noise", { x: 0, y: 135 }, { id: "curl-1", params: { scale: 5.6, speed: 0.18, flow: 2.1, contrast: 1.1, seed: 32, colorA: "#02040a", colorB: "#b8d7de", colorC: "#ffffff" } }),
        createTextureNode("displace", { x: 260, y: 45 }, { id: "displace-1", params: { strength: 0.072, scale: 7, speed: 0.16 } }),
        createTextureNode("raymarch-glass", { x: 500, y: 45 }, { id: "glass-1", params: { depth: 1.65, refraction: 0.068, softness: 0.84, strength: 0.95, scale: 11 } }),
        createTextureNode("bloom", { x: 735, y: 45 }, { id: "bloom-1", params: { strength: 0.72, threshold: 0.42, radius: 12, softness: 0.75 } }),
        createTextureNode("color-grade", { x: 970, y: 45 }, { id: "grade-1", params: { colorA: "#02040a", colorB: "#b8d7de", colorC: colorWarm, exposure: 0.02, contrast: 1.2, saturation: 0.86, temperature: 0.16, intensity: 0.42 } }),
        createTextureNode("out", { x: 1200, y: 45 }, { id: "out-1" }),
      ];
      return makePatch("texture-glass-veil", "Glass Veil", "glass-1", "out-1", nodes, [
        createTextureEdge("gradient-1", "displace-1", "image"),
        createTextureEdge("curl-1", "displace-1", "map"),
        createTextureEdge("displace-1", "glass-1"),
        createTextureEdge("glass-1", "bloom-1"),
        createTextureEdge("bloom-1", "grade-1"),
        createTextureEdge("grade-1", "out-1"),
      ]);
    },
  },
  {
    id: "bloom-signal",
    label: "Bloom Signal",
    description: "Graphic masks pushed through additive bloom and finished as a poster-like field.",
    thumbnail: "fluid-bloom",
    accent: "#f7c978",
    tags: ["signal", "bloom", "poster"],
    featuredOperatorTypes: ["shape", "curl-noise", "composite", "bloom", "chromatic-aberration"],
    create: () => {
      const nodes = [
        createTextureNode("shape", { x: 0, y: -40 }, { id: "shape-1", params: { shape: "Ring", size: 0.62, feather: 0.1, colorA: "#ffffff" } }),
        createTextureNode("curl-noise", { x: 0, y: 150 }, { id: "curl-1", params: { scale: 12, speed: 0.42, flow: 1.2, contrast: 2.05, seed: 45, colorA: "#030712", colorB: "#e0f2fe", colorC: "#f7c978" } }),
        createTextureNode("composite", { x: 270, y: 45 }, { id: "composite-1", params: { mode: "Add", opacity: 0.68 } }),
        createTextureNode("bloom", { x: 510, y: 45 }, { id: "bloom-1", params: { strength: 1.45, threshold: 0.24, radius: 15, softness: 0.95 } }),
        createTextureNode("chromatic-aberration", { x: 750, y: 45 }, { id: "aberration-1", params: { aberration: 0.011, softness: 0.9, mix: 0.62 } }),
        createTextureNode("color-grade", { x: 995, y: 45 }, { id: "grade-1", params: { colorA: "#050505", colorB: "#fde68a", colorC: "#fb7185", exposure: 0.08, contrast: 1.28, saturation: 1.02, temperature: 0.08, intensity: 0.5 } }),
        createTextureNode("out", { x: 1225, y: 45 }, { id: "out-1" }),
      ];
      return makePatch("texture-bloom-signal", "Bloom Signal", "bloom-1", "out-1", nodes, [
        createTextureEdge("shape-1", "composite-1", "base"),
        createTextureEdge("curl-1", "composite-1", "over"),
        createTextureEdge("composite-1", "bloom-1"),
        createTextureEdge("bloom-1", "aberration-1"),
        createTextureEdge("aberration-1", "grade-1"),
        createTextureEdge("grade-1", "out-1"),
      ]);
    },
  },
  {
    id: "reaction-field",
    label: "Reaction Field",
    description: "A persistent organic simulation with growth, erosion, bloom, and grade.",
    thumbnail: "bio-lattice",
    accent: "#8cf8d2",
    tags: ["simulation", "organic", "growth"],
    featuredOperatorTypes: ["curl-noise", "reaction-diffusion", "bloom", "film-grain"],
    create: () => {
      const nodes = [
        createTextureNode("curl-noise", { x: 0, y: 35 }, { id: "curl-1", params: { scale: 6.5, speed: 0.2, flow: 1, contrast: 1.1, seed: 72, colorA: "#02040a", colorB: "#8cf8d2", colorC: colorWarm } }),
        createTextureNode("reaction-diffusion", { x: 245, y: 35 }, { id: "reaction-1", params: { scale: 12, speed: 0.16, diffusion: 0.4, sharpness: 1.7, flow: 0.92, colorA: "#02040a", colorB: "#8cf8d2", colorC: colorWarm } }),
        createTextureNode("bloom", { x: 495, y: 35 }, { id: "bloom-1", params: { strength: 0.82, threshold: 0.35, radius: 8, softness: 0.78 } }),
        createTextureNode("color-grade", { x: 730, y: 35 }, { id: "grade-1", params: { colorA: "#01040a", colorB: "#8cf8d2", colorC: "#fef3c7", exposure: -0.02, contrast: 1.32, saturation: 0.94, temperature: 0.08, intensity: 0.48 } }),
        createTextureNode("film-grain", { x: 960, y: 35 }, { id: "grain-1", params: { grain: 0.075, vignette: 0.55, intensity: 1 } }),
        createTextureNode("out", { x: 1190, y: 35 }, { id: "out-1" }),
      ];
      return makePatch("texture-reaction-field", "Reaction Field", "reaction-1", "out-1", nodes, [
        createTextureEdge("curl-1", "reaction-1"),
        createTextureEdge("reaction-1", "bloom-1"),
        createTextureEdge("bloom-1", "grade-1"),
        createTextureEdge("grade-1", "grain-1"),
        createTextureEdge("grain-1", "out-1"),
      ], "final");
    },
  },
  {
    id: "chromatic-smoke",
    label: "Chromatic Smoke",
    description: "Dark smoke ribbons with lens separation, soft bloom, and a cool editorial finish.",
    thumbnail: "iridion-flow",
    accent: "#c4b5fd",
    tags: ["smoke", "lens", "editorial"],
    featuredOperatorTypes: ["curl-noise", "fluid-advection", "chromatic-aberration", "bloom"],
    create: () => {
      const nodes = [
        createTextureNode("curl-noise", { x: 0, y: 30 }, { id: "curl-1", params: { scale: 4.8, speed: 0.2, flow: 2.45, contrast: 1.18, seed: 8, colorA: "#010207", colorB: "#64748b", colorC: "#c4b5fd" } }),
        createTextureNode("fluid-advection", { x: 230, y: 30 }, { id: "advection-1", params: { strength: 0.088, scale: 5.8, speed: 0.18, flow: 2.5, mix: 0.9 } }),
        createTextureNode("chromatic-aberration", { x: 470, y: 30 }, { id: "aberration-1", params: { aberration: 0.018, softness: 1.3, mix: 0.8 } }),
        createTextureNode("bloom", { x: 715, y: 30 }, { id: "bloom-1", params: { strength: 0.6, threshold: 0.46, radius: 10, softness: 0.92 } }),
        createTextureNode("color-grade", { x: 950, y: 30 }, { id: "grade-1", params: { colorA: "#010207", colorB: "#7dd3fc", colorC: "#c4b5fd", exposure: -0.08, contrast: 1.24, saturation: 0.78, temperature: -0.18, intensity: 0.58 } }),
        createTextureNode("out", { x: 1180, y: 30 }, { id: "out-1" }),
      ];
      return makePatch("texture-chromatic-smoke", "Chromatic Smoke", "aberration-1", "out-1", nodes, [
        createTextureEdge("curl-1", "advection-1"),
        createTextureEdge("advection-1", "aberration-1"),
        createTextureEdge("aberration-1", "bloom-1"),
        createTextureEdge("bloom-1", "grade-1"),
        createTextureEdge("grade-1", "out-1"),
      ]);
    },
  },
];

export const textureStarters: TextureStarter[] = [
  {
    id: "organic-refraction",
    label: "Organic Refraction",
    thumbnail: "organic-refraction",
    accent: "#67e8f9",
    description: "Glossy organic glass with cyan-violet highlights.",
    tags: ["glass", "premium"],
    recipeId: "liquid-aurora",
  },
  {
    id: "fluid-bloom",
    label: "Fluid Bloom",
    thumbnail: "fluid-bloom",
    accent: "#f7c978",
    description: "Additive light, glow, and poster-like signal energy.",
    tags: ["bloom", "signal"],
    recipeId: "bloom-signal",
  },
  {
    id: "volumetric-veil",
    label: "Volumetric Veil",
    thumbnail: "volumetric-veil",
    accent: "#a7f3d0",
    description: "Soft refractive folds and veil-like depth.",
    tags: ["soft", "glass"],
    recipeId: "glass-veil",
  },
  {
    id: "iridion-flow",
    label: "Iridion Flow",
    thumbnail: "iridion-flow",
    accent: "#c4b5fd",
    description: "Chromatic smoke flow with subtle lens splitting.",
    tags: ["smoke", "lens"],
    recipeId: "chromatic-smoke",
  },
  {
    id: "neural-foam",
    label: "Neural Foam",
    thumbnail: "neural-foam",
    accent: "#fda4af",
    description: "Cellular foam, reaction texture, and warm sparks.",
    tags: ["cells", "reaction"],
    recipeId: "reaction-field",
  },
  {
    id: "lava-lamp",
    label: "Lava Lamp",
    thumbnail: "lava-lamp",
    accent: "#fb923c",
    description: "Warm suspended blobs with glassy edges.",
    tags: ["warm", "blob"],
    recipeId: "bloom-signal",
  },
  {
    id: "bio-lattice",
    label: "Bio-Lattice",
    thumbnail: "bio-lattice",
    accent: "#8cf8d2",
    description: "Persistent organic growth field.",
    tags: ["bio", "lattice"],
    recipeId: "reaction-field",
  },
  {
    id: "oil-water",
    label: "Oil & Water",
    thumbnail: "oil-water",
    accent: "#93c5fd",
    description: "Iridescent fluid refraction with silver-blue grading.",
    tags: ["oil", "water"],
    recipeId: "glass-veil",
  },
];

export function framesToTime(frame: number, fps: number): number {
  return Math.max(0, frame) / Math.max(1, fps);
}

export function timeToFrame(time: number, fps: number): number {
  return Math.max(0, Math.round(time * Math.max(1, fps)));
}

export function getTextureRecipe(id: TextureRecipeId) {
  return textureRecipes.find((recipe) => recipe.id === id);
}

function clonePatch(patch: TexturePatch): TexturePatch {
  return {
    ...patch,
    nodes: patch.nodes.map((node) => ({ ...node, params: { ...node.params }, runtime: { ...node.runtime }, errors: [...node.errors] })),
    edges: patch.edges.map((edge) => ({ ...edge })),
  };
}

function updateNodes(
  patch: TexturePatch,
  predicate: (node: TextureNode) => boolean,
  updater: (params: ParamValues, node: TextureNode) => ParamValues
): TexturePatch {
  return {
    ...patch,
    nodes: patch.nodes.map((node) => (predicate(node) ? { ...node, params: updater({ ...node.params }, node) } : node)),
  };
}

function numericParam(value: ParamValue | undefined, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function nextNodeId(patch: TexturePatch, type: TextureOperatorType) {
  return `${type}-${patch.nodes.filter((node) => node.type === type).length + 1}`;
}

function insertBeforeOut(patch: TexturePatch, type: TextureOperatorType, params: Partial<ParamValues> = {}) {
  if (patch.nodes.some((node) => node.type === type)) return patch;
  const out = patch.nodes.find((node) => node.type === "out");
  if (!out) return patch;
  const incoming = patch.edges.find((edge) => edge.target === out.id && edge.targetPort === "in1");
  if (!incoming) return patch;
  const source = patch.nodes.find((node) => node.id === incoming.source);
  const node = createTextureNode(type, {
    x: (source?.position.x ?? out.position.x - 220) + 220,
    y: source?.position.y ?? out.position.y,
  }, {
    id: nextNodeId(patch, type),
    params,
  });
  const movedOut = { ...out, position: { x: node.position.x + 230, y: node.position.y } };
  return {
    ...patch,
    selectedNodeId: node.id,
    viewerNodeId: node.id,
    nodes: patch.nodes.map((item) => (item.id === out.id ? movedOut : item)).concat(node),
    edges: patch.edges
      .filter((edge) => edge.id !== incoming.id)
      .concat(createTextureEdge(incoming.source, node.id), createTextureEdge(node.id, out.id)),
  };
}

export type TextureCommandId =
  | "make-more-liquid"
  | "add-glass-refraction"
  | "increase-bloom"
  | "make-editorial-black"
  | "slow-motion";

export const textureCommands: { id: TextureCommandId; label: string; description: string }[] = [
  { id: "make-more-liquid", label: "Make it more liquid", description: "Pushes curl flow, advection strength, and refractive motion." },
  { id: "add-glass-refraction", label: "Add glass refraction", description: "Inserts or strengthens Raymarch Glass TOP before output." },
  { id: "increase-bloom", label: "Increase bloom", description: "Adds cinematic highlight diffusion and glow." },
  { id: "make-editorial-black", label: "Make editorial black", description: "Grades the system toward black, silver, cyan, and restrained contrast." },
  { id: "slow-motion", label: "Slow the motion", description: "Reduces speed, drift, and simulation motion without changing the structure." },
];

export function applyTextureCommand(patch: TexturePatch, id: TextureCommandId): TexturePatch {
  let next = clonePatch(patch);
  if (id === "make-more-liquid") {
    return updateNodes(next, (node) => ["curl-noise", "fluid-advection", "raymarch-glass", "displace"].includes(node.type), (params, node) => ({
      ...params,
      flow: Math.min(4, numericParam(params.flow, node.type === "curl-noise" ? 1.4 : 1) + 0.28),
      strength: Math.min(2, numericParam(params.strength, node.type === "raymarch-glass" ? 0.7 : 0.05) + (node.type === "raymarch-glass" ? 0.08 : 0.014)),
      refraction: Math.min(0.16, numericParam(params.refraction, 0.035) + 0.01),
    }));
  }
  if (id === "add-glass-refraction") {
    next = insertBeforeOut(next, "raymarch-glass", { depth: 1.25, refraction: 0.052, softness: 1, strength: 0.8, scale: 9 });
    return updateNodes(next, (node) => node.type === "raymarch-glass", (params) => ({
      ...params,
      depth: Math.min(3, numericParam(params.depth, 1) + 0.18),
      refraction: Math.min(0.16, numericParam(params.refraction, 0.04) + 0.012),
    }));
  }
  if (id === "increase-bloom") {
    next = insertBeforeOut(next, "bloom", { strength: 0.9, threshold: 0.34, radius: 11, softness: 0.9 });
    return updateNodes(next, (node) => node.type === "bloom", (params) => ({
      ...params,
      strength: Math.min(3, numericParam(params.strength, 0.8) + 0.28),
      radius: Math.min(28, numericParam(params.radius, 9) + 2),
      threshold: Math.max(0, numericParam(params.threshold, 0.34) - 0.04),
    }));
  }
  if (id === "make-editorial-black") {
    next = insertBeforeOut(next, "color-grade", {});
    return updateNodes(next, (node) => ["color-grade", "film-grain"].includes(node.type), (params, node) => (
      node.type === "film-grain"
        ? { ...params, grain: Math.max(0.06, numericParam(params.grain, 0.06)), vignette: Math.max(0.42, numericParam(params.vignette, 0.42)) }
        : { ...params, colorA: "#01040a", colorB: "#8bdcf7", colorC: "#f8fafc", exposure: -0.06, contrast: 1.34, saturation: 0.86, temperature: -0.14, intensity: 0.56 }
    ));
  }
  return updateNodes(next, () => true, (params) => ({
    ...params,
    speed: Math.max(0, numericParam(params.speed, 0) * 0.62),
    flow: Math.max(0, numericParam(params.flow, 0) * 0.82),
    driftX: numericParam(params.driftX, 0) * 0.55,
    driftY: numericParam(params.driftY, 0) * 0.55,
  }));
}

export function validateTexturePatch(patch: TexturePatch): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const ids = new Set(patch.nodes.map((node) => node.id));
  if (ids.size !== patch.nodes.length) errors.push("Node ids must be unique.");
  if (!ids.has(patch.selectedNodeId)) errors.push("Selected node is missing.");
  if (!ids.has(patch.viewerNodeId)) errors.push("Viewer node is missing.");
  const outNodes = patch.nodes.filter((node) => node.type === "out");
  if (outNodes.length !== 1) errors.push("Patch must contain exactly one Out TOP.");

  for (const edge of patch.edges) {
    const source = patch.nodes.find((node) => node.id === edge.source);
    const target = patch.nodes.find((node) => node.id === edge.target);
    if (!source || !target) {
      errors.push(`Invalid cable ${edge.id}.`);
      continue;
    }
    const sourceOperator = getTextureOperator(source.type);
    const targetOperator = getTextureOperator(target.type);
    if (!sourceOperator?.outputs.some((port) => port.id === edge.sourcePort)) {
      errors.push(`Invalid source port ${source.label}.${edge.sourcePort}.`);
    }
    const targetPort = targetOperator?.inputs.find((port) => port.id === edge.targetPort);
    if (!targetPort) {
      errors.push(`Invalid target port ${target.label}.${edge.targetPort}.`);
    }
    if (!targetPort?.multiple && patch.edges.filter((item) => item.target === edge.target && item.targetPort === edge.targetPort).length > 1) {
      errors.push(`Input ${target.label}.${edge.targetPort} can only accept one cable.`);
    }
  }

  if (hasCycle(patch)) errors.push("Patch contains a cycle. Use Feedback TOP or Simulation TOPs instead of circular cables.");
  return { valid: errors.length === 0, errors };
}

function hasCycle(patch: TexturePatch): boolean {
  const graph = new Map<string, string[]>();
  for (const node of patch.nodes) graph.set(node.id, []);
  for (const edge of patch.edges) graph.get(edge.source)?.push(edge.target);

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(id: string): boolean {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const next of graph.get(id) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  return patch.nodes.some((node) => visit(node.id));
}

function incomingFor(patch: TexturePatch, nodeId: string): TextureEdge[] {
  return patch.edges.filter((edge) => edge.target === nodeId);
}

function sortedIncomingFor(patch: TexturePatch, node: TextureNode): TextureEdge[] {
  const operator = getTextureOperator(node.type);
  const order = new Map((operator?.inputs ?? []).map((port, index) => [port.id, index]));
  return [...incomingFor(patch, node.id)].sort((a, b) => (order.get(a.targetPort) ?? 99) - (order.get(b.targetPort) ?? 99));
}

export function compileTexturePatch(patch: TexturePatch): TextureRenderPlan {
  const validation = validateTexturePatch(patch);
  const nodeById = new Map(patch.nodes.map((node) => [node.id, node]));
  const outNode = patch.nodes.find((node) => node.type === "out") ?? patch.nodes[0];
  const reachable = new Set<string>();

  function collect(id: string) {
    if (reachable.has(id)) return;
    reachable.add(id);
    for (const edge of incomingFor(patch, id)) collect(edge.source);
  }
  if (outNode) collect(outNode.id);

  const ordered: TextureNode[] = [];
  const seen = new Set<string>();
  function addNode(id: string) {
    if (seen.has(id)) return;
    const node = nodeById.get(id);
    const incoming = node ? sortedIncomingFor(patch, node) : incomingFor(patch, id);
    for (const edge of incoming) addNode(edge.source);
    if (node && reachable.has(node.id)) {
      ordered.push(node);
      seen.add(id);
    }
  }
  if (outNode) addNode(outNode.id);

  const passes = ordered.map((node): TextureRenderPass => {
    const operator = getTextureOperator(node.type);
    return {
      nodeId: node.id,
      type: node.type,
      label: node.label,
      shader: operator?.shader ?? "copy",
      shaderModules: operator?.shaderModules ?? { webgl2: "copy" },
      params: node.params,
      inputNodeIds: sortedIncomingFor(patch, node).map((edge) => edge.source),
      bypass: node.bypass,
      usesFeedback: Boolean(operator?.supportsFeedback || operator?.persistentBuffer),
      persistentBuffer: operator?.persistentBuffer ?? null,
    };
  });

  return {
    id: patch.id,
    name: patch.name,
    resolution: patch.resolution,
    rendererBackend: patch.rendererBackend,
    quality: patch.quality,
    passes,
    outputNodeId: outNode?.id ?? "",
    viewerNodeId: patch.viewerNodeId,
    errors: validation.errors,
  };
}

export function countPersistentBuffers(plan: TextureRenderPlan): number {
  return plan.passes.filter((pass) => pass.persistentBuffer).length;
}
