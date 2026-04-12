import { create } from "zustand";
import { temporal } from "zundo";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SceneNode = {
  id: string;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
};

export type Edge = { from: string; to: string };

export type LayerConfig = {
  enabled: boolean;
  intensity: number;
  color?: string;
  params: Record<string, number>;
};

export type Layers = {
  spheres: LayerConfig;
  tendrils: LayerConfig;
  dust: LayerConfig;
  splatter: LayerConfig;
  nebula: LayerConfig;
  flow: LayerConfig;
  wireframe: LayerConfig;
  halos: LayerConfig;
  lightRays: LayerConfig;
};

export type ModulationPreset = "none" | "breathe" | "pulse" | "random";

export type Modulation = {
  target: string;
  preset: ModulationPreset;
  speed: number;
  amplitude: number;
};

export type SerializedState = {
  nodes: SceneNode[];
  edges: Edge[];
  layers: Layers;
  modulations: Modulation[];
  breathe: number;
  pulseSpeed: number;
  tempo: number;
  seed: number;
  palette: string[];
  postFX: PostFX;
};

export type Snapshot = {
  id: string;
  name: string;
  timestamp: number;
  state: SerializedState;
};

export type Trigger =
  | { type: "time"; delay: number }
  | { type: "click" }
  | { type: "paramThreshold"; param: string; value: number; direction: "above" | "below" };

export type SceneConnection = {
  id: string;
  from: string;
  to: string;
  trigger: Trigger;
  transition: {
    duration: number;
    easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  };
};

export type MeshPreset = "ring" | "constellation" | "grid" | "spiral" | "cluster" | "single";

export const MESH_PRESETS: { id: MeshPreset; label: string }[] = [
  { id: "ring", label: "Ring" },
  { id: "constellation", label: "Constellation" },
  { id: "grid", label: "Grid" },
  { id: "spiral", label: "Spiral" },
  { id: "cluster", label: "Cluster" },
  { id: "single", label: "Single" },
];

export type PostFX = {
  bloom: boolean;
  chromatic: boolean;
  vignette: boolean;
  dof: boolean;
  grain: boolean;
  toneMapping: boolean;
  motionBlur: boolean;
};

