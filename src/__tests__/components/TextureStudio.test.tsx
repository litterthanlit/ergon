import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TextureInspector } from "@/components/studio/TextureInspector";
import { TextureOperatorBrowser } from "@/components/studio/TextureOperatorBrowser";
import { TextureProHeader } from "@/components/studio/TextureProHeader";
import { TextureRightPanel } from "@/components/studio/TextureRightPanel";
import { TextureViewer } from "@/components/studio/TextureViewer";
import { compileTexturePatch, textureRecipes } from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

function resetStore() {
  const patch = textureRecipes[0].create();
    useTexturePatchStore.setState({
      patch,
      renderPlan: compileTexturePatch(patch),
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

describe("Texture studio controls", () => {
  beforeEach(() => {
    resetStore();
  });

  it("selection changes inspector content", () => {
    const { rerender } = render(<TextureInspector />);
    expect(screen.getByText("Color Grade TOP")).toBeInTheDocument();
    act(() => {
      useTexturePatchStore.getState().setSelectedNode("glass-1");
    });
    rerender(<TextureInspector />);
    expect(screen.getByRole("heading", { name: "Raymarch Glass TOP" })).toBeInTheDocument();
  });

  it("bypassing a node changes the compiled render plan", () => {
    render(<TextureInspector />);
    fireEvent.click(screen.getByText("Bypass"));
    const pass = useTexturePatchStore.getState().renderPlan.passes.find((item) => item.nodeId === "grade-1");
    expect(pass?.bypass).toBe(true);
  });

  it("render quality controls update runtime state", () => {
    render(<TextureInspector />);
    fireEvent.click(screen.getByRole("button", { name: "final" }));
    fireEvent.click(screen.getByRole("button", { name: "webgl2" }));
    const state = useTexturePatchStore.getState();
    expect(state.patch.quality).toBe("final");
    expect(state.renderPlan.rendererBackend).toBe("webgl2");
  });

  it("header playback and export controls work", () => {
    const onExport = vi.fn();
    render(
      <TextureProHeader
        onExport={onExport}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        isSaving={false}
        isPublishing={false}
        workSlug={null}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(onExport).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(useTexturePatchStore.getState().playback.playing).toBe(false);
  });

  it("operator browser tabs and search filter TOP operators", () => {
    render(<TextureOperatorBrowser />);
    expect(screen.getByRole("button", { name: "Curl Noise" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search Operators"), { target: { value: "glass" } });
    expect(screen.getByRole("button", { name: "Raymarch Glass" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Curl Noise" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "CHOP" }));
    expect(screen.getByText(/reserved for the next domain pass/i)).toBeInTheDocument();
  });

  it("recipe rail loads starter systems", () => {
    render(<TextureRightPanel />);
    const before = useTexturePatchStore.getState().patch.name;
    fireEvent.click(screen.getByRole("button", { name: "Volumetric Veil" }));
    expect(useTexturePatchStore.getState().patch.name).not.toBe(before);
    expect(useTexturePatchStore.getState().patch.name).toBe("Glass Veil");
  });

  it("viewer playback controls toggle and scrub frame", () => {
    const onRuntimeReady = vi.fn();
    render(<TextureViewer plan={useTexturePatchStore.getState().renderPlan} onRuntimeReady={onRuntimeReady} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause playback" }));
    expect(useTexturePatchStore.getState().playback.playing).toBe(false);
    fireEvent.change(screen.getByLabelText("Timeline frame"), { target: { value: "240" } });
    expect(useTexturePatchStore.getState().playback.frame).toBe(240);
  });
});
