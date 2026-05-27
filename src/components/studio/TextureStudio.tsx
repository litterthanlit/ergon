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

type PersistenceStatus = {
  kind: "success" | "error";
  message: string;
};

export function TextureStudio() {
  const patch = useTexturePatchStore((state) => state.patch);
  const renderPlan = useTexturePatchStore((state) => state.renderPlan);
  const markSaved = useTexturePatchStore((state) => state.markSaved);
  const [runtime, setRuntime] = useState<TextureRuntime | null>(null);
  const [workId, setWorkId] = useState<string | null>(null);
  const [workSlug, setWorkSlug] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus | null>(null);

  const handleExport = useCallback(() => {
    const dataUrl = runtime?.exportPng(1);
    if (dataUrl) downloadDataUrl(dataUrl, exportFilename(patch.name, "png"));
  }, [patch.name, runtime]);

  const handleSave = useCallback(async (): Promise<string | null> => {
    setIsSaving(true);
    setPersistenceStatus(null);
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
        setPersistenceStatus({ kind: "error", message: result.error });
        return null;
      }
      if (result.id) setWorkId(result.id);
      markSaved();
      setPersistenceStatus({ kind: "success", message: "Saved" });
      return result.id ?? workId;
    } finally {
      setIsSaving(false);
    }
  }, [markSaved, patch, runtime, workId]);

  const handlePublish = useCallback(async () => {
    const id = workId ?? await handleSave();
    if (!id) return;
    setIsPublishing(true);
    setPersistenceStatus(null);
    try {
      const result = await publishWork(id, patch.name);
      if (result.error) {
        setPersistenceStatus({ kind: "error", message: result.error });
        return;
      }
      if (result.slug) {
        setWorkSlug(result.slug);
        setPersistenceStatus({ kind: "success", message: "Published" });
      }
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
      {persistenceStatus && (
        <div
          role={persistenceStatus.kind === "error" ? "alert" : "status"}
          className={`absolute right-4 top-20 z-40 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-2xl ${
            persistenceStatus.kind === "error"
              ? "border-red-400/30 bg-red-950/85 text-red-100"
              : "border-emerald-300/25 bg-emerald-950/80 text-emerald-100"
          }`}
        >
          <span>{persistenceStatus.message}</span>
          {workSlug && (
            <a href={`/work/${workSlug}`} className="ml-3 underline decoration-white/30 underline-offset-4 hover:text-white">
              Open published work
            </a>
          )}
        </div>
      )}
      <ReactFlowProvider>
        <div className="grid min-h-[980px] overflow-hidden rounded-xl border border-white/12 bg-[#101316]/82 shadow-2xl shadow-black/45 backdrop-blur-2xl lg:h-[calc(100dvh-1.5rem)] lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_276px] lg:grid-rows-[44vh_minmax(0,1fr)]">
          <div className="min-h-0 lg:col-span-2">
            <TextureViewer plan={renderPlan} onRuntimeReady={setRuntime} />
          </div>
          <div className="grid min-h-0 border-t border-white/10 lg:col-span-2 lg:grid-cols-[236px_minmax(0,1fr)_276px]">
            <TextureOperatorBrowser />
            <TextureNetwork />
            <TextureRightPanel />
          </div>
        </div>
      </ReactFlowProvider>
    </main>
  );
}