export type ImagePlane = {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

// ---------------------------------------------------------------------------
// Layer defaults
// ---------------------------------------------------------------------------

function defaultLayerConfig(enabled: boolean, params: Record<string, number>): LayerConfig {
  return { enabled, intensity: 1, color: undefined, params };
}

const DEFAULT_LAYERS: Layers = {
  spheres: defaultLayerConfig(true, {
    countPerVertex: 40,
    sizeMin: 0.8,
    sizeMax: 12,
    scatterRadius: 25,
    metalness: 0.3,
    roughness: 0.15,
    transmission: 0.3,
    iridescence: 0,
    emissiveIntensity: 0.15,
  }),
  tendrils: defaultLayerConfig(false, {
    thickness: 1.5,
    branchCount: 3,
    growthSpeed: 1.0,
    glowIntensity: 0.5,
  }),
  dust: defaultLayerConfig(false, {
    density: 1000,
    particleSize: 1.5,
    drift: 0.5,
    opacity: 0.6,
  }),
  splatter: defaultLayerConfig(false, {
    count: 100,
    size: 8,
    spread: 50,
    splashiness: 0.5,
  }),
  nebula: defaultLayerConfig(false, {}),
  flow: defaultLayerConfig(false, {}),
  wireframe: defaultLayerConfig(false, {}),
  halos: defaultLayerConfig(false, {}),
  lightRays: defaultLayerConfig(false, {}),
};

// ---------------------------------------------------------------------------
// Preset generators (migrated from grid-based to SceneNode-based)
// ---------------------------------------------------------------------------

function generatePreset(preset: MeshPreset): { nodes: SceneNode[]; edges: Edge[] } {
  const nodes: SceneNode[] = [];
  const edges: Edge[] = [];
  let nodeIdCounter = 0;

  const addNode = (x: number, y: number, z: number = 0): string => {
    const id = `preset-${nodeIdCounter++}`;
    nodes.push({ id, position: [x, y, z], scale: 1, rotation: [0, 0, 0] });
    return id;
  };

  // All positions in 3D space (X: -250 to 250, Y: -150 to 150)
  if (preset === "ring") {
    const n = 8;
    const r = 120;
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      ids.push(addNode(Math.cos(angle) * r, Math.sin(angle) * r));
    }
    for (let i = 0; i < n; i++) {
      edges.push({ from: ids[i], to: ids[(i + 1) % n] });
    }
    edges.push({ from: ids[0], to: ids[4] }, { from: ids[2], to: ids[6] });
  } else if (preset === "constellation") {
    const positions: [number, number][] = [
      [-150, 75], [-75, 105], [25, 90], [125, 60],
      [-175, 0], [-50, -15], [50, 0], [150, -15],
      [-125, -75], [-25, -60], [75, -90], [175, -60],
    ];
    const ids = positions.map(([x, y]) => addNode(x, y));
    const conns = [[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[5,1],[6,2],[8,9],[9,10],[10,11],[4,8],[9,5],[10,6],[11,7]];
    for (const [a, b] of conns) edges.push({ from: ids[a], to: ids[b] });
  } else if (preset === "grid") {
    const cols = 4, rows = 3;
    const ids: string[][] = [];
    for (let r = 0; r < rows; r++) {
      ids.push([]);
      for (let c = 0; c < cols; c++) {
        const x = -150 + (300 / (cols - 1)) * c;
        const y = 75 - (150 / (rows - 1)) * r;
        ids[r].push(addNode(x, y));
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c < cols - 1) edges.push({ from: ids[r][c], to: ids[r][c + 1] });
        if (r < rows - 1) edges.push({ from: ids[r][c], to: ids[r + 1][c] });
      }
    }
  } else if (preset === "spiral") {
    const n = 10;
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const angle = t * Math.PI * 3;
      const rad = 30 + t * 120;
      ids.push(addNode(Math.cos(angle) * rad, Math.sin(angle) * rad));
    }
    for (let i = 0; i < n - 1; i++) edges.push({ from: ids[i], to: ids[i + 1] });
    edges.push({ from: ids[0], to: ids[3] }, { from: ids[2], to: ids[5] }, { from: ids[4], to: ids[7] }, { from: ids[6], to: ids[9] });
  } else if (preset === "cluster") {
    const groups = [
      { cx: -125, cy: 30 },
      { cx: 50, cy: 60 },
      { cx: 0, cy: -60 },
    ];
    const gr = 35;
    const allIds: string[][] = [];
    for (const g of groups) {
      const gids: string[] = [];
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        gids.push(addNode(g.cx + Math.cos(angle) * gr, g.cy + Math.sin(angle) * gr));
      }
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          edges.push({ from: gids[i], to: gids[j] });
        }
      }
      allIds.push(gids);
    }
    edges.push(
      { from: allIds[0][1], to: allIds[1][3] },
      { from: allIds[1][2], to: allIds[2][0] },
      { from: allIds[2][1], to: allIds[0][2] },
    );
  } else if (preset === "single") {
    addNode(0, 0);
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Store state type
// ---------------------------------------------------------------------------

type CreatorState = {
  // Scene graph
  nodes: SceneNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  activePreset: MeshPreset;

  // Layers
  layers: Layers;

  // Modulations
  modulations: Modulation[];

  // Global params
  breathe: number;
  pulseSpeed: number;
  tempo: number;
  seed: number;

  // Visuals
  palette: string[];
  postFX: PostFX;

  // Snapshots & sequencer
  snapshots: Snapshot[];
  connections: SceneConnection[];
  activeSnapshotId: string | null;
  isPlaying: boolean;

  // Assets
  imagePlanes: ImagePlane[];

  // --- Actions ---

  // Nodes
  addNode: (position: [number, number, number]) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<SceneNode>) => void;
  selectNode: (id: string | null) => void;

  // Edges
  addEdge: (from: string, to: string) => void;
  removeEdge: (from: string, to: string) => void;

  // Layers
  setLayerEnabled: (layer: keyof Layers, enabled: boolean) => void;
  setLayerIntensity: (layer: keyof Layers, intensity: number) => void;
  setLayerColor: (layer: keyof Layers, color: string | undefined) => void;
  setLayerParam: (layer: keyof Layers, param: string, value: number) => void;

  // Modulations
  addModulation: (mod: Modulation) => void;
  removeModulation: (target: string) => void;
  updateModulation: (target: string, updates: Partial<Modulation>) => void;

  // Snapshots & sequencer
  takeSnapshot: (name: string) => void;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  addConnection: (from: string, to: string, trigger: Trigger) => void;
  removeConnection: (id: string) => void;
  updateConnection: (id: string, updates: Partial<SceneConnection>) => void;
  setPlaying: (playing: boolean) => void;

  // Presets & global
  setPreset: (preset: MeshPreset) => void;
  setBreathe: (v: number) => void;
  setPulseSpeed: (v: number) => void;
  setTempo: (v: number) => void;
  setPalette: (colors: string[]) => void;
  randomizeSeed: () => void;
  togglePostFX: (effect: keyof PostFX) => void;
  clearAll: () => void;

  // Image planes
  addImagePlane: (url: string, position: [number, number, number]) => void;
  removeImagePlane: (id: string) => void;
  updateImagePlane: (id: string, transform: Partial<Pick<ImagePlane, "position" | "rotation" | "scale">>) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasEdge(edges: Edge[], from: string, to: string): boolean {
  return edges.some(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
  );
}

let nodeIdCounter = 0;
let planeIdCounter = 0;
let snapshotIdCounter = 0;
let connectionIdCounter = 0;

function serializeState(state: CreatorState): SerializedState {
  return {
    nodes: state.nodes.map((n) => ({ ...n })),
    edges: state.edges.map((e) => ({ ...e })),
    layers: JSON.parse(JSON.stringify(state.layers)),
    modulations: state.modulations.map((m) => ({ ...m })),
    breathe: state.breathe,
    pulseSpeed: state.pulseSpeed,
    tempo: state.tempo,
    seed: state.seed,
    palette: [...state.palette],
    postFX: { ...state.postFX },
  };
}

// ---------------------------------------------------------------------------
// Initial state factory (used for getInitialState and resets)
// ---------------------------------------------------------------------------

function getInitialStateValues() {
  return {
    nodes: [] as SceneNode[],
    edges: [] as Edge[],
    selectedNodeId: null as string | null,
    activePreset: "constellation" as MeshPreset,

    layers: JSON.parse(JSON.stringify(DEFAULT_LAYERS)) as Layers,

    modulations: [] as Modulation[],

    breathe: 8,
    pulseSpeed: 1.0,
    tempo: 1.0,
    seed: Math.floor(Math.random() * 10000),

    palette: ["#00ffa3", "#0088ff", "#cc44ff", "#ffffff", "#ff2d6b"],
    postFX: {
      bloom: false,
      chromatic: false,
      vignette: false,
      dof: false,
      grain: false,
      toneMapping: false,
      motionBlur: false,
    } as PostFX,

    snapshots: [] as Snapshot[],
    connections: [] as SceneConnection[],
    activeSnapshotId: null as string | null,
    isPlaying: false,

    imagePlanes: [] as ImagePlane[],
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCreatorStore = create<CreatorState>()(
  temporal(
    (set, get) => ({
      ...getInitialStateValues(),

      // --- Node actions ---
      addNode: (position) =>
        set((state) => ({
          nodes: [...state.nodes, { id: `node-${++nodeIdCounter}`, position, scale: 1, rotation: [0, 0, 0] as [number, number, number] }],
        })),

      removeNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.from !== id && e.to !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        })),

      updateNode: (id, updates) =>
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),

      selectNode: (id) => set({ selectedNodeId: id }),

      // --- Edge actions ---
      addEdge: (from, to) =>
        set((state) => {
          if (hasEdge(state.edges, from, to)) return state;
          return { edges: [...state.edges, { from, to }] };
        }),

      removeEdge: (from, to) =>
        set((state) => ({
          edges: state.edges.filter(
            (e) => !((e.from === from && e.to === to) || (e.from === to && e.to === from)),
          ),
        })),

      // --- Layer actions ---
      setLayerEnabled: (layer, enabled) =>
        set((state) => ({
          layers: { ...state.layers, [layer]: { ...state.layers[layer], enabled } },
        })),

      setLayerIntensity: (layer, intensity) =>
        set((state) => ({
          layers: { ...state.layers, [layer]: { ...state.layers[layer], intensity } },
        })),

      setLayerColor: (layer, color) =>
        set((state) => ({
          layers: { ...state.layers, [layer]: { ...state.layers[layer], color } },
        })),

      setLayerParam: (layer, param, value) =>
        set((state) => ({
          layers: {
            ...state.layers,
            [layer]: {
              ...state.layers[layer],
              params: { ...state.layers[layer].params, [param]: value },
            },
          },
        })),

      // --- Modulation actions ---
      addModulation: (mod) =>
        set((state) => ({ modulations: [...state.modulations, mod] })),

      removeModulation: (target) =>
        set((state) => ({
          modulations: state.modulations.filter((m) => m.target !== target),
        })),

      updateModulation: (target, updates) =>
        set((state) => ({
          modulations: state.modulations.map((m) =>
            m.target === target ? { ...m, ...updates } : m,
          ),
        })),

      // --- Snapshot & sequencer actions ---
      takeSnapshot: (name) =>
        set((state) => {
          const snap: Snapshot = {
            id: `snap-${++snapshotIdCounter}`,
            name,
            timestamp: Date.now(),
            state: serializeState(state),
          };
          return { snapshots: [...state.snapshots, snap] };
        }),

      loadSnapshot: (id) => {
        const state = get();
        const snap = state.snapshots.find((s) => s.id === id);
        if (!snap) return;
        set({
          nodes: snap.state.nodes,
          edges: snap.state.edges,
          layers: JSON.parse(JSON.stringify(snap.state.layers)),
          modulations: snap.state.modulations,
          breathe: snap.state.breathe,
          pulseSpeed: snap.state.pulseSpeed,
          tempo: snap.state.tempo,
          seed: snap.state.seed,
          palette: snap.state.palette,
          postFX: snap.state.postFX,
          activeSnapshotId: id,
        });
      },

      deleteSnapshot: (id) =>
        set((state) => ({
          snapshots: state.snapshots.filter((s) => s.id !== id),
          connections: state.connections.filter((c) => c.from !== id && c.to !== id),
          activeSnapshotId: state.activeSnapshotId === id ? null : state.activeSnapshotId,
        })),

      addConnection: (from, to, trigger) =>
        set((state) => ({
          connections: [
            ...state.connections,
            {
              id: `conn-${++connectionIdCounter}`,
              from,
              to,
              trigger,
              transition: { duration: 1000, easing: "ease-in-out" as const },
            },
          ],
        })),

      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
        })),

      updateConnection: (id, updates) =>
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        })),

      setPlaying: (playing) => set({ isPlaying: playing }),

      // --- Preset & global actions ---
      setPreset: (preset) => {
        const { nodes, edges } = generatePreset(preset);
        set({ nodes, edges, selectedNodeId: null, activePreset: preset });
      },

      setBreathe: (v) => set({ breathe: v }),
      setPulseSpeed: (v) => set({ pulseSpeed: v }),
      setTempo: (v) => set({ tempo: v }),
      setPalette: (colors) => set({ palette: colors }),
      randomizeSeed: () => set({ seed: Math.floor(Math.random() * 10000) }),

      togglePostFX: (effect) =>
        set((state) => ({
          postFX: { ...state.postFX, [effect]: !state.postFX[effect] },
        })),

      clearAll: () => set({ edges: [], selectedNodeId: null, imagePlanes: [] }),

      // --- Image plane actions ---
      addImagePlane: (url, position) =>
        set((state) => {
          if (state.imagePlanes.length >= 10) return state;
          const plane: ImagePlane = {
            id: `plane-${++planeIdCounter}`,
            url,
            position,
            rotation: [0, 0, 0],
            scale: 1,
          };
          return { imagePlanes: [...state.imagePlanes, plane] };
        }),

      removeImagePlane: (id) =>
        set((state) => ({
          imagePlanes: state.imagePlanes.filter((p) => p.id !== id),
        })),

      updateImagePlane: (id, transform) =>
        set((state) => ({
          imagePlanes: state.imagePlanes.map((p) =>
            p.id === id ? { ...p, ...transform } : p,
          ),
        })),
    }),
    { limit: 50 },
  ),
);

// Expose getInitialState for test resets
(useCreatorStore as unknown as { getInitialState: () => ReturnType<typeof getInitialStateValues> }).getInitialState = getInitialStateValues;
