"use client";

import { useCallback, useEffect } from "react";
import { Canvas } from "./Canvas";
import { ParameterPanel } from "./ParameterPanel";
import { CodeEditor } from "./CodeEditor";
import { TemplateSwitcher } from "./TemplateSwitcher";
import { Toolbar } from "./Toolbar";
import { useStudioStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getTemplate } from "@/lib/templates/registry";
import { downloadDataUrl, exportFilename } from "@/lib/export";

export function Studio() {
  const schema = useStudioStore((s) => s.schema);
  const values = useStudioStore((s) => s.values);
  const status = useStudioStore((s) => s.status);
  const error = useStudioStore((s) => s.error);
  const template = useStudioStore((s) => s.template);
  const code = useStudioStore((s) => s.code);
  const editorOpen = useStudioStore((s) => s.editorOpen);
  const isFullscreen = useStudioStore((s) => s.isFullscreen);
  const setParamValue = useStudioStore((s) => s.setParamValue);
  const setCode = useStudioStore((s) => s.setCode);
  const setTemplate = useStudioStore((s) => s.setTemplate);

  useKeyboardShortcuts();

  const handleTemplateSelect = useCallback(
    (id: string) => {
      const t = getTemplate(id);
      if (t) setTemplate(t);
    },
    [setTemplate]
  );

  const handleExport = useCallback(() => {
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[title="Ergon Sandbox"]'
    );
    if (!iframe) return;

    const filename = exportFilename(template.name, "png");

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      const canvas = iframeDoc?.querySelector("canvas");
      if (canvas) {
        const dataUrl = canvas.toDataURL("image/png");
        downloadDataUrl(dataUrl, filename);
      }
    } catch {
      console.warn("Cannot access iframe canvas directly. Use postMessage export.");
    }
  }, [template.name]);

  // Listen for export events from Toolbar
  useEffect(() => {
    function onExport() { handleExport(); }
    window.addEventListener("ergon:export", onExport);
    return () => window.removeEventListener("ergon:export", onExport);
  }, [handleExport]);

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Toolbar */}
      <Toolbar />

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas + Editor stack */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas area */}
          <div className="flex-1 relative min-h-0">
            <Canvas />

            {/* Template switcher — pinned to bottom of canvas */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <TemplateSwitcher
                activeId={template.id}
                onSelect={handleTemplateSelect}
              />
            </div>

            {/* Error overlay */}
            {status === "error" && error && (
              <div className="absolute bottom-12 left-4 right-4 bg-red-950/90 text-red-200 text-[11px] px-4 py-3 rounded font-mono backdrop-blur-sm z-20">
                {error}
              </div>
            )}
          </div>

          {/* Code editor panel — slides up from bottom */}
          {editorOpen && (
            <div className="h-[40vh] border-t border-neutral-800 bg-[#0a0a0a] shrink-0">
              <CodeEditor code={code} onChange={setCode} />
            </div>
          )}
        </div>

        {/* Parameter Panel — right sidebar */}
        {!isFullscreen && (
          <div className="w-72 bg-neutral-950 border-l border-neutral-900 flex flex-col shrink-0">
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-neutral-900">
              <h2 className="text-[11px] font-semibold text-white uppercase tracking-[0.15em]">
                {template.name}
              </h2>
              <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed">
                {template.description}
              </p>
            </div>

            {/* Controls */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ParameterPanel
                schema={schema}
                values={values}
                onChange={setParamValue}
              />
            </div>

            {/* Footer — status + shortcuts hint */}
            <div className="px-5 py-3 border-t border-neutral-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === "ready"
                        ? "bg-emerald-500"
                        : status === "error"
                          ? "bg-red-500"
                          : "bg-amber-500 animate-pulse"
                    }`}
                  />
                  <span className="text-[9px] text-neutral-600 uppercase tracking-[0.15em] font-medium">
                    {status === "ready"
                      ? "Running"
                      : status === "error"
                        ? "Error"
                        : "Loading"}
                  </span>
                </div>
                <span className="text-[9px] text-neutral-700">
                  {editorOpen ? "⌘↵ Run" : "⌘E Code"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
