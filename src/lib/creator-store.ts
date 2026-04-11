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
  postFX: PostFX;
  imagePlanes: ImagePlane[];
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
