import type { ParamSchema, ParamValue, ParamValues } from "./types";
import { getBlock } from "./blocks";
import type { BlendMode } from "./layers";

export type VisualNodeKind =
  | "source"
  | "motion"
  | "color"
  | "feedback"
  | "composite"
  | "output";

export type VisualNode = {
  id: string;
  kind: VisualNodeKind;
  label: string;
  description: string;
  blockId: string | null;
  position: { x: number; y: number };
  schema: ParamSchema;
  params: ParamValues;
  opacity: number;
  blendMode: BlendMode;
};

export type VisualEdge = {
  id: string;
  source: string;
  target: string;
};

export type Keyframe = {
  id: string;
  time: number;
  value: ParamValue;
};

export type KeyframeTrack = {
  id: string;
  nodeId: string;
  paramKey: string;
  keyframes: Keyframe[];
};

export type VisualPatch = {
  id: string;
  name: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  selectedNodeId: string;
  nodes: VisualNode[];
  edges: VisualEdge[];
  tracks: KeyframeTrack[];
};

export type RenderPlanLayer = {
  nodeId: string;
  name: string;
  code: string;
  params: ParamValues;
  opacity: number;
  blendMode: BlendMode;
};

export type RenderPlan = {
  id: string;
  name: string;
  layers: RenderPlanLayer[];
};

const nodeCatalog: Record<
  Exclude<VisualNodeKind, "output">,
  {
    label: string;
    blockId: string;
    description: string;
    opacity: number;
    blendMode: BlendMode;
  }
> = {
  source: {
    label: "Generative Field",
    blockId: "contour",
    description: "A living canvas source. It establishes structure, scale, and surface.",
    opacity: 1,
    blendMode: "normal",
  },
  motion: {
    label: "Flow Motion",
    blockId: "flowfield",
    description: "Moves marks through noise currents, giving the patch its body language.",
    opacity: 0.62,
    blendMode: "screen",
  },
  color: {
    label: "Aurora Color",
    blockId: "aurora",
    description: "Washes the system with palette, glow, and atmospheric drift.",
    opacity: 0.82,
    blendMode: "screen",
  },
  feedback: {
    label: "Particle Feedback",
    blockId: "drift",
    description: "Adds memory, trails, density, and a soft performance-like residue.",
    opacity: 0.38,
    blendMode: "screen",
  },
  composite: {
    label: "Bloom Composite",
    blockId: "bloom",
    description: "A final visual treatment for luminosity, rhythm, and presence.",
    opacity: 0.36,
    blendMode: "screen",
  },
};

function defaultsForSchema(schema: ParamSchema): ParamValues {
  return Object.fromEntries(
    Object.entries(schema).map(([key, def]) => [key, def.default])
  ) as ParamValues;
}

function createVisualNode(
  kind: VisualNodeKind,
  id: string,
  position: { x: number; y: number },
  overrides: Partial<VisualNode> = {}
): VisualNode {
  if (kind === "output") {
    return {
      id,
      kind,
      label: "Output",
      description: "The final canvas that appears in preview, export, and publish.",
      blockId: null,
      position,
      schema: {},
      params: {},
      opacity: 1,
      blendMode: "normal",
      ...overrides,
    };
  }

  const catalogItem = nodeCatalog[kind];
  const block = getBlock(catalogItem.blockId);
  const schema = block?.schema ?? {};

  return {
    id,
    kind,
    label: catalogItem.label,
    description: catalogItem.description,
    blockId: catalogItem.blockId,
    position,
    schema,
    params: {
      ...defaultsForSchema(schema),
      ...(overrides.params ?? {}),
    },
    opacity: catalogItem.opacity,
    blendMode: catalogItem.blendMode,
    ...overrides,
  };
}

export function createDefaultPatch(): VisualPatch {
  const nodes: VisualNode[] = [
    createVisualNode("source", "source-1", { x: 0, y: 120 }, {
      params: { lines: 42, noiseScale: 0.0035 },
    }),
    createVisualNode("motion", "motion-1", { x: 145, y: 36 }, {
      params: { density: 650, speed: 1.45, noiseScale: 0.006, lineWeight: 1.25, fadeRate: 13 },
    }),
    createVisualNode("color", "color-1", { x: 290, y: 120 }, {
      params: { bands: 7, amplitude: 150, speed: 0.8 },
    }),
    createVisualNode("feedback", "feedback-1", { x: 435, y: 36 }, {
      params: { density: 900, speed: 0.7, turbulence: 0.006, trail: 58, weight: 0.9 },
    }),
    createVisualNode("output", "output-1", { x: 580, y: 120 }),
  ];

  return {
    id: "patch-cinematic-field",
    name: "Cinematic Field",
    duration: 8,
    currentTime: 1.6,
    isPlaying: false,
    selectedNodeId: "motion-1",
    nodes,
    edges: [
      { id: "source-motion", source: "source-1", target: "motion-1" },
      { id: "motion-color", source: "motion-1", target: "color-1" },
      { id: "color-feedback", source: "color-1", target: "feedback-1" },
      { id: "feedback-output", source: "feedback-1", target: "output-1" },
    ],
    tracks: [
      {
        id: "motion-speed-track",
        nodeId: "motion-1",
        paramKey: "speed",
        keyframes: [
          { id: "motion-speed-a", time: 0, value: 0.45 },
          { id: "motion-speed-b", time: 4, value: 2.2 },
          { id: "motion-speed-c", time: 8, value: 0.45 },
        ],
      },
    ],
  };
}

