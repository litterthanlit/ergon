"use client";

import { useCallback, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { downloadDataUrl, exportFilename } from "@/lib/export";
import { publishWork, saveWork } from "@/lib/actions/works";
import type { TextureRuntime } from "@/lib/texture-runtime";
import { useTexturePatchStore } from "@/lib/texture-patch-store";
import { TextureCommandBar } from "./TextureCommandBar";
import { TextureInspector } from "./TextureInspector";
import { TextureNetwork } from "./TextureNetwork";
import { TextureViewer } from "./TextureViewer";

export function TextureStudio() {
  const patch = useTexturePatchStore((state) => state.patch);
  const renderPlan = useTexturePatchStore((state) => state.renderPlan);
  const [runtime, setRuntime] = useState<TextureRuntime | null>(null);
  const [workId, setWorkId] = useState<string | null>(null);
  const [workSlug, setWorkSlug] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleExport = useCallback(() => {
    const dataUrl = runtime?.exportPng(1);
    if (dataUrl) downloadDataUrl(dataUrl, exportFilename(patch.name, "png"));
  }, [patch.name, runtime]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const thumbnail = runtime?.exportPng(0.35) ?? null;
      const result = await saveWork({
        id: workId ?? undefined,
        title: patch.name,
        code: JSON.stringify(patch),
        templateId: "texture-patch",
        params: { patch, renderPlan, thumbnail },
      });
      if (result.id) setWorkId(result.id);
    } finally {
      setIsSaving(false);
    }
  }, [patch, renderPlan, runtime, workId]);

  const handlePublish = useCallback(async () => {
    if (!workId) {
      await handleSave();
      return;
    }
    setIsPublishing(true);
    try {
      const result = await publishWork(workId, patch.name);
      if (result.slug) setWorkSlug(result.slug);
    } finally {
      setIsPublishing(false);
    }
  }, [handleSave, patch.name, workId]);

  return (
    <main className="flex min-h-dvh w-screen flex-col overflow-y-auto bg-[#050609] text-zinc-100 lg:h-dvh lg:overflow-hidden">
      <TextureCommandBar
        onExport={handleExport}
        onSave={handleSave}
        onPublish={handlePublish}
        isSaving={isSaving}
        isPublishing={isPublishing}
        workSlug={workSlug}
      />
      <ReactFlowProvider>
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(520px,1fr)_minmax(300px,36vh)]">
          <TextureViewer plan={renderPlan} onRuntimeReady={setRuntime} />
          <div className="grid min-h-0 border-t border-white/10 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
            <TextureNetwork />
            <TextureInspector />
          </div>
        </div>
      </ReactFlowProvider>
    </main>
  );
}
