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
    <div className="mb-6 border-b border-ergon-border/80 pb-6">
      <div className="flex flex-col gap-1">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ergon-subtle">
          Material
        </h4>
        <p className="text-sm leading-relaxed text-ergon-muted">
          Shared pigment, specimen, and energy for the whole composition.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ergon-subtle">
              Pigment
            </label>
            <span className="text-[11px] font-mono text-ergon-muted">Palette</span>
          </div>
          <div className="flex gap-2">
            {sharedDrivers.palette.map((color, i) => (
              <label key={i} className="relative cursor-pointer">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(i, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div
                  className="h-9 w-9 rounded-xl border border-ergon-border/90 transition-transform duration-150 hover:-translate-y-0.5 hover:scale-[1.03]"
                  style={{ backgroundColor: color }}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ergon-subtle">
              Specimen
            </label>
            <span className="text-[11px] font-mono text-ergon-muted">Seed</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={sharedDrivers.seed}
              onChange={(e) => setSharedDrivers({ seed: parseInt(e.target.value) || 0 })}
              className="min-w-0 flex-1 rounded-xl border border-ergon-border/90 bg-white px-3 py-2.5 text-sm font-mono text-ergon-text outline-none transition-colors placeholder:text-ergon-muted/40 focus:border-ergon-text"
              aria-label="Specimen seed"
            />
            <button
              onClick={handleRandomizeSeed}
              className="shrink-0 rounded-xl border border-ergon-border/90 bg-ergon-surface/70 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ergon-subtle transition-colors hover:border-ergon-muted hover:text-ergon-text cursor-pointer"
              title="Reseed the specimen"
            >
              Reseed
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ergon-subtle">
              Energy
            </label>
            <span className="rounded-full bg-ergon-surface px-2.5 py-1 text-[11px] font-mono text-ergon-muted">
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
            aria-label="Energy"
            className="w-full"
          />
          <p className="text-[11px] leading-relaxed text-ergon-muted">
            Lower energy settles the composition. Higher energy makes the material feel more alive.
          </p>
        </div>
      </div>
    </div>
  );
}
