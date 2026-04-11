import { create } from "zustand";

export type GridPoint = {
  id: string;
  col: number;
  row: number;
  worldX: number;
  worldY: number;
};

export type Edge = {
  from: string;
  to: string;
};

export type RenderMode = "fluid" | "nebula" | "crystal" | "mycelium" | "plasma" | "erosion" | "flow";

export type MeshPreset = "ring" | "constellation" | "grid" | "spiral" | "cluster" | "single";

export const MESH_PRESETS: { id: MeshPreset; label: string }[] = [
  { id: "ring", label: "Ring" },
  { id: "constellation", label: "Constellation" },
  { id: "grid", label: "Grid" },
  { id: "spiral", label: "Spiral" },
  { id: "cluster", label: "Cluster" },
  { id: "single", label: "Single" },
];

function generatePreset(preset: MeshPreset, width: number, height: number): { points: GridPoint[]; edges: Edge[] } {
  const cx = width / 2;
  const cy = height / 2;
  const points: GridPoint[] = [];
  const edges: Edge[] = [];

  const addPoint = (id: string, x: number, y: number) => {
    points.push({ id, col: 0, row: 0, worldX: x, worldY: y });
  };

  if (preset === "ring") {
    const n = 8;
    const r = Math.min(width, height) * 0.3;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      addPoint(`r${i}`, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    for (let i = 0; i < n; i++) {
      edges.push({ from: `r${i}`, to: `r${(i + 1) % n}` });
    }
    // Cross connections for visual density
    edges.push({ from: "r0", to: "r4" }, { from: "r2", to: "r6" });
  } else if (preset === "constellation") {
    // Scattered organic layout
    const positions = [
      [0.2, 0.25], [0.35, 0.15], [0.55, 0.2], [0.75, 0.3],
      [0.15, 0.5], [0.4, 0.45], [0.6, 0.5], [0.8, 0.55],
      [0.25, 0.75], [0.45, 0.7], [0.65, 0.8], [0.85, 0.7],
    ];
    for (let i = 0; i < positions.length; i++) {
      addPoint(`c${i}`, positions[i][0] * width, positions[i][1] * height);
    }
    // Sparse, organic connections
    const conns = [[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[5,1],[6,2],[8,9],[9,10],[10,11],[4,8],[9,5],[10,6],[11,7]];
    for (const [a, b] of conns) edges.push({ from: `c${a}`, to: `c${b}` });
  } else if (preset === "grid") {
    const cols = 4, rows = 3;
    const sx = width * 0.2, ex = width * 0.8;
    const sy = height * 0.25, ey = height * 0.75;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = sx + (ex - sx) * (c / (cols - 1));
        const y = sy + (ey - sy) * (r / (rows - 1));
        addPoint(`g${r}-${c}`, x, y);
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c < cols - 1) edges.push({ from: `g${r}-${c}`, to: `g${r}-${c + 1}` });
        if (r < rows - 1) edges.push({ from: `g${r}-${c}`, to: `g${r + 1}-${c}` });
      }
    }
  } else if (preset === "spiral") {
    const n = 10;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const angle = t * Math.PI * 3;
      const r = (0.1 + t * 0.3) * Math.min(width, height);
      addPoint(`s${i}`, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    for (let i = 0; i < n - 1; i++) {
      edges.push({ from: `s${i}`, to: `s${i + 1}` });
    }
    // Skip connections for visual interest
    edges.push({ from: "s0", to: "s3" }, { from: "s2", to: "s5" }, { from: "s4", to: "s7" }, { from: "s6", to: "s9" });
  } else if (preset === "cluster") {
    // 3 groups of 4
    const groups = [
      { cx: 0.25, cy: 0.4, prefix: "a" },
      { cx: 0.6, cy: 0.3, prefix: "b" },
      { cx: 0.5, cy: 0.7, prefix: "c" },
    ];
    const gr = Math.min(width, height) * 0.08;
    for (const g of groups) {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        addPoint(`${g.prefix}${i}`, g.cx * width + Math.cos(angle) * gr, g.cy * height + Math.sin(angle) * gr);
      }
      // Fully connect each cluster
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          edges.push({ from: `${g.prefix}${i}`, to: `${g.prefix}${j}` });
        }
      }
    }
    // Inter-group connections
    edges.push({ from: "a1", to: "b3" }, { from: "b2", to: "c0" }, { from: "c1", to: "a2" });
  } else if (preset === "single") {
    addPoint("x0", cx, cy);
    // No edges — just one hero vertex
  }

  return { points, edges };
};

