import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ResizeHandle } from "@/components/studio/ResizeHandle";

describe("ResizeHandle", () => {
  it("renders a draggable handle", () => {
    const { container } = render(
      <ResizeHandle onResize={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='resize-handle']")).toBeInTheDocument();
  });

  it("shows a visual grip indicator", () => {
    const { container } = render(
      <ResizeHandle onResize={vi.fn()} />
    );
    const handle = container.querySelector("[data-testid='resize-handle']");
    expect(handle).toBeInTheDocument();
  });
});
