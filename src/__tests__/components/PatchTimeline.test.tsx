import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PatchTimeline } from "@/components/studio/PatchTimeline";
import { compilePatchToRenderPlan, createDefaultPatch } from "@/lib/visual-patch";
import { useVisualPatchStore } from "@/lib/visual-patch-store";

describe("PatchTimeline", () => {
  beforeEach(() => {
    const patch = createDefaultPatch();
    useVisualPatchStore.setState({
      patch,
      renderPlan: compilePatchToRenderPlan(patch),
    });
  });

  it("scrubs the patch time", () => {
    render(<PatchTimeline />);
    const scrubber = screen.getByLabelText("Timeline scrubber");
    fireEvent.change(scrubber, { target: { value: "4" } });
    expect(useVisualPatchStore.getState().patch.currentTime).toBe(4);
  });

  it("toggles playback", () => {
    render(<PatchTimeline />);
    fireEvent.click(screen.getByLabelText("Play timeline"));
    expect(useVisualPatchStore.getState().patch.isPlaying).toBe(true);
  });
});
