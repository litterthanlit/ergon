"use client";

import Link from "next/link";
import { useTexturePatchStore } from "@/lib/texture-patch-store";

type Props = {
  onSave: () => void;
  onPublish: () => void;
  onExport: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  workSlug: string | null;
};

export function TextureProHeader({ onSave, onPublish, onExport, isSaving, isPublishing, workSlug }: Props) {
  const patch = useTexturePatchStore((state) => state.patch);
  const stats = useTexturePatchStore((state) => state.stats);
  const playback = useTexturePatchStore((state) => state.playback);
  const setPlaying = useTexturePatchStore((state) => state.setPlaying);
  const setPlaybackRate = useTexturePatchStore((state) => state.setPlaybackRate);

  return (
    <header className="grid h-[46px] shrink-0 grid-cols-[264px_minmax(0,1fr)_auto] items-center border-b border-[#20252b] bg-[#0b0f13] px-2 text-[11px] text-zinc-500">
      <Link href="/" className="flex h-full items-center gap-2 border-r border-[#20252b] pr-3">
        <span className="grid size-5 place-items-center border border-cyan-300/35 text-[10px] text-cyan-200">◆</span>
        <span className="text-[14px] font-semibold text-zinc-300">Ergon</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">v2.1</span>
      </Link>

      <div className="flex min-w-0 items-center justify-between gap-4 px-3">
        <div className="flex items-center gap-2">
          {["Studio", "Lab", "Render"].map((mode) => (
            <button
              key={mode}
              type="button"
              className={`h-7 min-w-20 border px-4 font-mono text-[10px] uppercase tracking-[0.13em] ${
                mode === "Studio"
                  ? "border-[#3a4654] bg-[#151b22] text-zinc-200"
                  : "border-[#20252b] bg-[#0e1318] text-zinc-600 hover:text-zinc-300"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 lg:flex">
          <span>{patch.resolution[0]} x {patch.resolution[1]}</span>
          <span>{stats?.fps.toFixed(0) ?? playback.fpsTarget} FPS</span>
          <span>16:9</span>
          <span className="truncate text-zinc-600">{patch.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying(!playback.playing)}
            aria-label={playback.playing ? "Pause" : "Play"}
            className="grid size-7 place-items-center border border-[#20252b] bg-[#0e1318] text-zinc-300 hover:bg-[#151b22]"
          >
            {playback.playing ? "Ⅱ" : "▶"}
          </button>
          <select
            aria-label="Playback rate"
            value={playback.playbackRate}
            onChange={(event) => setPlaybackRate(Number(event.target.value))}
            className="h-7 border border-[#20252b] bg-[#0e1318] px-2 font-mono text-[10px] text-zinc-400"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x</option>
            <option value={2}>2.0x</option>
          </select>
          <span className="flex items-center gap-1.5 border-l border-[#20252b] pl-3 font-mono text-[10px] uppercase tracking-[0.12em] text-cyan-300">
            <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.7)]" />
            Live
          </span>
        </div>
      </div>

      <div className="flex h-full items-center gap-1 border-l border-[#20252b] pl-2">
        <button type="button" onClick={onExport} className="h-7 border border-[#20252b] px-3 text-zinc-300 hover:bg-[#151b22]">
          Export
        </button>
        <button type="button" onClick={onSave} disabled={isSaving} className="h-7 border border-[#20252b] px-3 text-zinc-300 hover:bg-[#151b22] disabled:opacity-50">
          {isSaving ? "Saving" : "Save"}
        </button>
        <button type="button" onClick={onPublish} disabled={isPublishing} className="h-7 bg-zinc-200 px-3 font-semibold text-zinc-950 disabled:opacity-50">
          {workSlug ? "Published" : isPublishing ? "Publishing" : "Publish"}
        </button>
        <button type="button" aria-label="Layout" className="grid size-7 place-items-center border border-[#20252b] text-zinc-500 hover:text-zinc-200">▦</button>
        <button type="button" aria-label="Settings" className="grid size-7 place-items-center border border-[#20252b] text-zinc-500 hover:text-zinc-200">⚙</button>
      </div>
    </header>
  );
}