export const RENDER_MODES: { id: RenderMode; label: string }[] = [
  { id: "fluid", label: "Fluid" },
  { id: "nebula", label: "Nebula" },
  { id: "crystal", label: "Crystal" },
  { id: "mycelium", label: "Mycelium" },
  { id: "plasma", label: "Plasma" },
  { id: "erosion", label: "Erosion" },
  { id: "flow", label: "Flow" },
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

type CreatorState = {
  gridCols: number;
  gridRows: number;
  points: GridPoint[];
  edges: Edge[];
  selectedPoint: string | null;
  renderMode: RenderMode;
  breathe: number;
  pulseSpeed: number;
  extrudeDepth: number;
  palette: string[];
  tempo: number;
  seed: number;
  activePreset: MeshPreset;
  postFX: PostFX;
  imagePlanes: ImagePlane[];
  setPreset: (preset: MeshPreset) => void;
  initGrid: (cols: number, rows: number, width: number, height: number) => void;
  selectPoint: (id: string) => void;
  clearSelection: () => void;
  addEdge: (from: string, to: string) => void;
  removeLastEdge: () => void;
  clearAll: () => void;
  setRenderMode: (mode: RenderMode) => void;
  setBreathe: (v: number) => void;
  setPulseSpeed: (v: number) => void;
  setExtrudeDepth: (v: number) => void;
  setPalette: (colors: string[]) => void;
  setTempo: (v: number) => void;
  randomizeSeed: () => void;
  togglePostFX: (effect: keyof PostFX) => void;
  addImagePlane: (url: string, position: [number, number, number]) => void;
  removeImagePlane: (id: string) => void;
  updateImagePlane: (id: string, transform: Partial<Pick<ImagePlane, "position" | "rotation" | "scale">>) => void;
};

function hasEdge(edges: Edge[], from: string, to: string): boolean {
  return edges.some(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
  );
}

let planeIdCounter = 0;

export const useCreatorStore = create<CreatorState>((set) => ({
  gridCols: 16,
  gridRows: 10,
  points: [],
  edges: [],
  selectedPoint: null,
  activePreset: "constellation" as MeshPreset,
  renderMode: "fluid" as RenderMode,
  breathe: 8,
  pulseSpeed: 1.0,
  extrudeDepth: 0,
  palette: ["#00ffa3", "#0088ff", "#cc44ff", "#ffffff", "#ff2d6b"],
  tempo: 1.0,
  seed: Math.floor(Math.random() * 10000),
  postFX: {
    bloom: false,
    chromatic: false,
    vignette: false,
    dof: false,
    grain: false,
    toneMapping: false,
    motionBlur: false,
  },
  imagePlanes: [],

  setPreset: (preset) => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    const { points, edges } = generatePreset(preset, w, h);
    set({ points, edges, selectedPoint: null, activePreset: preset });
  },

  initGrid: (cols, rows, width, height) => {
    const spacingX = width / (cols + 1);
    const spacingY = height / (rows + 1);
    const points: GridPoint[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        points.push({
          id: `${c}-${r}`,
          col: c,
          row: r,
          worldX: (c + 1) * spacingX,
          worldY: (r + 1) * spacingY,
        });
      }
    }
    set({ points, gridCols: cols, gridRows: rows, edges: [], selectedPoint: null });
  },

  selectPoint: (id) =>
    set((state) => {
      if (!state.selectedPoint) return { selectedPoint: id };
      if (state.selectedPoint === id) return { selectedPoint: null };
      const from = state.selectedPoint;
      const to = id;
      if (hasEdge(state.edges, from, to)) return { selectedPoint: id };
      return { edges: [...state.edges, { from, to }], selectedPoint: id };
    }),

  clearSelection: () => set({ selectedPoint: null }),

  addEdge: (from, to) =>
    set((state) => {
      if (hasEdge(state.edges, from, to)) return state;
      return { edges: [...state.edges, { from, to }] };
    }),

  removeLastEdge: () => set((state) => ({ edges: state.edges.slice(0, -1) })),
  clearAll: () => set({ edges: [], selectedPoint: null, imagePlanes: [] }),
  setRenderMode: (mode) => set({ renderMode: mode }),
  setBreathe: (v) => set({ breathe: v }),
  setPulseSpeed: (v) => set({ pulseSpeed: v }),
  setExtrudeDepth: (v) => set({ extrudeDepth: v }),
  setPalette: (colors) => set({ palette: colors }),
  setTempo: (v) => set({ tempo: v }),
  randomizeSeed: () => set({ seed: Math.floor(Math.random() * 10000) }),

  togglePostFX: (effect) =>
    set((state) => ({
      postFX: { ...state.postFX, [effect]: !state.postFX[effect] },
    })),

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
        p.id === id ? { ...p, ...transform } : p
      ),
    })),
}));
