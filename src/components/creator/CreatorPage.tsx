"use client";

import { useEffect } from "react";
import { ThreeRenderer } from "./ThreeRenderer";
import { useCreatorStore, RENDER_MODES, MESH_PRESETS, type RenderMode, type MeshPreset, type PostFX } from "@/lib/creator-store";

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

export function CreatorPage() {
  const edges = useCreatorStore((s) => s.edges);
  const renderMode = useCreatorStore((s) => s.renderMode);
  const setRenderMode = useCreatorStore((s) => s.setRenderMode);
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

  useEffect(() => {
    if (edges.length === 0) {
      setPreset("constellation");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen w-screen bg-[#09090b] flex overflow-hidden">
      {/* Canvas — takes all remaining space */}
      <div className="flex-1 relative">
        <ThreeRenderer />
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

          {/* MODE — shader modes */}
          <section>
            <h3 className="text-[10px] text-[#71717a] uppercase tracking-[0.15em] mb-3">Mode</h3>
            <div className="flex flex-col gap-0.5">
              {RENDER_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setRenderMode(mode.id as RenderMode)}
                  className={`text-left px-3 py-1.5 text-[12px] rounded-md transition-all cursor-pointer ${
                    renderMode === mode.id
                      ? "bg-white/10 text-white font-medium"
                      : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-[#27272a]" />

          {/* PARAMETERS — sliders */}
          <section>
            <h3 className="text-[10px] text-[#71717a] uppercase tracking-[0.15em] mb-3">Parameters</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-[#a1a1aa]">Breathe</span>
                  <span className="text-[10px] text-[#71717a] tabular-nums">{breathe}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={breathe}
                  onChange={(e) => setBreathe(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-[#a1a1aa]">Pulse</span>
                  <span className="text-[10px] text-[#71717a] tabular-nums">{pulseSpeed.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.1}
                  value={pulseSpeed}
                  onChange={(e) => setPulseSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-[#a1a1aa]">Energy</span>
                  <span className="text-[10px] text-[#71717a] tabular-nums">{tempo.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.1}
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  className="w-full"
                />
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

          {/* FX — post-processing toggles */}
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
          <section>
            <button
              onClick={randomizeSeed}
              className="w-full px-3 py-2 text-[11px] text-[#a1a1aa] hover:text-white uppercase tracking-[0.15em] transition-colors cursor-pointer rounded-md hover:bg-white/5 text-center"
            >
              Shuffle
            </button>
          </section>

        </div>
      </div>
    </div>
  );
}
