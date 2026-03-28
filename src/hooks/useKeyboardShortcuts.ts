"use client";

import { useEffect } from "react";
import { useStudioStore } from "@/lib/store";

export function useKeyboardShortcuts() {
  const toggleEditor = useStudioStore((s) => s.toggleEditor);
  const toggleFullscreen = useStudioStore((s) => s.toggleFullscreen);
  const runCode = useStudioStore((s) => s.runCode);
  const editorOpen = useStudioStore((s) => s.editorOpen);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (target.closest(".cm-editor")) {
        if (meta && e.key === "Enter") {
          e.preventDefault();
          runCode();
        }
        return;
      }

      if (meta && e.key === "e") {
        e.preventDefault();
        toggleEditor();
      }

      if (meta && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }

      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (editorOpen) {
          toggleEditor();
        }
      }

      if (e.key === "f" && !meta && !editorOpen) {
        e.preventDefault();
        toggleFullscreen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleEditor, toggleFullscreen, runCode, editorOpen]);
}
