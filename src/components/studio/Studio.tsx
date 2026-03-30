"use client";

import { useCallback, useEffect } from "react";
import { Canvas } from "./Canvas";
import { ParameterPanel } from "./ParameterPanel";
import { CodeEditor } from "./CodeEditor";
import { TemplateSwitcher } from "./TemplateSwitcher";
import { Toolbar } from "./Toolbar";
import { ResizeHandle } from "./ResizeHandle";
import { LayerPanel } from "./LayerPanel";
import { useStudioStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getTemplate } from "@/lib/templates/registry";
import { downloadDataUrl, exportFilename } from "@/lib/export";
import { saveWork, publishWork } from "@/lib/actions/works";

function parseErrorLine(error: string | null): number | null {
  if (!error) return null;
  const match = error.match(/line (\d+)/i) || error.match(/:(\d+):/);
  return match ? parseInt(match[1], 10) : null;
}

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
  const editorHeight = useStudioStore((s) => s.editorHeight);
  const setEditorHeight = useStudioStore((s) => s.setEditorHeight);
  const workId = useStudioStore((s) => s.workId);
  const workTitle = useStudioStore((s) => s.workTitle);
  const setWorkId = useStudioStore((s) => s.setWorkId);
  const setWorkSlug = useStudioStore((s) => s.setWorkSlug);
  const setIsSaving = useStudioStore((s) => s.setIsSaving);
  const setIsPublishing = useStudioStore((s) => s.setIsPublishing);
  const compositionMode = useStudioStore((s) => s.compositionMode);
  const layers = useStudioStore((s) => s.layers);
  const activeLayerIndex = useStudioStore((s) => s.activeLayerIndex);
  const updateLayerParams = useStudioStore((s) => s.updateLayerParams);

  useKeyboardShortcuts();

  const handleResize = useCallback(
    (deltaY: number) => {
      setEditorHeight(editorHeight + deltaY);
    },
    [editorHeight, setEditorHeight]
  );

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

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await saveWork({
        id: workId ?? undefined,
        title: workTitle,
        code,
        templateId: template.id,
        params: values as Record<string, unknown>,
      });
      if (result.id) {
        setWorkId(result.id);
      }
    } finally {
      setIsSaving(false);
    }
  }, [workId, workTitle, code, template.id, values, setWorkId, setIsSaving]);

  const handlePublish = useCallback(async () => {
    if (!workId) return;
    setIsPublishing(true);
    try {
      const result = await publishWork(workId, workTitle);
      if (result.slug) {
        setWorkSlug(result.slug);
      }
    } finally {
      setIsPublishing(false);
    }
  }, [workId, workTitle, setWorkSlug, setIsPublishing]);

  useEffect(() => {
    function onExport() { handleExport(); }
    window.addEventListener("ergon:export", onExport);
    return () => window.removeEventListener("ergon:export", onExport);
  }, [handleExport]);

  useEffect(() => {
    function onSave() { handleSave(); }
    function onPublish() { handlePublish(); }
    window.addEventListener("ergon:save", onSave);
    window.addEventListener("ergon:publish", onPublish);
    return () => {
      window.removeEventListener("ergon:save", onSave);
      window.removeEventListener("ergon:publish", onPublish);
    };
  }, [handleSave, handlePublish]);

  return (
    <div className="h-screen w-screen bg-white flex flex-col overflow-hidden">
      <Toolbar />

      <div className="flex-1 flex min-h-0">
        {/* Canvas + Editor stack */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas area */}
          <div className="flex-1 relative min-h-0 bg-ergon-surface">
            <Canvas />

            {/* Template switcher */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <TemplateSwitcher
                activeId={template.id}
                onSelect={handleTemplateSelect}
              />
            </div>

            {/* Error overlay */}
            {status === "error" && error && (
              <div className="absolute bottom-12 left-4 right-4 bg-ergon-red/95 text-white text-[11px] px-4 py-3 rounded font-mono backdrop-blur-sm z-20">
                {error}
              </div>
            )}
          </div>

          {/* Code editor — stays dark for contrast */}
          {editorOpen && (
            <div className="animate-slide-up">
              <ResizeHandle onResize={handleResize} />
              <div
                className="border-t border-neutral-800 bg-[#0a0a0a] shrink-0"
                style={{ height: editorHeight }}
              >
                <CodeEditor
                  code={code}
                  onChange={setCode}
                  errorLine={parseErrorLine(error)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Parameter Panel */}
        {!isFullscreen && (
          <div className="w-80 bg-white border-l border-ergon-border flex flex-col shrink-0 animate-fade-in">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-ergon-border">
              <h2 className="text-sm font-bold text-ergon-text uppercase tracking-[0.12em]">
                {compositionMode
                  ? `Layer: ${layers[activeLayerIndex]?.name ?? "—"}`
                  : template.name}
              </h2>
              <p className="text-xs text-ergon-muted mt-2 leading-relaxed">
                {compositionMode
                  ? `${layers.length} layer${layers.length !== 1 ? "s" : ""}`
                  : template.description}
              </p>
            </div>

            {/* Composition: Layer panel */}
            {compositionMode && (
              <div className="px-6 py-4 border-b border-ergon-border">
                <LayerPanel />
              </div>
            )}

            {/* Controls — show active layer's params in composition mode */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {compositionMode ? (
                <ParameterPanel
                  schema={layers[activeLayerIndex]?.schema ?? null}
                  values={layers[activeLayerIndex]?.values ?? {}}
                  onChange={(key, value) => {
                    const layer = layers[activeLayerIndex];
                    if (layer) updateLayerParams(layer.id, key, value);
                  }}
                />
              ) : (
                <ParameterPanel
                  schema={schema}
                  values={values}
                  onChange={setParamValue}
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-ergon-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status === "ready"
                        ? "bg-emerald-500"
                        : status === "error"
                          ? "bg-ergon-red"
                          : "bg-amber-500 animate-pulse"
                    }`}
                  />
                  <span className="text-xs text-ergon-muted uppercase tracking-[0.12em] font-medium">
                    {status === "ready"
                      ? "Running"
                      : status === "error"
                        ? "Error"
                        : "Loading"}
                  </span>
                </div>
                <span className="text-xs text-ergon-muted/50 font-mono">
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
