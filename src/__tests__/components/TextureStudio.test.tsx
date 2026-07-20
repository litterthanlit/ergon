import { ReactFlowProvider } from "@xyflow/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TextureInspector } from "@/components/studio/TextureInspector";
import { TextureNetwork } from "@/components/studio/TextureNetwork";
import { TextureOperatorBrowser } from "@/components/studio/TextureOperatorBrowser";
import { TextureProHeader } from "@/components/studio/TextureProHeader";
import { TextureRightPanel } from "@/components/studio/TextureRightPanel";
import { TextureViewer } from "@/components/studio/TextureViewer";
import { compileTexturePatch, textureRecipes } from "@/lib/texture-patch";
import { createTexturePatchHistory } from "@/lib/texture-patch-history";
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
    history: createTexturePatchHistory(),
    stats: null,
    nodePreviews: {},
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

  it("header quality select updates the patch quality", () => {
    render(
      <TextureProHeader
        onExport={vi.fn()}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        isSaving={false}
        isPublishing={false}
        workSlug={null}
      />
    );

    fireEvent.change(screen.getByLabelText("Preview quality"), { target: { value: "final" } });

    expect(useTexturePatchStore.getState().patch.quality).toBe("final");
  });

  it("operator browser systems and search filter TOP operators", () => {
    render(<TextureOperatorBrowser />);
    expect(screen.getByRole("button", { name: /Systems/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "TOP" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "CHOP" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Depth/ }));
    fireEvent.change(screen.getByLabelText("Search Operators"), { target: { value: "glass" } });
    expect(screen.getByRole("button", { name: "Raymarch Glass" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Curl Noise" })).not.toBeInTheDocument();
  });

  it("graph pane accepts a resizable height instead of a fixed 240px strip", () => {
    const { container } = render(
      <ReactFlowProvider>
        <TextureNetwork heightPx={320} />
      </ReactFlowProvider>
    );
    const network = container.querySelector('[data-testid="texture-network"]');
    expect(network).toBeTruthy();
    expect((network as HTMLElement).style.height).toBe("320px");
    expect(network?.className.includes("h-[240px]")).toBe(false);
  });

  it("recipe rail loads starter systems", () => {
    render(<TextureRightPanel />);
    const before = useTexturePatchStore.getState().patch.name;
    fireEvent.click(screen.getByRole("button", { name: "recipe" }));
    fireEvent.click(screen.getByRole("button", { name: "Volumetric Veil" }));
    expect(useTexturePatchStore.getState().patch.name).not.toBe(before);
    expect(useTexturePatchStore.getState().patch.name).toBe("Glass Veil");
  });

  it("viewer scrub changes frame", () => {
    const onRuntimeReady = vi.fn();
    render(<TextureViewer plan={useTexturePatchStore.getState().renderPlan} onRuntimeReady={onRuntimeReady} />);
    fireEvent.change(screen.getByLabelText("Timeline frame"), { target: { value: "240" } });
    expect(useTexturePatchStore.getState().playback.frame).toBe(240);
    expect(useTexturePatchStore.getState().playback.playing).toBe(false);
  });

  it("graph controls duplicate, delete, and disconnect real patch data", () => {
    render(
      <ReactFlowProvider>
        <TextureNetwork />
      </ReactFlowProvider>
    );

    const initialNodeCount = useTexturePatchStore.getState().patch.nodes.length;
    fireEvent.click(screen.getByRole("button", { name: "Duplicate node" }));
    expect(useTexturePatchStore.getState().patch.nodes).toHaveLength(initialNodeCount + 1);

    fireEvent.click(screen.getByRole("button", { name: "Delete node" }));
    expect(useTexturePatchStore.getState().patch.nodes).toHaveLength(initialNodeCount);

    const initialEdgeCount = useTexturePatchStore.getState().patch.edges.length;
    fireEvent.change(screen.getByLabelText("Selected cable"), { target: { value: "curl-1:advection-1:in1" } });
    fireEvent.click(screen.getByRole("button", { name: "Disconnect cable" }));
    expect(useTexturePatchStore.getState().patch.edges).toHaveLength(initialEdgeCount - 1);
    expect(useTexturePatchStore.getState().patch.edges.some((edge) => edge.id === "curl-1:advection-1:in1")).toBe(false);
  });

  it("does not delete the only Out TOP", () => {
    useTexturePatchStore.getState().setSelectedNode("out-1");
    render(
      <ReactFlowProvider>
        <TextureNetwork />
      </ReactFlowProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete node" }));

    expect(useTexturePatchStore.getState().patch.nodes.filter((node) => node.type === "out")).toHaveLength(1);
  });

  it("does not render fake controls", () => {
    const noop = vi.fn();
    const { rerender } = render(
      <TextureProHeader
        onExport={noop}
        onSave={noop}
        onPublish={noop}
        isSaving={false}
        isPublishing={false}
        workSlug={null}
      />
    );

    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play preview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Studio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Graph" })).not.toBeInTheDocument();

    rerender(<TextureRightPanel />);
    expect(screen.queryByText("Expose to Look")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Replace Node/ })).not.toBeInTheDocument();

    rerender(<TextureOperatorBrowser />);
    expect(screen.queryByRole("button", { name: "Node Library" })).not.toBeInTheDocument();
  });
});
