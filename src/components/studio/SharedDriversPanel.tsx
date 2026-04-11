"use client";

import { useStudioStore } from "@/lib/store";

export function SharedDriversPanel() {
  const sharedDrivers = useStudioStore((s) => s.sharedDrivers);
  const setSharedDrivers = useStudioStore((s) => s.setSharedDrivers);

  const handleColorChange = (index: number, color: string) => {
    const newPalette = [...sharedDrivers.palette];
    newPalette[index] = color;
    setSharedDrivers({ palette: newPalette });
  };

  const handleRandomizeSeed = () => {
    setSharedDrivers({ seed: Math.floor(Math.random() * 10000) });
  };

  return (
    <div className="flex flex-col gap-5 pb-6 mb-6 border-b border-ergon-border">
      <h4 className="text-[11px] font-semibold text-ergon-subtle uppercase tracking-[0.12em]">
        Composition
      </h4>

      {/* Palette */}
      <div>
        <label className="text-xs font-medium text-ergon-muted block mb-2">Palette</label>
        <div className="flex gap-2">
          {sharedDrivers.palette.map((color, i) => (
            <label key={i} className="relative cursor-pointer">
              <div
                className="w-9 h-9 rounded-lg border border-ergon-border shadow-sm transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
              />
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(i, e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Seed */}
      <div>
        <label className="text-xs font-medium text-ergon-muted block mb-2">Seed</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={sharedDrivers.seed}
            onChange={(e) => setSharedDrivers({ seed: parseInt(e.target.value) || 0 })}
            className="flex-1 text-sm font-mono text-ergon-text bg-ergon-surface border border-ergon-border rounded-lg px-3 py-2 focus:outline-none focus:border-ergon-text"
          />
          <button
            onClick={handleRandomizeSeed}
            className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-ergon-subtle bg-ergon-surface border border-ergon-border rounded-lg hover:border-ergon-muted transition-colors cursor-pointer"
          >
            Random
          </button>
        </div>
      </div>

      {/* Tempo */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-ergon-muted">Tempo</label>
          <span className="text-xs font-mono text-ergon-muted">
            {sharedDrivers.tempo === 0 ? "Frozen" : `${sharedDrivers.tempo.toFixed(1)}x`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={sharedDrivers.tempo}
          onChange={(e) => setSharedDrivers({ tempo: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
}
