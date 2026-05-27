"use client";

import { useCallback, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { downloadDataUrl, exportFilename } from "@/lib/export";
import { publishWork, saveWork } from "@/lib/actions/works";
import type { TextureRuntime } from "@/lib/texture-runtime";
import type { WorkDocument } from "@/lib/work-document";
import { useTexturePatchStore } from "@/lib/texture-patch-store";
import { TextureNetwork } from "./TextureNetwork";
import { TextureOperatorBrowser } from "./TextureOperatorBrowser";
import { TextureProHeader } from "./TextureProHeader";
import { TextureRightPanel } from "./TextureRightPanel";
import { TextureViewer } from "./TextureViewer";

export function TextureStudio() {
  const patch = useTexturePatchStore((state) => state.patch);
  const renderPlan = useTexturePatchStore((state) => state.renderPlan);
  const [runtime, setRuntime] = useState<TextureRuntime | null>(null);
  const [workId, setWorkId] = useState<string | null>(null);
  const [workSlug, setWorkSlug] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  const handleExport = useCallback(() => {
    const dataUrl = runtime?.exportPng(1);
    if (dataUrl) downloadDataUrl(dataUrl, exportFilename(patch.name, "png"));
  }, [patch.name, runtime]);

  const handleSave = useCallback(async (): Promise<string | null> => {
    setIsSaving(true);
    setPersistenceError(null);
    try {
      const thumbnail = runtime?.exportPng(0.35) ?? null;
      const document: WorkDocument = {
        engine: "texture-patch",
        version: 1,
        patch,
        exposedControls: [],
        seeds: {},
      };
      const result = await saveWork({
        id: workId ?? undefined,
        title: patch.name,
        document,
        thumbnailDataUrl: thumbnail,
      });
      if (result.error) {
        setPersistenceError(result.error);
        return null;
      }
      if (result.id) setWorkId(result.id);
      return result.id ?? workId;
    } finally {
      setIsSaving(false);
    }
  }, [patch, runtime, workId]);

  const handlePublish = useCallback(async () => {
    const id = workId ?? await handleSave();
    if (!id) return;
    setIsPublishing(true);
    setPersistenceError(null);
    try {
      const result = await publishWork(id, patch.name);
      if (result.error) {
        setPersistenceError(result.error);
        return;
      }
      if (result.slug) setWorkSlug(result.slug);
    } finally {
      setIsPublishing(false);
    }
  }, [handleSave, patch.name, workId]);

  return (
    <main className="min-h-dvh w-full overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_18%_0%,rgba(120,160,190,0.16),transparent_34%),linear-gradient(135deg,#07090b,#111417_48%,#07090b)] p-3 text-zinc-100 lg:h-dvh lg:overflow-hidden">
      <TextureProHeader
        onExport={handleExport}
        onSave={handleSave}
        onPublish={handlePublish}
        isSaving={isSaving}
        isPublishing={isPublishing}
        workSlug={workSlug}
      />
      {persistenceError && (
        <div className="absolute right-4 top-20 z-40 max-w-sm rounded-lg border border-red-400/30 bg-red-950/85 px-4 py-3 text-sm text-red-100 shadow-2xl">
          {persistenceError}
        </div>
      )}
      <ReactFlowProvider>
        <div className="grid min-h-[980px] overflow-hidden rounded-xl border border-white/12 bg-[#101316]/82 shadow-2xl shadow-black/45 backdrop-blur-2xl lg:h-[calc(100dvh-1.5rem)] lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_276px] lg:grid-rows-[44vh_minmax(0,1fr)_54px]">
          <div className="min-h-0 lg:col-span-2">
            <TextureViewer plan={renderPlan} onRuntimeReady={setRuntime} />
          </div>
          <div className="grid min-h-0 border-t border-white/10 lg:col-span-2 lg:grid-cols-[236px_minmax(0,1fr)_276px]">
            <TextureOperatorBrowser />
            <TextureNetwork />
            <TextureRightPanel />
          </div>
          <div className="hidden items-center justify-between border-t border-white/10 bg-[#171a1d]/85 px-5 text-sm text-zinc-500 lg:col-span-2 lg:flex">
            <div className="flex items-center gap-7">
              <button type="button" aria-label="Undo" className="text-lg hover:text-white">↶</button>
              <button type="button" aria-label="Redo" className="text-lg text-zinc-700 hover:text-white">↷</button>
              <button type="button" aria-label="Lock" className="hover:text-white">▣</button>
              <span className="h-7 w-px bg-white/10" />
              <button type="button" aria-label="Zoom out" className="text-lg hover:text-white">−</button>
              <button type="button" aria-label="Zoom in" className="text-lg hover:text-white">＋</button>
              <button type="button" className="rounded-md border border-white/10 bg-white/[0.035] px-4 py-2 text-[13px] text-zinc-300 hover:bg-white/10">100% ⌄</button>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="List layout" className="grid size-8 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-zinc-300">▤</button>
              <button type="button" aria-label="Panel layout" className="grid size-8 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-zinc-500">▭</button>
              <button type="button" aria-label="Grid layout" className="grid size-8 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-zinc-500">▦</button>
            </div>
          </div>
        </div>
      </ReactFlowProvider>
    </main>
  );
}
