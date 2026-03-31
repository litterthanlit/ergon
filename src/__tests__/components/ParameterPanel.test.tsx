import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParameterPanel } from "@/components/studio/ParameterPanel";
import type { ParamSchema } from "@/lib/types";

describe("ParameterPanel", () => {
  const schema: ParamSchema = {
    count: { type: "number", min: 0, max: 100, default: 50, step: 1, label: "Count" },
    palette: { type: "select", options: ["warm", "cool"], default: "warm", label: "Palette" },
    invert: { type: "boolean", default: false, label: "Invert" },
  };

  it("renders a control for each parameter", () => {
    render(<ParameterPanel schema={schema} values={{ count: 50, palette: "warm", invert: false }} onChange={vi.fn()} />);
    expect(screen.getByText("Count")).toBeInTheDocument();
    expect(screen.getByText("Palette")).toBeInTheDocument();
    expect(screen.getByText("Invert")).toBeInTheDocument();
  });

  it("renders nothing when schema is null", () => {
    const { container } = render(<ParameterPanel schema={null} values={{}} onChange={vi.fn()} />);
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it("renders a slider for number params", () => {
    render(<ParameterPanel schema={{ count: schema.count }} values={{ count: 50 }} onChange={vi.fn()} />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("renders a gradient control for gradient params", () => {
    const gradientSchema: ParamSchema = {
      bg: {
        type: "gradient",
        maxStops: 5,
        default: [{ color: "#000", position: 0 }, { color: "#fff", position: 1 }],
        label: "Background",
      },
    };
    render(
      <ParameterPanel
        schema={gradientSchema}
        values={{ bg: [{ color: "#000", position: 0 }, { color: "#fff", position: 1 }] }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByTestId("gradient-bar")).toBeInTheDocument();
  });

  it("renders a curve control for curve params", () => {
    const curveSchema: ParamSchema = {
      ease: { type: "curve", default: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 }, label: "Easing" },
    };
    render(
      <ParameterPanel
        schema={curveSchema}
        values={{ ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 } }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Easing")).toBeInTheDocument();
    expect(screen.getByTestId("curve-editor")).toBeInTheDocument();
  });

  it("renders a range control for range params", () => {
    const rangeSchema: ParamSchema = {
      radius: { type: "range", min: 0, max: 100, default: { min: 20, max: 80 }, label: "Radius" },
    };
    render(
      <ParameterPanel
        schema={rangeSchema}
        values={{ radius: { min: 20, max: 80 } }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Radius")).toBeInTheDocument();
    expect(screen.getByTestId("range-track")).toBeInTheDocument();
  });
});
