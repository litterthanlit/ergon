import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TextureCommandBar } from "@/components/studio/TextureCommandBar";
import { TextureInspector } from "@/components/studio/TextureInspector";
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

  it("command palette applies a deterministic mutation", () => {
    render(
      <TextureCommandBar
        onExport={vi.fn()}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        isSaving={false}
        isPublishing={false}
        workSlug={null}
      />
    );
    const originalBloom = useTexturePatchStore.getState().patch.nodes.find((node) => node.type === "bloom");
    fireEvent.click(screen.getByRole("button", { name: "Increase bloom" }));
    const bloom = useTexturePatchStore.getState().patch.nodes.find((node) => node.type === "bloom");
    expect(bloom?.params.strength).toBeGreaterThan(originalBloom?.params.strength as number);
  });

  it("adds an operator from the command bar", () => {
    render(
      <TextureCommandBar
        onExport={vi.fn()}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        isSaving={false}
        isPublishing={false}
        workSlug={null}
      />
    );
    const before = useTexturePatchStore.getState().patch.name;
    fireEvent.click(screen.getByRole("button", { name: "Glass Veil" }));
    expect(useTexturePatchStore.getState().patch.name).not.toBe(before);
  });
});
