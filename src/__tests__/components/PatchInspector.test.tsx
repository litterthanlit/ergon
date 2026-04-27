import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PatchInspector } from "@/components/studio/PatchInspector";
import { compilePatchToRenderPlan, createDefaultPatch } from "@/lib/visual-patch";
import { useVisualPatchStore } from "@/lib/visual-patch-store";

describe("PatchInspector", () => {
  beforeEach(() => {
    const patch = createDefaultPatch();
    useVisualPatchStore.setState({
      patch,
      renderPlan: compilePatchToRenderPlan(patch),
    });
  });

  it("renders the selected node controls", () => {
    render(<PatchInspector />);
    expect(screen.getByText("Flow Motion")).toBeInTheDocument();
    expect(screen.getByText("Node parameters")).toBeInTheDocument();
  });

  it("changes when node selection changes", () => {
    useVisualPatchStore.getState().setSelectedNode("color-1");
    render(<PatchInspector />);
    expect(screen.getByText("Aurora Color")).toBeInTheDocument();
  });

  it("adds a keyframe for a selected parameter", () => {
    render(<PatchInspector />);
    fireEvent.click(screen.getAllByText("set key")[0]);
    expect(useVisualPatchStore.getState().patch.tracks.length).toBeGreaterThan(1);
  });
});
