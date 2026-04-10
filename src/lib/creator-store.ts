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

export type RenderMode = "net" | "stars" | "stripes" | "flow" | "pulse" | "scatter";

export const RENDER_MODES: { id: RenderMode; label: string }[] = [
  { id: "net", label: "Net" },
  { id: "stars", label: "Stars" },
  { id: "stripes", label: "Stripes" },
  { id: "flow", label: "Flow" },
  { id: "pulse", label: "Pulse" },
  { id: "scatter", label: "Scatter" },
];

type CreatorState = {
  // Grid
  gridCols: number;
  gridRows: number;
  points: GridPoint[];
  edges: Edge[];
  selectedPoint: string | null;

  // Animation
  renderMode: RenderMode;
  breathe: number;
  pulseSpeed: number;
  extrudeDepth: number;

  // Drivers
  palette: string[];
  tempo: number;
  seed: number;

  // Actions
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
};

function hasEdge(edges: Edge[], from: string, to: string): boolean {
  return edges.some(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
  );
}

export const useCreatorStore = create<CreatorState>((set) => ({
  gridCols: 16,
  gridRows: 10,
  points: [],
  edges: [],
  selectedPoint: null,

  renderMode: "net" as RenderMode,
  breathe: 8,
  pulseSpeed: 1.0,
  extrudeDepth: 0,

  palette: ["#00ffa3", "#0088ff", "#cc44ff", "#ffffff", "#ff2d6b"],
  tempo: 1.0,
  seed: Math.floor(Math.random() * 10000),

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
      if (!state.selectedPoint) {
        return { selectedPoint: id };
      }
      if (state.selectedPoint === id) {
        return { selectedPoint: null };
      }
      // Create edge
      const from = state.selectedPoint;
      const to = id;
      if (hasEdge(state.edges, from, to)) {
        return { selectedPoint: id };
      }
      return {
        edges: [...state.edges, { from, to }],
        selectedPoint: id, // Keep selected so you can chain connections
      };
    }),

  clearSelection: () => set({ selectedPoint: null }),

  addEdge: (from, to) =>
    set((state) => {
      if (hasEdge(state.edges, from, to)) return state;
      return { edges: [...state.edges, { from, to }] };
    }),

  removeLastEdge: () =>
    set((state) => ({
      edges: state.edges.slice(0, -1),
    })),

  clearAll: () => set({ edges: [], selectedPoint: null }),
  setRenderMode: (mode) => set({ renderMode: mode }),

  setBreathe: (v) => set({ breathe: v }),
  setPulseSpeed: (v) => set({ pulseSpeed: v }),
  setExtrudeDepth: (v) => set({ extrudeDepth: v }),
  setPalette: (colors) => set({ palette: colors }),
  setTempo: (v) => set({ tempo: v }),
  randomizeSeed: () => set({ seed: Math.floor(Math.random() * 10000) }),
}));
