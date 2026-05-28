"use client";

import Link from "next/link";
import type { TextureQuality } from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";
import {
  StudioPrimaryButton,
  StudioSecondaryButton,
  StudioToolbarIcon,
  studio,
} from "./studio-primitives";

type Props = {
  onSave: () => void;
  onPublish: () => void;
  onExport: () => void;
  onOpenWork?: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  isOpeningWork?: boolean;
  workSlug: string | null;
};

export function TextureProHeader({
  onSave,
  onPublish,
  onExport,
  onOpenWork,
  isSaving,
  isPublishing,
  isOpeningWork = false,
  workSlug,
}: Props) {
  const patch = useTexturePatchStore((state) => state.patch);
  const history = useTexturePatchStore((state) => state.history);
  const playback = useTexturePatchStore((state) => state.playback);
  const setPlaying = useTexturePatchStore((state) => state.setPlaying);
  const setQuality = useTexturePatchStore((state) => state.setQuality);
  const undo = useTexturePatchStore((state) => state.undo);
  const redo = useTexturePatchStore((state) => state.redo);

  const displayName = patch.name === "Liquid Aurora" ? "Untitled Composition" : patch.name;

  return (
    <header
      className={`flex h-[52px] shrink-0 items-center justify-between border-b ${studio.separator} px-4 backdrop-blur-xl`}
      style={{ background: "rgba(44, 44, 46, 0.72)" }}
    >
      <div className="flex min-w-0 items-center gap-4">
        <Link href="/" className={`shrink-0 text-[15px] font-semibold ${studio.text} hover:opacity-80`}>
          Ergon
        </Link>
        <div className={`hidden h-4 w-px bg-white/10 sm:block`} />
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-[13px] font-medium text-[#f5f5f7]">{displayName}</p>
          {history.dirty && (
            <p className="text-[11px] text-[#98989d]">Edited</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <StudioToolbarIcon label="Undo" onClick={undo} disabled={history.undoStack.length === 0}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M4.5 7.5L2 5l2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 5h6.5a3.5 3.5 0 1 1 0 7H7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </StudioToolbarIcon>
        <StudioToolbarIcon label="Redo" onClick={redo} disabled={history.redoStack.length === 0}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M11.5 7.5L14 5l-2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 5H7.5a3.5 3.5 0 1 0 0 7H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </StudioToolbarIcon>
        <div className="mx-1.5 h-4 w-px bg-white/10" />
        <StudioToolbarIcon
          label={playback.playing ? "Pause" : "Play"}
          onClick={() => setPlaying(!playback.playing)}
          active={playback.playing}
        >
          {playback.playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
              <rect x="2.5" y="2" width="3" height="10" rx="0.75" />
              <rect x="8.5" y="2" width="3" height="10" rx="0.75" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
              <path d="M3.5 2.2L11.5 7L3.5 11.8V2.2Z" />
            </svg>
          )}
        </StudioToolbarIcon>
      </div>

      <div className="flex items-center gap-2">
        <select
          aria-label="Preview quality"
          value={patch.quality}
          onChange={(event) => setQuality(event.target.value as TextureQuality)}
          className={`hidden h-[28px] rounded-[6px] border ${studio.separator} bg-white/[0.06] px-2 text-[13px] text-[#f5f5f7] outline-none focus:ring-2 focus:ring-[#0a84ff]/40 md:block`}
        >
          <option value="preview">Preview</option>
          <option value="final">Final</option>
        </select>
        {onOpenWork && (
          <StudioSecondaryButton onClick={onOpenWork} disabled={isOpeningWork} ariaLabel="Open saved work">
            {isOpeningWork ? "Opening" : "Open"}
          </StudioSecondaryButton>
        )}
        <StudioSecondaryButton onClick={onExport}>Export</StudioSecondaryButton>
        <StudioSecondaryButton onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving" : "Save"}
        </StudioSecondaryButton>
        {workSlug ? (
          <Link
            href={`/work/${workSlug}`}
            className="flex h-[28px] items-center rounded-[6px] bg-white/10 px-3.5 text-[13px] font-medium text-[#64b5ff] hover:bg-white/[0.14]"
          >
            View Live
          </Link>
        ) : (
          <StudioPrimaryButton onClick={onPublish} disabled={isPublishing || isSaving} ariaLabel="Publish">
            {isPublishing ? "Publishing" : "Publish"}
          </StudioPrimaryButton>
        )}
      </div>
    </header>
  );
}
