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

  return (
    <div className="flex items-center justify-between px-4 h-10 bg-neutral-950 border-b border-neutral-900 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em]">
          Ergon
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-1.5 py-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 rounded transition-colors disabled:opacity-25 disabled:pointer-events-none"
          title="Undo (⌘Z)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5l-2-2 2-2" />
            <path d="M1 3h7a3 3 0 0 1 0 6H6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="px-1.5 py-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 rounded transition-colors disabled:opacity-25 disabled:pointer-events-none"
          title="Redo (⌘⇧Z)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5l2-2-2-2" />
            <path d="M11 3H4a3 3 0 0 0 0 6h2" />
          </svg>
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {/* Randomize */}
        <button
          onClick={randomize}
          className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors"
          title="Randomize (Space)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="3.5" cy="3.5" r="1" />
            <circle cx="8.5" cy="3.5" r="1" />
            <circle cx="6" cy="6" r="1" />
            <circle cx="3.5" cy="8.5" r="1" />
            <circle cx="8.5" cy="8.5" r="1" />
          </svg>
        </button>

        {/* Run (only when editor open) */}
        {editorOpen && (
          <button
            onClick={runCode}
            disabled={status === "loading"}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded transition-colors bg-white text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
          >
            <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
              <path d="M0 0L8 5L0 10V0Z" />
            </svg>
            Run
          </button>
        )}

        <button
          onClick={toggleEditor}
          className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded transition-colors ${
            editorOpen
              ? "bg-neutral-800 text-white"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"
          }`}
        >
          Code
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent("ergon:export"))}
          className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors"
        >
          Export
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {/* Aspect ratio */}
        <button
          onClick={cycleAspect}
          className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors font-mono"
        >
          {aspect === "free" ? "Free" : aspect}
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="px-2 py-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 rounded transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
