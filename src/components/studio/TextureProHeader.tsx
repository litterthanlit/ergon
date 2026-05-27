"use client";

import Link from "next/link";
import type { TextureQuality } from "@/lib/texture-patch";
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
  const history = useTexturePatchStore((state) => state.history);
  const playback = useTexturePatchStore((state) => state.playback);
  const setPlaying = useTexturePatchStore((state) => state.setPlaying);
  const setQuality = useTexturePatchStore((state) => state.setQuality);
  const undo = useTexturePatchStore((state) => state.undo);
  const redo = useTexturePatchStore((state) => state.redo);

  return (
    <header className="absolute left-3 right-3 top-3 z-30 flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#17191c]/82 px-3 py-2 text-sm text-zinc-300 shadow-2xl shadow-black/35 backdrop-blur-2xl lg:grid lg:h-14 lg:grid-cols-[minmax(300px,1fr)_auto_minmax(360px,1fr)] lg:flex-nowrap lg:py-0">
      <Link href="/" className="flex h-full min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/35 bg-white/10 text-[15px] font-semibold text-white">◔</span>
        <span className="text-[15px] font-semibold text-white">Ergon</span>
        <span className="mx-4 h-6 w-px bg-white/10" />
        <span className="truncate text-[14px] text-zinc-200">{patch.name === "Liquid Aurora" ? "Untitled Flow" : patch.name}</span>
        {history.dirty && <span className="text-xs text-amber-200">Unsaved</span>}
      </Link>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Undo"
          onClick={undo}
          disabled={history.undoStack.length === 0}
          className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-lg text-zinc-300 hover:bg-white/10 disabled:text-zinc-700"
        >
          ↶
        </button>
        <button
          type="button"
          aria-label="Redo"
          onClick={redo}
          disabled={history.redoStack.length === 0}
          className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-lg text-zinc-300 hover:bg-white/10 disabled:text-zinc-700"
        >
          ↷
        </button>
        <button
          type="button"
          onClick={() => setPlaying(!playback.playing)}
          aria-label={playback.playing ? "Pause" : "Play"}
          className="grid size-9 place-items-center rounded-full bg-white/12 text-xl text-white shadow-sm shadow-black/25 hover:bg-white/18"
        >
          {playback.playing ? "Ⅱ" : "▶"}
        </button>
      </div>

      <div className="flex justify-end gap-3">
        <select
          aria-label="Preview quality"
          value={patch.quality}
          onChange={(event) => setQuality(event.target.value as TextureQuality)}
          className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-[13px] text-white outline-none"
        >
          <option value="preview">Preview</option>
          <option value="final">Final</option>
        </select>
        <button type="button" onClick={onExport} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-5 text-[13px] font-medium text-white hover:bg-white/10">
          Export
        </button>
        <button type="button" onClick={onPublish} disabled={isPublishing || isSaving} aria-label="Publish" className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-[13px] text-zinc-200 hover:bg-white/10 disabled:opacity-50">
          {workSlug ? "Published" : isPublishing ? "Publishing" : "Publish"}
        </button>
        <button type="button" onClick={onSave} disabled={isSaving} className="hidden h-9 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-[13px] text-zinc-300 hover:bg-white/10 disabled:opacity-50 lg:block">
          {isSaving ? "Saving" : "Save"}
        </button>
      </div>
    </header>
  );
}
