"use client";

import Link from "next/link";
import { useStudioStore } from "@/lib/store";

export function Toolbar() {
  const editorOpen = useStudioStore((s) => s.editorOpen);
  const status = useStudioStore((s) => s.status);
  const canUndo = useStudioStore((s) => s.canUndo);
  const canRedo = useStudioStore((s) => s.canRedo);
  const toggleEditor = useStudioStore((s) => s.toggleEditor);
  const toggleFullscreen = useStudioStore((s) => s.toggleFullscreen);
  const runCode = useStudioStore((s) => s.runCode);
  const randomize = useStudioStore((s) => s.randomize);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const workId = useStudioStore((s) => s.workId);
  const workSlug = useStudioStore((s) => s.workSlug);
  const workTitle = useStudioStore((s) => s.workTitle);
  const setWorkTitle = useStudioStore((s) => s.setWorkTitle);
  const isSaving = useStudioStore((s) => s.isSaving);

  const statusLabel =
    status === "ready" ? "Holding form" : status === "error" ? "Material slipped" : "Shaping...";

  return (
    <div className="flex items-center justify-between px-5 h-14 bg-white/88 border-b border-ergon-border/80 shrink-0 backdrop-blur-sm">
      {/* Left: Brand + Title + Status */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex flex-col leading-none shrink-0">
          <span className="text-[13px] font-semibold text-ergon-text uppercase tracking-[0.16em]">
            Ergon
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ergon-muted">
            clay / play / form
          </span>
        </div>
        <input
          type="text"
          value={workTitle}
          onChange={(e) => setWorkTitle(e.target.value)}
          placeholder="Untitled composition"
          aria-label="Composition title"
            className="min-w-0 w-52 rounded-full border border-transparent bg-ergon-surface/60 px-3 py-1.5 text-sm font-medium text-ergon-text placeholder:text-ergon-muted/50 outline-none transition-colors focus:border-ergon-border focus:bg-white focus:ring-2 focus:ring-ergon-text/5"
        />
        <div className="flex items-center gap-2 rounded-full border border-ergon-border/70 bg-white/70 px-2.5 py-1">
          <div
            className={`w-2 h-2 rounded-full ${
              status === "ready"
                ? "bg-emerald-500"
                : status === "error"
                  ? "bg-ergon-red"
                : "bg-amber-500 animate-pulse"
            }`}
          />
          <span className="text-[11px] text-ergon-muted font-medium">
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Center: Icon tools */}
      <div className="flex items-center gap-1 rounded-full border border-ergon-border/70 bg-white/65 p-1 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 text-ergon-muted hover:text-ergon-text hover:bg-white rounded-full transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
          title="Pull back (⌘Z)"
          aria-label="Pull back last change"
        >
          <svg width="18" height="18" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5l-2-2 2-2" />
            <path d="M1 3h7a3 3 0 0 1 0 6H6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-ergon-muted hover:text-ergon-text hover:bg-white rounded-full transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
          title="Push forward (⌘⇧Z)"
          aria-label="Push forward last change"
        >
          <svg width="18" height="18" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5l2-2-2-2" />
            <path d="M11 3H4a3 3 0 0 0 0 6h2" />
          </svg>
        </button>

        <div className="w-px h-5 bg-ergon-border mx-1" />

        <button
          onClick={randomize}
          className="p-2 text-ergon-muted hover:text-ergon-text hover:bg-white rounded-full transition-colors cursor-pointer"
          title="Stir material (Space)"
          aria-label="Stir material"
        >
          <svg width="18" height="18" viewBox="0 0 12 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="3.5" cy="3.5" r="0.9" />
            <circle cx="8.5" cy="3.5" r="0.9" />
            <circle cx="6" cy="6" r="0.9" />
            <circle cx="3.5" cy="8.5" r="0.9" />
            <circle cx="8.5" cy="8.5" r="0.9" />
          </svg>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 text-ergon-muted hover:text-ergon-text hover:bg-white rounded-full transition-colors cursor-pointer"
          title="Open the canvas wide (F)"
          aria-label="Open the canvas wide"
        >
          <svg width="18" height="18" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" />
          </svg>
        </button>
      </div>

      {/* Right: Primary actions */}
      <div className="flex items-center gap-1.5">
        {editorOpen && (
          <button
            onClick={runCode}
            disabled={status === "loading"}
            className="flex items-center gap-2 px-4 h-9 text-[12px] font-semibold tracking-[0.01em] rounded-full transition-colors bg-ergon-accent text-ergon-text hover:brightness-105 disabled:opacity-50 cursor-pointer shadow-[0_8px_18px_rgba(232,185,49,0.18)]"
            title="Set the form"
          >
            <svg width="10" height="12" viewBox="0 0 8 10" fill="currentColor">
              <path d="M0 0L8 5L0 10V0Z" />
            </svg>
            Run
          </button>
        )}

        <button
          onClick={toggleEditor}
          className={`px-4 h-9 text-[12px] font-medium tracking-[0.01em] rounded-full transition-colors cursor-pointer ${
            editorOpen
              ? "bg-ergon-text text-white"
              : "text-ergon-subtle hover:text-ergon-text hover:bg-ergon-surface/80"
          }`}
          title={editorOpen ? "Close the sketching surface" : "Open the sketching surface"}
        >
          Code
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent("ergon:save"))}
          disabled={isSaving}
          className="px-4 h-9 text-[12px] font-medium tracking-[0.01em] rounded-full text-ergon-subtle hover:text-ergon-text hover:bg-ergon-surface/80 transition-colors disabled:opacity-50 cursor-pointer"
          title="Preserve this form"
        >
          {isSaving ? "Preserving..." : "Save"}
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent("ergon:export"))}
          className="px-4 h-9 text-[12px] font-medium tracking-[0.01em] rounded-full text-ergon-subtle hover:text-ergon-text hover:bg-ergon-surface/80 transition-colors cursor-pointer"
          title="Cast the current form"
        >
          Export
        </button>

        {workId && !workSlug && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("ergon:publish"))}
            className="px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.01em] rounded-full bg-ergon-accent text-ergon-text hover:brightness-110 transition-all cursor-pointer"
            title="Send this piece out"
          >
            Publish
          </button>
        )}
        {workSlug && (
          <Link
            href={`/work/${workSlug}`}
            target="_blank"
            className="px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.01em] rounded-full bg-ergon-accent/20 text-ergon-accent hover:bg-ergon-accent/30 transition-all cursor-pointer"
            title="Open the finished piece"
          >
            View Live
          </Link>
        )}
      </div>
    </div>
  );
}
