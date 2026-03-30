"use client";

import { useEffect } from "react";
import { useStudioStore } from "@/lib/store";

export function useKeyboardShortcuts() {
  const toggleEditor = useStudioStore((s) => s.toggleEditor);
  const toggleFullscreen = useStudioStore((s) => s.toggleFullscreen);
  const runCode = useStudioStore((s) => s.runCode);
  const randomize = useStudioStore((s) => s.randomize);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const editorOpen = useStudioStore((s) => s.editorOpen);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      // Inside CodeMirror: only allow Cmd+Enter (run) and Cmd+Z/Shift+Z (undo/redo)
      if (target.closest(".cm-editor")) {
        if (meta && e.key === "Enter") {
          e.preventDefault();
          runCode();
        }
        return;
      }

      // Cmd+E — toggle editor
      if (meta && e.key === "e") {
        e.preventDefault();
        toggleEditor();
      }

      // Cmd+Enter — run code
      if (meta && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }

      // Cmd+Z — undo params
      if (meta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Cmd+Shift+Z — redo params
      if (meta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      // Escape — exit fullscreen or close editor
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (editorOpen) {
          toggleEditor();
        }
      }

      // F — toggle fullscreen (only when editor closed)
      if (e.key === "f" && !meta && !editorOpen) {
        e.preventDefault();
        toggleFullscreen();
      }

      // Space — randomize seed (only when editor closed and not in text input)
      if (e.key === " " && !meta && !editorOpen) {
        e.preventDefault();
        randomize();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleEditor, toggleFullscreen, runCode, randomize, undo, redo, editorOpen]);
}
