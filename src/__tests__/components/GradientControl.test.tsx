import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GradientControl } from "@/components/studio/controls/GradientControl";

const defaultStops = [
  { color: "#000000", position: 0 },
  { color: "#ffffff", position: 1 },
];

describe("GradientControl", () => {
  it("renders the label", () => {
    render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={vi.fn()} />
    );
    expect(screen.getByText("Gradient")).toBeInTheDocument();
  });

  it("renders the gradient bar", () => {
    const { container } = render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='gradient-bar']")).toBeInTheDocument();
  });

  it("renders a handle for each stop", () => {
    const { container } = render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='gradient-handle-0']")).toBeInTheDocument();
    expect(container.querySelector("[data-testid='gradient-handle-1']")).toBeInTheDocument();
  });

  it("shows stop count", () => {
    render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={vi.fn()} />
    );
    expect(screen.getByText("2 stops")).toBeInTheDocument();
  });

  it("calls onChange when a stop color is changed via picker", () => {
    const onChange = vi.fn();
    const { container } = render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={onChange} />
    );
    // Click the first handle to open the color picker
    const handle = container.querySelector("[data-testid='gradient-handle-0']") as HTMLElement;
    fireEvent.click(handle);
    const picker = screen.getByTestId("gradient-color-picker");
    fireEvent.change(picker, { target: { value: "#ff0000" } });
    expect(onChange).toHaveBeenCalledWith([
      { color: "#ff0000", position: 0 },
      { color: "#ffffff", position: 1 },
    ]);
  });

  it("does not remove a stop when only 2 remain (double-click)", () => {
    const onChange = vi.fn();
    const { container } = render(
      <GradientControl label="Gradient" maxStops={5} value={defaultStops} onChange={onChange} />
    );
    const handle = container.querySelector("[data-testid='gradient-handle-0']") as HTMLElement;
    fireEvent.dblClick(handle);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a stop on double-click when more than 2 exist", () => {
    const onChange = vi.fn();
    const threeStops = [
      { color: "#000000", position: 0 },
      { color: "#888888", position: 0.5 },
      { color: "#ffffff", position: 1 },
    ];
    const { container } = render(
      <GradientControl label="Gradient" maxStops={5} value={threeStops} onChange={onChange} />
    );
    const handle = container.querySelector("[data-testid='gradient-handle-1']") as HTMLElement;
    fireEvent.dblClick(handle);
    expect(onChange).toHaveBeenCalledWith([
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ]);
  });
});
