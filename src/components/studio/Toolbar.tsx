"use client";

import { useStudioStore } from "@/lib/store";

export function Toolbar() {
  const editorOpen = useStudioStore((s) => s.editorOpen);
  const status = useStudioStore((s) => s.status);
  const aspect = useStudioStore((s) => s.aspect);
  const canUndo = useStudioStore((s) => s.canUndo);
  const canRedo = useStudioStore((s) => s.canRedo);
  const toggleEditor = useStudioStore((s) => s.toggleEditor);
  const toggleFullscreen = useStudioStore((s) => s.toggleFullscreen);
  const runCode = useStudioStore((s) => s.runCode);
  const randomize = useStudioStore((s) => s.randomize);
  const cycleAspect = useStudioStore((s) => s.cycleAspect);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const workId = useStudioStore((s) => s.workId);
  const workSlug = useStudioStore((s) => s.workSlug);
  const isSaving = useStudioStore((s) => s.isSaving);
  const isPublishing = useStudioStore((s) => s.isPublishing);
  const compositionMode = useStudioStore((s) => s.compositionMode);
  const toggleCompositionMode = useStudioStore((s) => s.toggleCompositionMode);

  return (
    <div className="flex items-center justify-between px-6 h-14 bg-white border-b border-ergon-border shrink-0">
      {/* Left: Brand */}
      <div className="flex items-center">
        <span className="text-sm font-bold text-ergon-text uppercase tracking-[0.2em]">
          Ergon
        </span>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-1.5">
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface rounded-md transition-colors disabled:opacity-20 disabled:pointer-events-none"
          title="Undo (⌘Z)"
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5l-2-2 2-2" />
            <path d="M1 3h7a3 3 0 0 1 0 6H6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface rounded-md transition-colors disabled:opacity-20 disabled:pointer-events-none"
          title="Redo (⌘⇧Z)"
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5l2-2-2-2" />
            <path d="M11 3H4a3 3 0 0 0 0 6h2" />
          </svg>
        </button>

        <div className="w-px h-5 bg-ergon-border mx-2" />

        {/* Randomize */}
        <button
          onClick={randomize}
          className="p-2 text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface rounded-md transition-colors"
          title="Randomize (Space)"
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="3.5" cy="3.5" r="0.9" />
            <circle cx="8.5" cy="3.5" r="0.9" />
            <circle cx="6" cy="6" r="0.9" />
            <circle cx="3.5" cy="8.5" r="0.9" />
            <circle cx="8.5" cy="8.5" r="0.9" />
          </svg>
        </button>

        <div className="w-px h-5 bg-ergon-border mx-2" />

        {/* Run (only when editor open) */}
        {editorOpen && (
          <button
            onClick={runCode}
            disabled={status === "loading"}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] rounded-md transition-colors bg-ergon-red text-white hover:opacity-90 disabled:opacity-50"
          >
            <svg width="10" height="12" viewBox="0 0 8 10" fill="currentColor">
              <path d="M0 0L8 5L0 10V0Z" />
            </svg>
            Run
          </button>
        )}

        <button
          onClick={toggleEditor}
          className={`px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] rounded-md transition-colors ${
            editorOpen
              ? "bg-ergon-text text-white"
              : "text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface"
          }`}
        >
          Code
        </button>

        <button
          onClick={toggleCompositionMode}
          className={`px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] rounded-md transition-colors ${
            compositionMode
              ? "bg-ergon-text text-white"
              : "text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface"
          }`}
        >
          Layers
        </button>

        <div className="w-px h-5 bg-ergon-border mx-2" />

        <button
          onClick={() => window.dispatchEvent(new CustomEvent("ergon:save"))}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] rounded-md text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        {workId && !workSlug && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("ergon:publish"))}
            disabled={isPublishing}
            className="px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] rounded-md transition-colors bg-ergon-red text-white hover:opacity-90 disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </button>
        )}

        {workSlug && (
          <button
            onClick={() => window.open(`/work/${workSlug}`, "_blank")}
            className="px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            View
          </button>
        )}

        <button
          onClick={() => window.dispatchEvent(new CustomEvent("ergon:export"))}
          className="px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] rounded-md text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface transition-colors"
        >
          Export
        </button>
      </div>

      {/* Right: Canvas controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={cycleAspect}
          className="px-3 py-2 text-sm font-medium uppercase tracking-[0.05em] rounded-md text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface transition-colors font-mono"
        >
          {aspect === "free" ? "Free" : aspect}
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface rounded-md transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
