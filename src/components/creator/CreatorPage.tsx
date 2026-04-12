"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ThreeRenderer } from "./ThreeRenderer";
import { useCreatorStore, MESH_PRESETS, type MeshPreset, type PostFX, type Layers } from "@/lib/creator-store";

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
          <span className="text-[8px] text-[#52525b]">&#9654;</span>
          <span className="text-[10px] text-[#52525b]">{def.label}</span>
        </div>
        <span className="text-[8px] text-[#3f3f46]">SOON</span>
      </div>
    );
  }

  return (
    <div className="bg-[#18181b] rounded-md mb-1 overflow-hidden">
      <div
        className="flex items-center justify-between px-2 py-1.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-[#52525b]">{expanded ? "\u25BC" : "\u25B6"}</span>
          <span className={`text-[10px] ${layer.enabled ? "text-[#e4e4e7]" : "text-[#52525b]"}`}>
            {def.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {layer.enabled && (
            <div className="w-[50px] h-[3px] bg-[#27272a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#a78bfa] rounded-full"
                style={{ width: `${layer.intensity * 100}%` }}
              />
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLayerEnabled(def.key, !layer.enabled);
            }}
            className={`text-[9px] cursor-pointer ${layer.enabled ? "text-[#00ffa3]" : "text-[#3f3f46]"}`}
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
              <span className="text-[8px] text-[#52525b]">Intensity</span>
              <span className="text-[8px] text-[#52525b] tabular-nums">{(layer.intensity * 100).toFixed(0)}%</span>
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
                <span className="text-[8px] text-[#52525b]">{p.label}</span>
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

  // Keyboard bindings for undo/redo
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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="h-screen w-screen bg-[#09090b] flex overflow-hidden">
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
              className="h-1 bg-[#27272a] cursor-row-resize flex items-center justify-center shrink-0"
              onPointerDown={onResizeStart}
            >
              <div className="w-8 h-0.5 bg-[#3f3f46] rounded-full" />
            </div>
            <div
              className="bg-[#0d0d0f] border-t border-[#27272a] shrink-0 overflow-hidden"
              style={{ height: bottomHeight }}
            >
              {/* Sequencer panel placeholder — implemented in Task 9 */}
              <div className="flex items-center justify-center h-full text-[10px] text-[#3f3f46] uppercase tracking-widest">
                Scene Sequencer
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right panel */}
      <div className="w-[240px] shrink-0 h-full overflow-y-auto border-l border-[#27272a] bg-[#111113]/80 backdrop-blur-xl">
        <div className="flex flex-col gap-6 p-5">

          {/* FORM — mesh presets */}
          <section>
            <h3 className="text-[10px] text-[#71717a] uppercase tracking-[0.15em] mb-3">Form</h3>
            <div className="flex flex-col gap-0.5">
              {MESH_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setPreset(preset.id as MeshPreset)}
                  className={`text-left px-3 py-1.5 text-[12px] rounded-md transition-all cursor-pointer ${
                    activePreset === preset.id
                      ? "bg-white/10 text-white font-medium"
                      : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-[#27272a]" />

          {/* LAYERS — collapsible per-layer controls */}
          <section>
            <h3 className="text-[10px] text-[#71717a] uppercase tracking-[0.15em] mb-3">Layers</h3>
            {LAYER_DEFS.map((def) => (
              <LayerRow key={def.key} def={def} />
            ))}
          </section>

          <div className="h-px bg-[#27272a]" />

          {/* PARAMETERS — global sliders */}
          <section>
            <h3 className="text-[10px] text-[#71717a] uppercase tracking-[0.15em] mb-3">Parameters</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-[#a1a1aa]">Breathe</span>
                  <span className="text-[10px] text-[#71717a] tabular-nums">{breathe}</span>
                </div>
                <input type="range" min={0} max={30} step={1} value={breathe} onChange={(e) => setBreathe(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-[#a1a1aa]">Pulse</span>
                  <span className="text-[10px] text-[#71717a] tabular-nums">{pulseSpeed.toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={3} step={0.1} value={pulseSpeed} onChange={(e) => setPulseSpeed(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-[#a1a1aa]">Energy</span>
                  <span className="text-[10px] text-[#71717a] tabular-nums">{tempo.toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={3} step={0.1} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          </section>

          <div className="h-px bg-[#27272a]" />

          {/* PALETTE */}
          <section>
            <h3 className="text-[10px] text-[#71717a] uppercase tracking-[0.15em] mb-3">Palette</h3>
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

          <div className="h-px bg-[#27272a]" />

          {/* EFFECTS */}
          <section>
            <h3 className="text-[10px] text-[#71717a] uppercase tracking-[0.15em] mb-3">Effects</h3>
            <div className="flex flex-col gap-0.5">
              {FX_ITEMS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => togglePostFX(key)}
                  className={`flex items-center justify-between px-3 py-1.5 text-[12px] rounded-md transition-all cursor-pointer ${
                    postFX[key]
                      ? "bg-white/10 text-white"
                      : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] ${postFX[key] ? "text-[#00ffa3]" : "text-[#3f3f46]"}`}>
                    {postFX[key] ? "ON" : "OFF"}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-[#27272a]" />

          {/* ACTIONS */}
          <section className="flex gap-2">
            <button
              onClick={randomizeSeed}
              className="flex-1 px-3 py-2 text-[11px] text-[#a1a1aa] hover:text-white uppercase tracking-[0.15em] transition-colors cursor-pointer rounded-md hover:bg-white/5 text-center"
            >
              Shuffle
            </button>
            <button
              onClick={() => takeSnapshot(`Scene ${snapshots.length + 1}`)}
              className="flex-1 px-3 py-2 text-[11px] text-[#a1a1aa] hover:text-white uppercase tracking-[0.15em] transition-colors cursor-pointer rounded-md hover:bg-white/5 text-center"
            >
              Snapshot
            </button>
          </section>

        </div>
      </div>
    </div>
  );
}
