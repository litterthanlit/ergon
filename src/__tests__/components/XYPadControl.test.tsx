import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { XYPadControl } from "@/components/studio/controls/XYPadControl";

describe("XYPadControl", () => {
  it("renders the pad with a label", () => {
    render(
      <XYPadControl
        label="Position"
        minX={0} maxX={1} minY={0} maxY={1}
        value={{ x: 0.5, y: 0.5 }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Position")).toBeInTheDocument();
  });

  it("renders the crosshair indicator", () => {
    const { container } = render(
      <XYPadControl
        label="Force"
        minX={-1} maxX={1} minY={-1} maxY={1}
        value={{ x: 0, y: 0 }}
        onChange={vi.fn()}
      />
    );
    expect(container.querySelector("[data-testid='xy-pad']")).toBeInTheDocument();
    expect(container.querySelector("[data-testid='xy-crosshair']")).toBeInTheDocument();
  });

  it("displays current values", () => {
    render(
      <XYPadControl
        label="Offset"
        minX={0} maxX={100} minY={0} maxY={100}
        value={{ x: 25, y: 75 }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("25, 75")).toBeInTheDocument();
  });
});
