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
});
