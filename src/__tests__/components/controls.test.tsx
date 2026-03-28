import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SliderControl } from "@/components/studio/controls/SliderControl";
import { SelectControl } from "@/components/studio/controls/SelectControl";
import { ToggleControl } from "@/components/studio/controls/ToggleControl";

describe("SliderControl", () => {
  it("renders with label and current value", () => {
    render(<SliderControl label="Count" min={0} max={100} step={1} value={50} onChange={vi.fn()} />);
    expect(screen.getByText("Count")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("calls onChange when slider moves", () => {
    const onChange = vi.fn();
    render(<SliderControl label="Count" min={0} max={100} step={1} value={50} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "75" } });
    expect(onChange).toHaveBeenCalledWith(75);
  });
});

describe("SelectControl", () => {
  it("renders options", () => {
    render(<SelectControl label="Palette" options={["warm", "cool"]} value="warm" onChange={vi.fn()} />);
    expect(screen.getByText("Palette")).toBeInTheDocument();
    expect(screen.getByText("warm")).toBeInTheDocument();
    expect(screen.getByText("cool")).toBeInTheDocument();
  });
});

describe("ToggleControl", () => {
  it("renders label and toggle", () => {
    render(<ToggleControl label="Invert" value={false} onChange={vi.fn()} />);
    expect(screen.getByText("Invert")).toBeInTheDocument();
  });

  it("calls onChange when toggled", () => {
    const onChange = vi.fn();
    render(<ToggleControl label="Invert" value={false} onChange={onChange} />);
    const toggle = screen.getByRole("checkbox");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
