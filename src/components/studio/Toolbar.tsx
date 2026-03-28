"use client";

import { useStudioStore } from "@/lib/store";

export function Toolbar() {
  const editorOpen = useStudioStore((s) => s.editorOpen);
  const status = useStudioStore((s) => s.status);
  const toggleEditor = useStudioStore((s) => s.toggleEditor);
  const toggleFullscreen = useStudioStore((s) => s.toggleFullscreen);
  const runCode = useStudioStore((s) => s.runCode);

  return (
    <div className="flex items-center justify-between px-4 h-10 bg-neutral-950 border-b border-neutral-900 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em]">
          Ergon
        </span>
      </div>

      <div className="flex items-center gap-1">
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
