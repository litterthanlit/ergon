import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TextureStudio } from "@/components/studio/TextureStudio";
import { compileTexturePatch, textureRecipes } from "@/lib/texture-patch";
import { createTexturePatchHistory } from "@/lib/texture-patch-history";
import { useTexturePatchStore } from "@/lib/texture-patch-store";
import type { Work } from "@/lib/supabase/types";

type StoreWithHistory = ReturnType<typeof useTexturePatchStore.getState> & {
  history: { dirty: boolean };
};

const actionMocks = vi.hoisted(() => ({
  listMyWorks: vi.fn(),
  loadWork: vi.fn(),
  saveWork: vi.fn(),
  publishWork: vi.fn(),
}));

vi.mock("@/lib/actions/works", () => actionMocks);

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@xyflow/react", () => ({
  Background: () => null,
  Controls: () => null,
  Handle: () => null,
  Position: { Left: "left", Right: "right" },
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReactFlow: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow">{children}</div>,
  useReactFlow: () => ({
    fitView: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  }),
}));

vi.mock("@/components/studio/TextureViewer", async () => {
  const React = await import("react");
  return {
    TextureViewer: ({ onRuntimeReady }: { onRuntimeReady: (runtime: { exportPng: () => string } | null) => void }) => {
      React.useEffect(() => {
        onRuntimeReady({ exportPng: () => "data:image/png;base64,AA==" });
        return () => onRuntimeReady(null);
      }, [onRuntimeReady]);
      return <div data-testid="texture-viewer-mock" />;
    },
  };
});

function resetStore() {
  const patch = textureRecipes[0].create();
  useTexturePatchStore.setState({
    patch,
    renderPlan: compileTexturePatch(patch),
    history: createTexturePatchHistory(),
    stats: null,
    playback: {
      playing: true,
      frame: patch.timeline?.currentFrame ?? 0,
      fpsTarget: patch.timeline?.fps ?? 60,
      durationFrames: patch.timeline?.durationFrames ?? 720,
      loop: patch.timeline?.loop ?? true,
      playbackRate: 1,
    },
    operatorBrowser: { tab: "TOP", search: "" },
  });
}

describe("TextureStudio persistence feedback", () => {
  beforeEach(() => {
    actionMocks.listMyWorks.mockReset();
    actionMocks.loadWork.mockReset();
    actionMocks.saveWork.mockReset();
    actionMocks.publishWork.mockReset();
    resetStore();
  });

  it("shows saving and success states and clears dirty state after save", async () => {
    let resolveSave: (value: { id: string }) => void = () => {};
    actionMocks.saveWork.mockReturnValue(new Promise((resolve) => {
      resolveSave = resolve;
    }));
    useTexturePatchStore.getState().updateNodeParam("grade-1", "contrast", 1.7);

    render(<TextureStudio />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();

    await act(async () => {
      resolveSave({ id: "work-1" });
    });

    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect((useTexturePatchStore.getState() as StoreWithHistory).history.dirty).toBe(false);
  });

  it("shows publish success with a link to the published work", async () => {
    actionMocks.saveWork.mockResolvedValue({ id: "work-1" });
    actionMocks.publishWork.mockResolvedValue({ slug: "liquid-aurora-live" });

    render(<TextureStudio />);
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    const link = await screen.findByRole("link", { name: "Open published work" });
    expect(link).toHaveAttribute("href", "/work/liquid-aurora-live");
    expect(screen.getByRole("status")).toHaveTextContent("Published");
  });

  it("shows save errors visibly", async () => {
    actionMocks.saveWork.mockResolvedValue({ error: "Not authenticated" });

    render(<TextureStudio />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Not authenticated");
    });
  });

  it("opens a saved texture patch and keeps its publish slug", async () => {
    const savedPatch = textureRecipes[1].create();
    savedPatch.name = "Saved Glass";
    const savedWork: Work = {
      id: "work-2",
      user_id: "user-1",
      title: "Saved Glass",
      code: JSON.stringify(savedPatch),
      template_id: "texture-patch",
      params: { patch: savedPatch },
      engine: "texture-patch",
      document_version: 1,
      document: {
        engine: "texture-patch",
        version: 1,
        patch: savedPatch,
        exposedControls: [],
        seeds: {},
      },
      thumbnail_url: "https://cdn.example/thumb.png",
      is_published: true,
      slug: "saved-glass-live",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    };
    actionMocks.listMyWorks.mockResolvedValue({ works: [savedWork] });
    actionMocks.loadWork.mockResolvedValue({ work: savedWork });

    render(<TextureStudio />);
    fireEvent.click(screen.getByRole("button", { name: "Open saved work" }));
    fireEvent.click(await screen.findByRole("button", { name: "Open Saved Glass" }));

    await waitFor(() => {
      expect(useTexturePatchStore.getState().patch.name).toBe("Saved Glass");
    });
    expect(useTexturePatchStore.getState().history.dirty).toBe(false);
    expect(screen.getByRole("link", { name: "View Live" })).toHaveAttribute("href", "/work/saved-glass-live");
  });
});
