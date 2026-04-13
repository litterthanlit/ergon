"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ThreeRenderer } from "./ThreeRenderer";
import { useCreatorStore, MESH_PRESETS, SCENE_PRESETS, type MeshPreset, type PostFX, type Layers, type ScenePresetId } from "@/lib/creator-store";
import { SequencerPanel } from "./SequencerPanel";

// Save/load utilities
function generateSceneId(): string {
  return `scene-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function captureCanvasThumbnail(): string {
  const canvas = document.querySelector("canvas");
  if (!canvas) return "";
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 200;
  tempCanvas.height = 120;
  const ctx = tempCanvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(canvas, 0, 0, 200, 120);
  return tempCanvas.toDataURL("image/png", 0.5);
}

type SavedScene = {
  id: string;
  name: string;
  timestamp: number;
  thumbnail: string;
  palette: string[];
  state: string; // JSON stringified
};

function saveScene(name: string): string {
  const state = useCreatorStore.getState();
  const id = generateSceneId();
  const thumbnail = captureCanvasThumbnail();
  const saved: SavedScene = {
    id,
    name,
    timestamp: Date.now(),
    thumbnail,
    palette: state.palette,
    state: JSON.stringify({
      nodes: state.nodes,
      edges: state.edges,
      layers: state.layers,
      modulations: state.modulations,
      breathe: state.breathe,
      pulseSpeed: state.pulseSpeed,
      tempo: state.tempo,
      seed: state.seed,
      palette: state.palette,
      postFX: state.postFX,
      snapshots: state.snapshots,
      connections: state.connections,
    }),
  };
  const existing = JSON.parse(localStorage.getItem("ergon-scenes") ?? "[]") as SavedScene[];
  existing.push(saved);
  localStorage.setItem("ergon-scenes", JSON.stringify(existing));
  return id;
}

function loadScene(id: string): boolean {
  const existing = JSON.parse(localStorage.getItem("ergon-scenes") ?? "[]") as SavedScene[];
  const scene = existing.find((s) => s.id === id);
  if (!scene) return false;
  const parsed = JSON.parse(scene.state);
  useCreatorStore.setState(parsed);
  return true;
}

function listScenes(): SavedScene[] {
  return JSON.parse(localStorage.getItem("ergon-scenes") ?? "[]") as SavedScene[];
}

const PALETTES = [
  ["#00ffa3", "#0088ff", "#cc44ff", "#ffffff", "#ff2d6b"],
  ["#ff006e", "#3a86ff", "#ffbe0b", "#8338ec", "#ffffff"],
  ["#c4a882", "#8b6f47", "#d4c4b0", "#3a2a1a", "#ffffff"],
  ["#ef4444", "#f97316", "#eab308", "#22c55e", "#ffffff"],
  ["#e0ddd5", "#8888aa", "#4a4a6a", "#1a1a2e", "#ffffff"],
];

const FX_ITEMS: { key: keyof PostFX; label: string }[] = [
  { key: "bloom", label: "Bloom" },
  { key: "chromatic", label: "Chromatic" },
  { key: "vignette", label: "Vignette" },
  { key: "dof", label: "Depth of Field" },
  { key: "grain", label: "Film Grain" },
  { key: "toneMapping", label: "Tone Map" },
  { key: "motionBlur", label: "Motion Blur" },
];

type LayerMeta = {
  key: keyof Layers;
  label: string;
  implemented: boolean;
  params: { key: string; label: string; min: number; max: number; step: number }[];
};

const LAYER_DEFS: LayerMeta[] = [
  {
    key: "spheres",
    label: "Spheres",
    implemented: true,
    params: [
      { key: "countPerVertex", label: "Count", min: 1, max: 100, step: 1 },
      { key: "scatterRadius", label: "Scatter", min: 5, max: 60, step: 1 },
      { key: "metalness", label: "Metal", min: 0, max: 1, step: 0.01 },
      { key: "roughness", label: "Rough", min: 0, max: 1, step: 0.01 },
      { key: "transmission", label: "Glass", min: 0, max: 1, step: 0.01 },
      { key: "emissiveIntensity", label: "Glow", min: 0, max: 2, step: 0.01 },
    ],
  },
  {
    key: "tendrils",
    label: "Tendrils",
    implemented: false,
    params: [
      { key: "thickness", label: "Thick", min: 0.5, max: 5, step: 0.1 },
      { key: "branchCount", label: "Branch", min: 1, max: 8, step: 1 },
      { key: "growthSpeed", label: "Growth", min: 0.1, max: 3, step: 0.1 },
      { key: "glowIntensity", label: "Glow", min: 0, max: 2, step: 0.01 },
    ],
  },
  {
    key: "dust",
    label: "Dust",
    implemented: false,
    params: [
      { key: "density", label: "Density", min: 100, max: 5000, step: 100 },
      { key: "particleSize", label: "Size", min: 0.5, max: 4, step: 0.1 },
      { key: "drift", label: "Drift", min: 0, max: 2, step: 0.1 },
      { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    key: "splatter",
    label: "Splatter",
    implemented: false,
    params: [
      { key: "count", label: "Count", min: 10, max: 500, step: 10 },
      { key: "size", label: "Size", min: 2, max: 20, step: 1 },
      { key: "spread", label: "Spread", min: 10, max: 100, step: 5 },
      { key: "splashiness", label: "Splash", min: 0, max: 1, step: 0.01 },
    ],
  },
  { key: "nebula", label: "Nebula", implemented: false, params: [] },
  { key: "flow", label: "Flow", implemented: false, params: [] },
  { key: "wireframe", label: "Wireframe", implemented: false, params: [] },
  { key: "halos", label: "Halos", implemented: false, params: [] },
  { key: "lightRays", label: "Light Rays", implemented: false, params: [] },
];

function LayerRow({ def }: { def: LayerMeta }) {
  const [expanded, setExpanded] = useState(false);
  const layer = useCreatorStore((s) => s.layers[def.key]);
  const setLayerEnabled = useCreatorStore((s) => s.setLayerEnabled);
  const setLayerIntensity = useCreatorStore((s) => s.setLayerIntensity);
  const setLayerParam = useCreatorStore((s) => s.setLayerParam);

  if (!def.implemented && def.params.length === 0) {
    // Scaffolded stub — show dimmed
    return (
      <div className="flex items-center justify-between px-2 py-1.5 opacity-40">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px]" style={{ color: "var(--text-dim)" }}>&#9654;</span>
          <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{def.label}</span>
        </div>
        <span className="text-[8px]" style={{ color: "var(--off)" }}>SOON</span>
      </div>
    );
  }

  return (
    <div className="rounded-md mb-1 overflow-hidden" style={{ background: "var(--bg-card)" }}>
      <div
        className="flex items-center justify-between px-2 py-1.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[8px]" style={{ color: "var(--text-dim)" }}>{expanded ? "\u25BC" : "\u25B6"}</span>
          <span
            className="text-[10px]"
            style={{ color: layer.enabled ? "var(--text-primary)" : "var(--text-dim)" }}
          >
            {def.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {layer.enabled && (
            <div className="w-[50px] h-[3px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${layer.intensity * 100}%`, background: "var(--accent)" }}
              />
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLayerEnabled(def.key, !layer.enabled);
            }}
            className="text-[9px] cursor-pointer"
            style={{ color: layer.enabled ? "var(--success)" : "var(--off)" }}
          >
            {layer.enabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-2 pb-2 grid grid-cols-2 gap-x-3 gap-y-2">
          {/* Intensity slider */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[8px]" style={{ color: "var(--text-dim)" }}>Intensity</span>
              <span className="text-[8px] tabular-nums" style={{ color: "var(--text-dim)" }}>{(layer.intensity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={layer.intensity}
              onChange={(e) => setLayerIntensity(def.key, Number(e.target.value))}
              className="w-full"
            />
          </div>

          {def.params.map((p) => (
            <div key={p.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px]" style={{ color: "var(--text-dim)" }}>{p.label}</span>
              </div>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={layer.params[p.key] ?? p.min}
                onChange={(e) => setLayerParam(def.key, p.key, Number(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreatorPage() {
  const edges = useCreatorStore((s) => s.edges);
  const activePreset = useCreatorStore((s) => s.activePreset);
  const setPreset = useCreatorStore((s) => s.setPreset);
  const applyScenePreset = useCreatorStore((s) => s.applyScenePreset);
  const breathe = useCreatorStore((s) => s.breathe);
  const pulseSpeed = useCreatorStore((s) => s.pulseSpeed);
  const tempo = useCreatorStore((s) => s.tempo);
  const palette = useCreatorStore((s) => s.palette);
  const setBreathe = useCreatorStore((s) => s.setBreathe);
  const setPulseSpeed = useCreatorStore((s) => s.setPulseSpeed);
  const setTempo = useCreatorStore((s) => s.setTempo);
  const setPalette = useCreatorStore((s) => s.setPalette);
  const postFX = useCreatorStore((s) => s.postFX);
  const togglePostFX = useCreatorStore((s) => s.togglePostFX);
  const randomizeSeed = useCreatorStore((s) => s.randomizeSeed);
  const takeSnapshot = useCreatorStore((s) => s.takeSnapshot);
  const snapshots = useCreatorStore((s) => s.snapshots);
  const theme = useCreatorStore((s) => s.theme);
  const setTheme = useCreatorStore((s) => s.setTheme);

  // Undo/redo via zundo
  const undo = useCallback(() => {
    useCreatorStore.temporal.getState().undo();
  }, []);

  const redo = useCallback(() => {
    useCreatorStore.temporal.getState().redo();
  }, []);

  // Bottom panel resize
  const [bottomHeight, setBottomHeight] = useState(0);
  const resizing = useRef(false);
  const showSequencer = snapshots.length >= 2;

  // Save/load
  const [showLoadPicker, setShowLoadPicker] = useState(false);
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>([]);

  useEffect(() => {
    if (showSequencer && bottomHeight === 0) {
      setBottomHeight(140);
    }
  }, [showSequencer, bottomHeight]);

  const onResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    resizing.current = true;
    const startY = e.clientY;
    const startH = bottomHeight;

    const onMove = (ev: PointerEvent) => {
      if (!resizing.current) return;
      const delta = startY - ev.clientY;
      const newH = Math.max(80, Math.min(window.innerHeight * 0.5, startH + delta));
      setBottomHeight(newH);
    };
    const onUp = () => {
      resizing.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [bottomHeight]);

  useEffect(() => {
    if (edges.length === 0) {
      setPreset("constellation");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard bindings for undo/redo/save/load/theme
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Z for undo (macOS)
      if (e.metaKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Cmd+Shift+Z for redo (macOS)
      if (e.metaKey && e.shiftKey && e.key === "Z") {
        e.preventDefault();
        redo();
      }
      // Cmd+S for save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        const name = prompt("Scene name:", `Scene ${Date.now()}`);
        if (name) saveScene(name);
      }
      // Cmd+O for load
      if ((e.metaKey || e.ctrlKey) && e.key === "o") {
        e.preventDefault();
        setSavedScenes(listScenes());
        setShowLoadPicker(true);
      }
      // Cmd+Shift+L for theme toggle
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "L") {
        e.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, theme, setTheme]);

  return (
    <div
      className={`h-screen w-screen flex overflow-hidden${theme === "light" ? " theme-light" : ""}`}
      style={{ background: "var(--bg-app)" }}
    >
      {/* Left: viewport + bottom sequencer */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Viewport */}
        <div className="flex-1 relative min-h-0">
          <ThreeRenderer />
        </div>

        {/* Resize handle + bottom sequencer (progressive) */}
        {showSequencer && (
          <>
            <div
              className="h-1 cursor-row-resize flex items-center justify-center shrink-0"
              style={{ background: "var(--border)" }}
              onPointerDown={onResizeStart}
            >
              <div className="w-8 h-0.5 rounded-full" style={{ background: "var(--off)" }} />
            </div>
            <div
              className="border-t shrink-0 overflow-hidden"
              style={{ height: bottomHeight, background: "var(--bg-app)", borderColor: "var(--border)" }}
            >
              <SequencerPanel />
            </div>
          </>
        )}
      </div>

      {/* Right panel */}
      <div
        className="w-[240px] shrink-0 h-full overflow-y-auto border-l backdrop-blur-xl"
        style={{ borderColor: "var(--border)", background: "var(--panel-blur)" }}
      >
        <div className="flex flex-col gap-6 p-5">

          {/* THEME TOGGLE */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>
              {theme === "light" ? "Light" : "Dark"}
            </span>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer"
              style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}
              title="Toggle theme (Cmd+Shift+L)"
            >
              {theme === "light" ? "☀" : "☾"}
            </button>
          </div>

          {/* SCENE PRESETS */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-muted)" }}>Scene Presets</h3>
            <div className="flex flex-wrap gap-1">
              {SCENE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    const thumb = captureCanvasThumbnail();
                    applyScenePreset(preset.id as ScenePresetId, thumb);
                  }}
                  className="px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer border border-transparent"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* FORM — mesh presets */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-muted)" }}>Form</h3>
            <div className="flex flex-col gap-0.5">
              {MESH_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setPreset(preset.id as MeshPreset)}
                  className="text-left px-3 py-1.5 text-[12px] rounded-md transition-all cursor-pointer"
                  style={{
                    background: activePreset === preset.id ? "var(--bg-active)" : undefined,
                    color: activePreset === preset.id ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: activePreset === preset.id ? 500 : undefined,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* LAYERS — collapsible per-layer controls */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-muted)" }}>Layers</h3>
            {LAYER_DEFS.map((def) => (
              <LayerRow key={def.key} def={def} />
            ))}
          </section>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* PARAMETERS — global sliders */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-muted)" }}>Parameters</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Breathe</span>
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>{breathe}</span>
                </div>
                <input type="range" min={0} max={30} step={1} value={breathe} onChange={(e) => setBreathe(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Pulse</span>
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>{pulseSpeed.toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={3} step={0.1} value={pulseSpeed} onChange={(e) => setPulseSpeed(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Energy</span>
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>{tempo.toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={3} step={0.1} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          </section>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* PALETTE */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-muted)" }}>Palette</h3>
            <div className="flex items-center gap-2">
              {PALETTES.map((pal, i) => (
                <button
                  key={i}
                  onClick={() => setPalette(pal)}
                  className="w-6 h-6 rounded-full border border-white/10 transition-transform hover:scale-110 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${pal[0]}, ${pal[1]})`,
                    boxShadow: palette[0] === pal[0] ? `0 0 0 2px ${pal[0]}40` : undefined,
                  }}
                />
              ))}
            </div>
          </section>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* EFFECTS */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-muted)" }}>Effects</h3>
            <div className="flex flex-col gap-0.5">
              {FX_ITEMS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => togglePostFX(key)}
                  className="flex items-center justify-between px-3 py-1.5 text-[12px] rounded-md transition-all cursor-pointer"
                  style={{
                    background: postFX[key] ? "var(--bg-active)" : undefined,
                    color: postFX[key] ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <span>{label}</span>
                  <span
                    className="text-[10px]"
                    style={{ color: postFX[key] ? "var(--success)" : "var(--off)" }}
                  >
                    {postFX[key] ? "ON" : "OFF"}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* ACTIONS */}
          <section className="flex gap-2">
            <button
              onClick={randomizeSeed}
              className="flex-1 px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors cursor-pointer rounded-md text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              Shuffle
            </button>
            <button
              onClick={() => takeSnapshot(`Scene ${snapshots.length + 1}`, captureCanvasThumbnail())}
              className="flex-1 px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors cursor-pointer rounded-md text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              Snapshot
            </button>
          </section>

        </div>
      </div>

      {/* Load picker modal */}
      {showLoadPicker && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowLoadPicker(false)}
        >
          <div
            className="rounded-lg p-6 max-w-md max-h-96 overflow-y-auto border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[14px] font-medium mb-4" style={{ color: "var(--text-primary)" }}>Load Scene</h2>
            {savedScenes.length === 0 ? (
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No saved scenes yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {savedScenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      loadScene(scene.id);
                      setShowLoadPicker(false);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-md transition-colors text-left cursor-pointer"
                    style={{ background: "var(--bg-hover)" }}
                  >
                    {scene.thumbnail ? (
                      <div
                        className="w-[60px] h-[36px] rounded bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${scene.thumbnail})` }}
                      />
                    ) : (
                      <div
                        className="w-[60px] h-[36px] rounded shrink-0 flex items-center justify-center"
                        style={{ background: "var(--bg-card)" }}
                      >
                        <div className="flex gap-0.5">
                          {scene.palette.slice(0, 5).map((color, i) => (
                            <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] truncate" style={{ color: "var(--text-primary)" }}>{scene.name}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {new Date(scene.timestamp).toLocaleDateString()} {new Date(scene.timestamp).toLocaleTimeString()}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {scene.palette.slice(0, 5).map((color, i) => (
                          <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
