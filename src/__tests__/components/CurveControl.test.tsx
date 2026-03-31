import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CurveControl } from "@/components/studio/controls/CurveControl";

const defaultValue = { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 };

describe("CurveControl", () => {
  it("renders the label", () => {
    render(<CurveControl label="Easing" value={defaultValue} onChange={vi.fn()} />);
    expect(screen.getByText("Easing")).toBeInTheDocument();
  });

  it("renders the SVG editor", () => {
    const { container } = render(
      <CurveControl label="Easing" value={defaultValue} onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='curve-editor']")).toBeInTheDocument();
  });

  it("renders both control point handles", () => {
    const { container } = render(
      <CurveControl label="Easing" value={defaultValue} onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='curve-handle-1']")).toBeInTheDocument();
    expect(container.querySelector("[data-testid='curve-handle-2']")).toBeInTheDocument();
  });

  it("calls onChange with updated p1 position on pointer move while dragging handle 1", () => {
    const onChange = vi.fn();
    const { container } = render(
      <CurveControl label="Easing" value={defaultValue} onChange={onChange} />
    );
    const handle = container.querySelector("[data-testid='curve-handle-1']") as SVGCircleElement;
    const svg = container.querySelector("[data-testid='curve-editor']") as SVGSVGElement;

    // Mock getBoundingClientRect
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 120, height: 120, right: 120, bottom: 120, x: 0, y: 0, toJSON: () => {},
    } as DOMRect);

    handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 42, clientY: 42 }));
    svg.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 60, clientY: 60 }));
    expect(onChange).toHaveBeenCalled();
  });
});
