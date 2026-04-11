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

  return (
    <div className="flex items-center justify-between px-4 h-12 bg-ergon-bg border-b border-ergon-border shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold text-ergon-muted uppercase tracking-[0.2em]">
          Ergon
        </span>
        <div className="w-px h-4 bg-ergon-border" />
        <input
          type="text"
          value={workTitle}
          onChange={(e) => setWorkTitle(e.target.value)}
          placeholder="Untitled"
          className="bg-transparent text-sm font-medium text-ergon-text placeholder:text-ergon-muted/30 border-none outline-none w-36"
        />
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            status === "ready"
              ? "bg-emerald-500"
              : status === "error"
                ? "bg-ergon-red"
                : "bg-amber-500 animate-pulse"
          }`}
        />
      </div>

      {/* Center */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 text-ergon-muted hover:text-ergon-text rounded-md transition-colors disabled:opacity-20 cursor-pointer"
          title="Undo"
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5l-2-2 2-2" /><path d="M1 3h7a3 3 0 0 1 0 6H6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-ergon-muted hover:text-ergon-text rounded-md transition-colors disabled:opacity-20 cursor-pointer"
          title="Redo"
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5l2-2-2-2" /><path d="M11 3H4a3 3 0 0 0 0 6h2" />
          </svg>
        </button>
        <div className="w-px h-4 bg-ergon-border mx-1" />
        <button
          onClick={randomize}
          className="p-2 text-ergon-muted hover:text-ergon-text rounded-md transition-colors cursor-pointer"
          title="Randomize"
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="3.5" cy="3.5" r="0.8" /><circle cx="8.5" cy="3.5" r="0.8" />
            <circle cx="6" cy="6" r="0.8" />
            <circle cx="3.5" cy="8.5" r="0.8" /><circle cx="8.5" cy="8.5" r="0.8" />
          </svg>
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 text-ergon-muted hover:text-ergon-text rounded-md transition-colors cursor-pointer"
          title="Fullscreen"
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" />
          </svg>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {editorOpen && (
          <button
            onClick={runCode}
            disabled={status === "loading"}
            className="flex items-center gap-1.5 px-3 h-7 text-[11px] font-semibold uppercase tracking-[0.06em] rounded-md bg-ergon-accent text-ergon-bg hover:brightness-110 disabled:opacity-50 cursor-pointer transition-all"
          >
            <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor"><path d="M0 0L8 5L0 10V0Z" /></svg>
            Run
          </button>
        )}
        <button
          onClick={toggleEditor}
          className={`px-3 h-7 text-[11px] font-medium uppercase tracking-[0.06em] rounded-md transition-colors cursor-pointer ${
            editorOpen
              ? "bg-ergon-text text-ergon-bg"
              : "text-ergon-muted hover:text-ergon-text"
          }`}
        >
          Code
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("ergon:save"))}
          disabled={isSaving}
          className="px-3 h-7 text-[11px] font-medium uppercase tracking-[0.06em] rounded-md text-ergon-muted hover:text-ergon-text transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? "..." : "Save"}
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("ergon:export"))}
          className="px-3 h-7 text-[11px] font-medium uppercase tracking-[0.06em] rounded-md text-ergon-muted hover:text-ergon-text transition-colors cursor-pointer"
        >
          Export
        </button>
        {workId && !workSlug && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("ergon:publish"))}
            className="px-3 h-7 text-[11px] font-semibold uppercase tracking-[0.06em] rounded-md bg-ergon-accent text-ergon-bg hover:brightness-110 transition-all cursor-pointer"
          >
            Publish
          </button>
        )}
        {workSlug && (
          <Link
            href={`/work/${workSlug}`}
            target="_blank"
            className="px-3 h-7 flex items-center text-[11px] font-medium uppercase tracking-[0.06em] rounded-md text-ergon-accent hover:bg-ergon-accent/10 transition-all cursor-pointer"
          >
            View
          </Link>
        )}
      </div>
    </div>
  );
}
