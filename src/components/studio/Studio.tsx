"use client";

import { useCallback, useEffect, useState } from "react";
import { Canvas } from "./Canvas";
import { ParameterPanel } from "./ParameterPanel";
import { CodeEditor } from "./CodeEditor";
import { Toolbar } from "./Toolbar";
import { ResizeHandle } from "./ResizeHandle";
import { LayerPanel } from "./LayerPanel";
import { RecipePicker } from "./RecipePicker";
import { SharedDriversPanel } from "./SharedDriversPanel";
import { useStudioStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { downloadDataUrl, exportFilename } from "@/lib/export";
import { compositeLayersToDataUrl, type CompositeLayer } from "@/lib/compositor";
import { saveWork, publishWork } from "@/lib/actions/works";
import { recipes } from "@/lib/recipes";

function parseErrorLine(error: string | null): number | null {
  if (!error) return null;
  const match = error.match(/line (\d+)/i) || error.match(/:(\d+):/);
  return match ? parseInt(match[1], 10) : null;
}

type SidebarTab = "recipes" | "parameters" | "layers";

const tabMeta: Record<
  SidebarTab,
  {
    label: string;
    title: string;
    description: string;
  }
> = {
  recipes: {
    label: "Start",
    title: "Choose a starting recipe",
    description: "Start from a curated composition instead of a blank canvas.",
  },
  parameters: {
    label: "Shape",
    title: "Shape the active block",
    description: "Tune the selected block while keeping the whole piece coherent.",
  },
  layers: {
    label: "Stack",
    title: "Build the stack",
    description: "Rebalance the composition by swapping, hiding, and isolating forms.",
  },
};

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
  const loadRecipe = useStudioStore((s) => s.loadRecipe);

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("layers");
  const [hasLoaded, setHasLoaded] = useState(false);

  useKeyboardShortcuts();

  // Auto-load a random recipe on first mount (non-composition mode)
  useEffect(() => {
    if (!hasLoaded && !compositionMode) {
      const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
      loadRecipe(randomRecipe);
      setHasLoaded(true);
    }
  }, [hasLoaded, compositionMode, loadRecipe]);

  const handleResize = useCallback(
    (deltaY: number) => {
      setEditorHeight(editorHeight + deltaY);
    },
    [editorHeight, setEditorHeight]
  );

  const handleExport = useCallback(() => {
    const filename = exportFilename(template.name, "png");

    if (compositionMode && layers.length > 0) {
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
      console.warn("Cannot access iframe canvas directly.");
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

  const activeTabMeta = tabMeta[sidebarTab];

  const tabClasses = (tab: SidebarTab) =>
    `flex-1 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-center transition-all cursor-pointer ${
      sidebarTab === tab
        ? "bg-white text-ergon-text shadow-[0_8px_20px_rgba(10,22,40,0.06)]"
        : "text-ergon-muted hover:text-ergon-subtle"
    }`;

  return (
    <div className="h-screen w-screen bg-[radial-gradient(circle_at_top,_#fffaf0_0%,_#f5efe5_35%,_#eee6d8_100%)] p-4 md:p-5 flex flex-col gap-0 overflow-hidden">
      {/* Floating card — contains everything */}
      <div className="flex-1 flex flex-col bg-white/96 rounded-[26px] shadow-[0_18px_60px_rgba(35,26,14,0.10),0_0_0_1px_rgba(90,70,43,0.05)] overflow-hidden min-h-0 backdrop-blur-sm">
        {/* Toolbar */}
        <Toolbar />

        {/* Main content */}
        <div className="flex-1 flex min-h-0">
          {/* Canvas + Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Canvas */}
            <div className="flex-1 relative min-h-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(246,244,238,0.70)_40%,_rgba(236,229,217,0.86)_100%)]">
              <Canvas />

              {status === "error" && error && (
                <div className="absolute bottom-6 left-6 right-6 bg-ergon-red/95 text-white text-sm px-5 py-3 rounded-lg font-mono backdrop-blur-sm z-20">
                  {error}
                </div>
              )}

              <div className="pointer-events-none absolute left-6 top-6 hidden max-w-xs rounded-full border border-white/70 bg-white/72 px-4 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md md:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ergon-muted/80">
                  Clay mode
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ergon-subtle">
                  Start from a recipe, then shape it with small, immediate changes.
                </p>
              </div>
            </div>

            {/* Code editor */}
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
            <div className="w-[360px] bg-[#fcfbf7] border-l border-ergon-border/80 flex flex-col shrink-0">
              {/* Tabs */}
              <div className="border-b border-ergon-border/80 px-5 py-4 shrink-0 bg-white/55 backdrop-blur-sm">
                <div className="flex rounded-full border border-ergon-border/80 bg-ergon-surface/60 p-1">
                  <button className={tabClasses("recipes")} onClick={() => setSidebarTab("recipes")}>
                    {tabMeta.recipes.label}
                  </button>
                  <button className={tabClasses("parameters")} onClick={() => setSidebarTab("parameters")}>
                    {tabMeta.parameters.label}
                  </button>
                  <button className={tabClasses("layers")} onClick={() => setSidebarTab("layers")}>
                    {tabMeta.layers.label}
                  </button>
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 pt-5 pb-2">
                  <h2 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-ergon-text">
                    {activeTabMeta.title}
                  </h2>
                  <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ergon-muted">
                    {activeTabMeta.description}
                  </p>
                </div>

                {/* Recipes */}
                {sidebarTab === "recipes" && (
                  <div className="px-6 pb-7 pt-2">
                    <RecipePicker />
                  </div>
                )}

                {/* Parameters */}
                {sidebarTab === "parameters" && (
                  <div className="px-6 pb-7 pt-2">
                    {compositionMode && <SharedDriversPanel />}
                    <div className="mb-6 rounded-2xl border border-ergon-border/70 bg-white/65 px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ergon-muted/75">
                        {compositionMode ? "Active block" : "Current sketch"}
                      </p>
                      <h3 className="mt-1.5 text-[0.98rem] font-semibold text-ergon-text">
                        {compositionMode
                          ? layers[activeLayerIndex]?.name ?? "No layer"
                          : template.name}
                      </h3>
                      <p className="mt-1.5 text-sm text-ergon-muted leading-relaxed">
                        {compositionMode
                          ? `Form ${activeLayerIndex + 1} of ${layers.length} in the current composition.`
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

                {/* Layers */}
                {sidebarTab === "layers" && (
                  <div className="px-6 pb-7 pt-2">
                    <LayerPanel onLayerSelect={() => setSidebarTab("parameters")} />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-ergon-border/80 shrink-0 bg-white/55">
                <span className="text-[11px] text-ergon-muted/70 font-mono">
                  {editorOpen ? "⌘↵ run   ·   ⌘E close code" : "⌘E open code   ·   Space randomize"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
