"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import { motion } from "motion/react";
import { PatchGraph } from "./PatchGraph";
import { PatchInspector } from "./PatchInspector";
import { PatchPreview } from "./PatchPreview";
import { PatchTimeline } from "./PatchTimeline";
import { useVisualPatchStore } from "@/lib/visual-patch-store";
import { compositeLayersToDataUrl, type CompositeLayer } from "@/lib/compositor";
import { downloadDataUrl, exportFilename } from "@/lib/export";
import { publishWork, saveWork } from "@/lib/actions/works";
import type { WorkDocument } from "@/lib/work-document";

export function NodeStudio() {
  const patch = useVisualPatchStore((state) => state.patch);
  const renderPlan = useVisualPatchStore((state) => state.renderPlan);
  const [workId, setWorkId] = useState<string | null>(null);
  const [workSlug, setWorkSlug] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleExport = useCallback(() => {
    const compositeLayers: CompositeLayer[] = [];
    let maxWidth = 0;
    let maxHeight = 0;

    for (const layer of renderPlan.layers) {
      const iframe = document.querySelector<HTMLIFrameElement>(
        `iframe[title="Patch layer: ${layer.nodeId}"]`
      );
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
      const canvas = iframeDoc?.querySelector("canvas");
      if (!canvas) continue;
      maxWidth = Math.max(maxWidth, canvas.width);
      maxHeight = Math.max(maxHeight, canvas.height);
      compositeLayers.push({
        canvas,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        visible: true,
      });
    }

    if (!compositeLayers.length || maxWidth === 0 || maxHeight === 0) return;
    const dataUrl = compositeLayersToDataUrl(compositeLayers, maxWidth, maxHeight);
    downloadDataUrl(dataUrl, exportFilename(patch.name, "png"));
  }, [patch.name, renderPlan.layers]);

  const handleSave = useCallback(async (): Promise<string | null> => {
    setIsSaving(true);
    try {
      const document: WorkDocument = {
        engine: "p5-sketch",
        version: 1,
        code: JSON.stringify(patch),
        templateId: "visual-patch",
        params: { patch, renderPlan },
      };
      const result = await saveWork({
        id: workId ?? undefined,
        title: patch.name,
        document,
      });
      if (result.error) return null;
      if (result.id) setWorkId(result.id);
      return result.id ?? workId;
    } finally {
      setIsSaving(false);
    }
  }, [patch, renderPlan, workId]);

  const handlePublish = useCallback(async () => {
    const id = workId ?? await handleSave();
    if (!id) return;
    setIsPublishing(true);
    try {
      const result = await publishWork(id, patch.name);
      if (result.slug) setWorkSlug(result.slug);
    } finally {
      setIsPublishing(false);
    }
  }, [handleSave, patch.name, workId]);

  return (
    <main className="flex h-dvh w-screen flex-col overflow-y-auto bg-[#050609] text-zinc-100 xl:overflow-hidden">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/70 px-4 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/8 font-mono text-xs text-zinc-100">
              E
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.16em]">Ergon</span>
              <span className="block text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                generative node studio
              </span>
            </span>
          </Link>
          <div className="hidden h-7 items-center rounded-full border border-white/10 bg-white/[0.035] px-3 text-xs text-zinc-400 md:flex">
            {patch.name}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/8"
          >
            Export
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/8 disabled:opacity-50"
          >
            {isSaving ? "Saving" : "Save"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {workSlug ? "Published" : isPublishing ? "Publishing" : "Publish"}
          </button>
          {workSlug && (
            <Link href={`/work/${workSlug}`} className="rounded-full border border-emerald-300/30 px-4 py-2 text-xs text-emerald-200">
              View
            </Link>
          )}
        </div>
      </header>

      <ReactFlowProvider>
        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(360px,0.95fr)_minmax(430px,1.05fr)]">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="min-h-[320px]"
              >
                <PatchPreview layers={renderPlan.layers} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: 0.04 }}
                className="min-h-[320px]"
              >
                <PatchGraph />
              </motion.div>
            </div>
            <PatchTimeline />
          </section>
          <PatchInspector />
        </div>
      </ReactFlowProvider>
    </main>
  );
}
