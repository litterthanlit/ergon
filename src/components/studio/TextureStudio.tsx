"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { downloadDataUrl, exportFilename } from "@/lib/export";
import { listMyWorks, loadWork, publishWork, saveWork } from "@/lib/actions/works";
import type { Work } from "@/lib/supabase/types";
import type { TextureRuntime } from "@/lib/texture-runtime";
import { parseWorkDocument, type WorkDocument } from "@/lib/work-document";
import { useTexturePatchStore } from "@/lib/texture-patch-store";
import { TextureNetwork } from "./TextureNetwork";
import { TextureOperatorBrowser } from "./TextureOperatorBrowser";
import { TextureProHeader } from "./TextureProHeader";
import { TextureRightPanel } from "./TextureRightPanel";
import { TextureViewer } from "./TextureViewer";
import { studio } from "./studio-primitives";

type PersistenceStatus = {
  kind: "success" | "error";
  message: string;
};

export function TextureStudio() {
  const patch = useTexturePatchStore((state) => state.patch);
  const renderPlan = useTexturePatchStore((state) => state.renderPlan);
  const loadPatch = useTexturePatchStore((state) => state.loadPatch);
  const markSaved = useTexturePatchStore((state) => state.markSaved);
  const [runtime, setRuntime] = useState<TextureRuntime | null>(null);
  const [workId, setWorkId] = useState<string | null>(null);
  const [workSlug, setWorkSlug] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [savedWorks, setSavedWorks] = useState<Work[]>([]);
  const [savedWorksLoaded, setSavedWorksLoaded] = useState(false);
  const [savedWorkPanelOpen, setSavedWorkPanelOpen] = useState(false);
  const [isLoadingWorks, setIsLoadingWorks] = useState(false);
  const [openingWorkId, setOpeningWorkId] = useState<string | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus | null>(null);

  const savedTextureWorks = useMemo(
    () => savedWorks.filter((work) => parseWorkDocument(work).engine === "texture-patch"),
    [savedWorks]
  );

  const refreshSavedWorks = useCallback(async () => {
    setIsLoadingWorks(true);
    setPersistenceStatus(null);
    try {
      const result = await listMyWorks();
      if (result.error) {
        setPersistenceStatus({ kind: "error", message: result.error });
        setSavedWorks([]);
        setSavedWorksLoaded(true);
        return;
      }
      setSavedWorks(result.works ?? []);
      setSavedWorksLoaded(true);
    } finally {
      setIsLoadingWorks(false);
    }
  }, []);

  const openTextureWork = useCallback((work: Work) => {
    const document = parseWorkDocument(work);
    if (document.engine !== "texture-patch") {
      setPersistenceStatus({ kind: "error", message: "This work uses the p5 studio." });
      return false;
    }

    loadPatch(document.patch);
    setWorkId(work.id);
    setWorkSlug(work.slug);
    setSavedWorkPanelOpen(false);
    setPersistenceStatus({ kind: "success", message: "Opened saved work" });

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.pathname = "/studio";
      url.searchParams.set("work", work.id);
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }

    return true;
  }, [loadPatch]);

  const handleOpenSavedWork = useCallback(async (id: string) => {
    setOpeningWorkId(id);
    setPersistenceStatus(null);
    try {
      const result = await loadWork(id);
      if (result.error) {
        setPersistenceStatus({ kind: "error", message: result.error });
        return;
      }
      if (!result.work) {
        setPersistenceStatus({ kind: "error", message: "Saved work not found" });
        return;
      }
      openTextureWork(result.work);
    } finally {
      setOpeningWorkId(null);
    }
  }, [openTextureWork]);

  const handleOpenSavedWorkPanel = useCallback(() => {
    setSavedWorkPanelOpen((open) => !open);
    if (!savedWorksLoaded) void refreshSavedWorks();
  }, [refreshSavedWorks, savedWorksLoaded]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("work");
    if (id) void handleOpenSavedWork(id);
  }, [handleOpenSavedWork]);

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
    <main className={`flex h-dvh w-full flex-col overflow-hidden ${studio.bg} ${studio.text}`}>
      <TextureProHeader
        onExport={handleExport}
        onOpenWork={handleOpenSavedWorkPanel}
        onSave={handleSave}
        onPublish={handlePublish}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isOpeningWork={isLoadingWorks || openingWorkId !== null}
        workSlug={workSlug}
      />

      {savedWorkPanelOpen && (
        <div
          role="dialog"
          aria-label="Saved works"
          className={`fixed right-5 top-[60px] z-50 w-[340px] border ${studio.separator} ${studio.radius} bg-[#2c2c2e]/95 p-2 shadow-2xl backdrop-blur-xl`}
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <h2 className="text-[13px] font-semibold text-[#f5f5f7]">Saved Work</h2>
            <button
              type="button"
              onClick={() => setSavedWorkPanelOpen(false)}
              className="rounded-[6px] px-2 py-1 text-[12px] text-[#98989d] hover:bg-white/[0.08] hover:text-[#f5f5f7]"
            >
              Close
            </button>
          </div>
          <div className="max-h-[360px] overflow-y-auto pb-1">
            {isLoadingWorks ? (
              <p className="px-2 py-6 text-center text-[13px] text-[#98989d]">Loading</p>
            ) : savedTextureWorks.length === 0 ? (
              <p className="px-2 py-6 text-center text-[13px] text-[#98989d]">No saved texture patches</p>
            ) : (
              savedTextureWorks.map((work) => (
                <button
                  key={work.id}
                  type="button"
                  aria-label={`Open ${work.title}`}
                  onClick={() => handleOpenSavedWork(work.id)}
                  disabled={openingWorkId === work.id}
                  className="flex w-full items-center justify-between gap-3 rounded-[6px] px-2.5 py-2 text-left hover:bg-white/[0.08] disabled:opacity-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-[#f5f5f7]">{work.title}</span>
                    <span className="block text-[11px] text-[#98989d]">
                      {work.slug ? "Published" : "Draft"}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-[#636366]">
                    {openingWorkId === work.id ? "Opening" : "Open"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {persistenceStatus && (
        <div
          role={persistenceStatus.kind === "error" ? "alert" : "status"}
          className={`fixed right-5 top-[60px] z-50 max-w-sm ${studio.radius} border px-4 py-3 text-[13px] shadow-2xl backdrop-blur-xl ${
            persistenceStatus.kind === "error"
              ? "border-red-500/30 bg-red-950/90 text-red-100"
              : "border-emerald-500/25 bg-[#2c2c2e]/95 text-[#f5f5f7]"
          }`}
        >
          <span>{persistenceStatus.message}</span>
          {workSlug && (
            <a
              href={`/work/${workSlug}`}
              className="ml-2 text-[#64b5ff] hover:underline"
            >
              Open published work
            </a>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <TextureOperatorBrowser />
        <ReactFlowProvider>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <TextureViewer plan={renderPlan} onRuntimeReady={setRuntime} />
            <TextureNetwork />
          </div>
        </ReactFlowProvider>
        <TextureRightPanel />
      </div>
    </main>
  );
}
