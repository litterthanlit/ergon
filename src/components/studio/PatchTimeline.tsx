"use client";

import { useEffect } from "react";
import { useVisualPatchStore } from "@/lib/visual-patch-store";

export function PatchTimeline() {
  const patch = useVisualPatchStore((state) => state.patch);
  const setTime = useVisualPatchStore((state) => state.setTime);
  const togglePlayback = useVisualPatchStore((state) => state.togglePlayback);
  const removeKeyframe = useVisualPatchStore((state) => state.removeKeyframe);

  useEffect(() => {
    if (!patch.isPlaying) return;
    const id = window.setInterval(() => {
      const next = useVisualPatchStore.getState().patch.currentTime + 0.08;
      setTime(next > patch.duration ? 0 : next);
    }, 80);
    return () => window.clearInterval(id);
  }, [patch.duration, patch.isPlaying, setTime]);

  return (
    <div className="border-t border-white/10 bg-[#090a0e] px-5 py-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlayback}
          className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-950 transition-transform hover:scale-105"
          aria-label={patch.isPlaying ? "Pause timeline" : "Play timeline"}
        >
          {patch.isPlaying ? "II" : "▶"}
        </button>
        <div className="min-w-16 font-mono text-xs tabular-nums text-zinc-400">
          {patch.currentTime.toFixed(2)}s
        </div>
        <input
          type="range"
          min={0}
          max={patch.duration}
          step={0.05}
          value={patch.currentTime}
          onChange={(event) => setTime(Number(event.target.value))}
          aria-label="Timeline scrubber"
          className="ergon-dark-range"
        />
        <div className="font-mono text-xs tabular-nums text-zinc-600">
          {patch.duration.toFixed(0)}s loop
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[96px_1fr] gap-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          Tracks
        </div>
        <div className="relative h-12 rounded-xl border border-white/10 bg-white/[0.035]">
          {patch.tracks.map((track, rowIndex) =>
            track.keyframes.map((keyframe) => (
              <button
                key={keyframe.id}
                type="button"
                onClick={() => removeKeyframe(track.id, keyframe.id)}
                title={`${track.paramKey} at ${keyframe.time}s`}
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] bg-sky-300 shadow shadow-sky-500/30"
                style={{
                  left: `${(keyframe.time / patch.duration) * 100}%`,
                  marginTop: `${(rowIndex % 3 - 1) * 10}px`,
                }}
                aria-label={`Remove ${track.paramKey} keyframe at ${keyframe.time}s`}
              />
            ))
          )}
          <div
            className="absolute bottom-0 top-0 w-px bg-zinc-100/80"
            style={{ left: `${(patch.currentTime / patch.duration) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