export function validatePatch(patch: VisualPatch): boolean {
  if (!patch.nodes.length) return false;
  const ids = new Set(patch.nodes.map((node) => node.id));
  if (ids.size !== patch.nodes.length) return false;
  if (!ids.has(patch.selectedNodeId)) return false;
  if (!patch.nodes.some((node) => node.kind === "output")) return false;
  return patch.edges.every((edge) => ids.has(edge.source) && ids.has(edge.target));
}

export function getConnectedNodeIds(patch: VisualPatch): Set<string> {
  const output = patch.nodes.find((node) => node.kind === "output");
  if (!output) return new Set();

  const connected = new Set<string>([output.id]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const edge of patch.edges) {
      if (connected.has(edge.target) && !connected.has(edge.source)) {
        connected.add(edge.source);
        changed = true;
      }
    }
  }

  return connected;
}

export function compilePatchToRenderPlan(patch: VisualPatch): RenderPlan {
  const connected = getConnectedNodeIds(patch);
  const layers = patch.nodes
    .filter((node) => node.kind !== "output" && connected.has(node.id) && node.blockId)
    .sort((a, b) => a.position.x - b.position.x)
    .map((node) => {
      const block = node.blockId ? getBlock(node.blockId) : undefined;
      return {
        nodeId: node.id,
        name: node.label,
        code: block?.code ?? "",
        params: node.params,
        opacity: node.opacity,
        blendMode: node.blendMode,
      };
    })
    .filter((layer) => layer.code.length > 0);

  return { id: patch.id, name: patch.name, layers };
}

function interpolateNumber(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function hexToRgb(value: string): [number, number, number] | null {
  const match = value.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return [
    parseInt(match[1], 16),
    parseInt(match[2], 16),
    parseInt(match[3], 16),
  ];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
}

export function interpolateKeyframes(track: KeyframeTrack, time: number): ParamValue | null {
  const keyframes = [...track.keyframes].sort((a, b) => a.time - b.time);
  if (!keyframes.length) return null;
  if (time <= keyframes[0].time) return keyframes[0].value;
  if (time >= keyframes[keyframes.length - 1].time) return keyframes[keyframes.length - 1].value;

  const nextIndex = keyframes.findIndex((keyframe) => keyframe.time >= time);
  const prev = keyframes[nextIndex - 1];
  const next = keyframes[nextIndex];
  const progress = (time - prev.time) / (next.time - prev.time);

  if (typeof prev.value === "number" && typeof next.value === "number") {
    return interpolateNumber(prev.value, next.value, progress);
  }

  if (typeof prev.value === "string" && typeof next.value === "string") {
    const prevRgb = hexToRgb(prev.value);
    const nextRgb = hexToRgb(next.value);
    if (prevRgb && nextRgb) {
      return rgbToHex([
        interpolateNumber(prevRgb[0], nextRgb[0], progress),
        interpolateNumber(prevRgb[1], nextRgb[1], progress),
        interpolateNumber(prevRgb[2], nextRgb[2], progress),
      ]);
    }
  }

  return progress < 0.5 ? prev.value : next.value;
}

export function valueAtTime(
  patch: VisualPatch,
  nodeId: string,
  paramKey: string,
  fallback: ParamValue
): ParamValue {
  const track = patch.tracks.find((item) => item.nodeId === nodeId && item.paramKey === paramKey);
  return track ? interpolateKeyframes(track, patch.currentTime) ?? fallback : fallback;
}

export function nodeKindLabel(kind: VisualNodeKind): string {
  const labels: Record<VisualNodeKind, string> = {
    source: "Source",
    motion: "Motion",
    color: "Color",
    feedback: "Feedback",
    composite: "Composite",
    output: "Output",
  };
  return labels[kind];
}

export function createNodeFromKind(kind: VisualNodeKind, index: number): VisualNode {
  const x = 120 + index * 120;
  const y = 260 + (index % 2) * 90;
  return createVisualNode(kind, `${kind}-${Date.now()}`, { x, y });
}
