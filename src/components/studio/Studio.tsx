"use client";

import { useCallback, useEffect, useState } from "react";
import { Canvas } from "./Canvas";
import { ParameterPanel } from "./ParameterPanel";
import { CodeEditor } from "./CodeEditor";
import { Toolbar } from "./Toolbar";
import { ResizeHandle } from "./ResizeHandle";
import { LayerPanel } from "./LayerPanel";
import { useStudioStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getTemplate, templates } from "@/lib/templates/registry";
import { getDefaultValues } from "@/lib/types";
import { downloadDataUrl, exportFilename } from "@/lib/export";
import { compositeLayersToDataUrl, type CompositeLayer } from "@/lib/compositor";
import { saveWork, publishWork } from "@/lib/actions/works";

function parseErrorLine(error: string | null): number | null {
  if (!error) return null;
  const match = error.match(/line (\d+)/i) || error.match(/:(\d+):/);
  return match ? parseInt(match[1], 10) : null;
}

type SidebarTab = "templates" | "parameters" | "layers";

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
  const toggleCompositionMode = useStudioStore((s) => s.toggleCompositionMode);
  const addLayer = useStudioStore((s) => s.addLayer);

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("parameters");

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
      if (t) {
        if (compositionMode) {
          // In composition mode, add as a new layer
          addLayer(t.id, t.name, t.code, t.schema, getDefaultValues(t.schema));
        } else {
          setTemplate(t);
        }
        setSidebarTab("parameters");
      }
    },
    [setTemplate, compositionMode, addLayer]
  );

  const handleExport = useCallback(() => {
    const filename = exportFilename(template.name, "png");

    if (compositionMode && layers.length > 0) {
      // Composition mode: composite all layer canvases
      try {
        const compositeLayers: CompositeLayer[] = [];
        let maxWidth = 0;
        let maxHeight = 0;

        for (const layer of layers) {
          const iframe = document.querySelector<HTMLIFrameElement>(
            `iframe[title="Layer: ${layer.name}"]`
          );
          if (!iframe) continue;

          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          const canvas = iframeDoc?.querySelector("canvas");
          if (!canvas) continue;

          maxWidth = Math.max(maxWidth, canvas.width);
          maxHeight = Math.max(maxHeight, canvas.height);

          compositeLayers.push({
            canvas,
            opacity: layer.opacity,
            blendMode: layer.blendMode,
            visible: layer.visible,
          });
        }

        if (compositeLayers.length > 0) {
          const dataUrl = compositeLayersToDataUrl(compositeLayers, maxWidth, maxHeight);
          downloadDataUrl(dataUrl, filename);
        }
      } catch {
        console.warn("Cannot access layer canvases for composition export.");
      }
      return;
    }

    // Single mode export
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[title="Ergon Sandbox"]'
    );
    if (!iframe) return;

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
  }, [template.name, compositionMode, layers]);

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

  const tabClasses = (tab: SidebarTab) =>
    `flex-1 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-center transition-colors cursor-pointer ${
      sidebarTab === tab
        ? "text-ergon-text border-b-2 border-ergon-accent"
        : "text-ergon-muted hover:text-ergon-subtle border-b-2 border-transparent"
    }`;

  return (
    <div className="h-screen w-screen bg-ergon-surface flex flex-col overflow-hidden">
      <Toolbar />

      <div className="flex-1 flex min-h-0">
        {/* Canvas + Editor stack */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas area — framed with padding */}
          <div className="flex-1 relative min-h-0 p-5">
            <div className="w-full h-full rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <Canvas />
            </div>

            {/* Error overlay */}
            {status === "error" && error && (
              <div className="absolute bottom-8 left-8 right-8 bg-ergon-red/95 text-white text-sm px-5 py-3 rounded-lg font-mono backdrop-blur-sm z-20">
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

        {/* Sidebar */}
        {!isFullscreen && (
          <div className="w-[360px] bg-white border-l border-ergon-border flex flex-col shrink-0 animate-fade-in">
            {/* Tabs */}
            <div className="flex border-b border-ergon-border shrink-0">
              <button className={tabClasses("templates")} onClick={() => setSidebarTab("templates")}>
                Templates
              </button>
              <button className={tabClasses("parameters")} onClick={() => setSidebarTab("parameters")}>
                Controls
              </button>
              <button className={tabClasses("layers")} onClick={() => setSidebarTab("layers")}>
                Layers
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {/* Templates tab */}
              {sidebarTab === "templates" && (
                <div className="p-7">
                  <p className="text-xs text-ergon-muted mb-5">
                    {compositionMode
                      ? "Select a template to add as a new layer."
                      : "Select a template to start creating."}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleTemplateSelect(t.id)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          !compositionMode && template.id === t.id
                            ? "border-ergon-text bg-ergon-surface"
                            : "border-ergon-border hover:border-ergon-muted hover:bg-ergon-surface/50"
                        }`}
                      >
                        <span className="text-sm font-medium text-ergon-text block">{t.name}</span>
                        <span className="text-[11px] text-ergon-muted mt-1 block leading-snug line-clamp-2">
                          {t.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Parameters tab */}
              {sidebarTab === "parameters" && (
                <div className="p-7">
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-ergon-text uppercase tracking-[0.1em]">
                      {compositionMode
                        ? layers[activeLayerIndex]?.name ?? "No layer"
                        : template.name}
                    </h3>
                    <p className="text-xs text-ergon-muted mt-1.5 leading-relaxed">
                      {compositionMode
                        ? `Layer ${activeLayerIndex + 1} of ${layers.length}`
                        : template.description}
                    </p>
                  </div>
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
              )}

              {/* Layers tab */}
              {sidebarTab === "layers" && (
                <div className="p-7">
                  {!compositionMode ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-ergon-muted mb-4">
                        Composition mode lets you stack multiple sketches with blend modes.
                      </p>
                      <button
                        onClick={() => {
                          toggleCompositionMode();
                          setSidebarTab("layers");
                        }}
                        className="px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.06em] rounded-lg bg-ergon-text text-white hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Enable Layers
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-ergon-muted uppercase tracking-[0.1em]">
                          {layers.length} Layer{layers.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() => {
                            toggleCompositionMode();
                            setSidebarTab("parameters");
                          }}
                          className="text-xs text-ergon-muted hover:text-ergon-red transition-colors cursor-pointer"
                        >
                          Exit layers
                        </button>
                      </div>
                      <LayerPanel onLayerSelect={() => setSidebarTab("parameters")} />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-ergon-border shrink-0">
              <span className="text-xs text-ergon-muted/60 font-mono">
                {editorOpen ? "⌘↵ Run  ⌘E Close" : "⌘E Code  Space Shuffle"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
