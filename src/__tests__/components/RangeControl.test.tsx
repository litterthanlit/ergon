import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RangeControl } from "@/components/studio/controls/RangeControl";

describe("RangeControl", () => {
  it("renders the label", () => {
    render(
      <RangeControl label="Radius" min={0} max={100} value={{ min: 20, max: 80 }} onChange={vi.fn()} />
    );
    expect(screen.getByText("Radius")).toBeInTheDocument();
  });

  it("renders the range track", () => {
    const { container } = render(
      <RangeControl label="Radius" min={0} max={100} value={{ min: 20, max: 80 }} onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='range-track']")).toBeInTheDocument();
  });

  it("displays current min and max values", () => {
    render(
      <RangeControl label="Radius" min={0} max={100} value={{ min: 20, max: 80 }} onChange={vi.fn()} />
    );
    expect(screen.getByText("20 – 80")).toBeInTheDocument();
  });

  it("calls onChange with updated min when low thumb changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeControl label="Radius" min={0} max={100} step={1} value={{ min: 20, max: 80 }} onChange={onChange} />
    );
    const lowThumb = container.querySelector("[data-testid='range-thumb-low']") as HTMLInputElement;
    fireEvent.change(lowThumb, { target: { value: "30" } });
    expect(onChange).toHaveBeenCalledWith({ min: 30, max: 80 });
  });

  it("calls onChange with updated max when high thumb changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeControl label="Radius" min={0} max={100} step={1} value={{ min: 20, max: 80 }} onChange={onChange} />
    );
    const highThumb = container.querySelector("[data-testid='range-thumb-high']") as HTMLInputElement;
    fireEvent.change(highThumb, { target: { value: "90" } });
    expect(onChange).toHaveBeenCalledWith({ min: 20, max: 90 });
  });

  it("clamps low thumb so it cannot exceed max thumb", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeControl label="Radius" min={0} max={100} step={1} value={{ min: 20, max: 80 }} onChange={onChange} />
    );
    const lowThumb = container.querySelector("[data-testid='range-thumb-low']") as HTMLInputElement;
    fireEvent.change(lowThumb, { target: { value: "90" } });
    // 90 > 80 - step(1) = 79, so clamped to 79
    expect(onChange).toHaveBeenCalledWith({ min: 79, max: 80 });
  });
});
