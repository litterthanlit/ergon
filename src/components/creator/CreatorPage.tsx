"use client";

import { useEffect } from "react";
import { ThreeRenderer } from "./ThreeRenderer";
import { useCreatorStore, RENDER_MODES, MESH_PRESETS, type RenderMode, type MeshPreset } from "@/lib/creator-store";

const PALETTES = [
  ["#00ffa3", "#0088ff", "#cc44ff", "#ffffff", "#ff2d6b"],
  ["#ff006e", "#3a86ff", "#ffbe0b", "#8338ec", "#ffffff"],
  ["#c4a882", "#8b6f47", "#d4c4b0", "#3a2a1a", "#ffffff"],
  ["#ef4444", "#f97316", "#eab308", "#22c55e", "#ffffff"],
  ["#e0ddd5", "#8888aa", "#4a4a6a", "#1a1a2e", "#ffffff"],
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

  // Load default preset on mount — art appears immediately
  useEffect(() => {
    if (edges.length === 0) {
      setPreset("constellation");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen w-screen bg-[#09090b] flex flex-col overflow-hidden">
      {/* Canvas area — full screen */}
      <div className="flex-1 relative">
        <ThreeRenderer />
      </div>

      {/* Bottom controls — minimal floating bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="flex items-center justify-center pb-6">
          <div className="flex items-center gap-5 bg-[#111113]/90 backdrop-blur-md border border-[#27272a] rounded-xl px-5 py-3">
            {/* Mesh preset selector */}
            <div className="flex items-center gap-1">
              {MESH_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setPreset(preset.id as MeshPreset)}
                  className={`px-2 py-1 text-[10px] rounded-md transition-all cursor-pointer ${
                    activePreset === preset.id
                      ? "bg-white/10 text-white font-medium"
                      : "text-[#71717a] hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-[#27272a]" />

            {/* Render mode selector */}
            <div className="flex items-center gap-1">
              {RENDER_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setRenderMode(mode.id as RenderMode)}
                  className={`px-2.5 py-1 text-[10px] rounded-md transition-all cursor-pointer ${
                    renderMode === mode.id
                      ? "bg-white/10 text-white font-medium"
                      : "text-[#71717a] hover:text-white"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-[#27272a]" />

            {/* Breathe */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#71717a] uppercase tracking-wider">Breathe</span>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={breathe}
                onChange={(e) => setBreathe(Number(e.target.value))}
                className="w-20"
              />
            </div>

            {/* Pulse */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#71717a] uppercase tracking-wider">Pulse</span>
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={pulseSpeed}
                onChange={(e) => setPulseSpeed(Number(e.target.value))}
                className="w-20"
              />
            </div>

            {/* Tempo */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#71717a] uppercase tracking-wider">Energy</span>
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                className="w-20"
              />
            </div>

            <div className="w-px h-5 bg-[#27272a]" />

            {/* Palette swatches */}
            <div className="flex items-center gap-1.5">
              {PALETTES.map((pal, i) => (
                <button
                  key={i}
                  onClick={() => setPalette(pal)}
                  className="w-4 h-4 rounded-full border border-white/10 transition-transform hover:scale-125 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${pal[0]}, ${pal[1]})`,
                    boxShadow: palette[0] === pal[0] ? `0 0 0 2px ${pal[0]}40` : undefined,
                  }}
                />
              ))}
            </div>

            <div className="w-px h-5 bg-[#27272a]" />

            {/* FX toggles */}
            <div className="flex items-center gap-1">
              {(
                [
                  ["bloom", "BLM"],
                  ["chromatic", "CHR"],
                  ["vignette", "VIG"],
                  ["dof", "DOF"],
                  ["grain", "GRN"],
                  ["toneMapping", "TMP"],
                  ["motionBlur", "MBL"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => togglePostFX(key)}
                  className={`px-1.5 py-1 text-[10px] rounded transition-all cursor-pointer ${
                    postFX[key]
                      ? "text-white bg-white/10"
                      : "text-[#71717a] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-[#27272a]" />

            {/* Actions */}
            <button
              onClick={randomizeSeed}
              className="text-[10px] text-[#71717a] hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
            >
              Shuffle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
