import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateSwitcher } from "@/components/studio/TemplateSwitcher";

describe("TemplateSwitcher", () => {
  it("renders all template names", () => {
    render(<TemplateSwitcher activeId="drift" onSelect={vi.fn()} />);
    expect(screen.getByText("Drift")).toBeInTheDocument();
    expect(screen.getByText("Grid")).toBeInTheDocument();
    expect(screen.getByText("Pulse")).toBeInTheDocument();
    expect(screen.getByText("Scatter")).toBeInTheDocument();
    expect(screen.getByText("Weave")).toBeInTheDocument();
  });

  it("highlights the active template", () => {
    render(<TemplateSwitcher activeId="drift" onSelect={vi.fn()} />);
    const driftButton = screen.getByText("Drift").closest("button");
    expect(driftButton?.className).toContain("text-white");
  });

  it("calls onSelect when a template is clicked", () => {
    const onSelect = vi.fn();
    render(<TemplateSwitcher activeId="drift" onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Grid"));
    expect(onSelect).toHaveBeenCalledWith("grid");
  });
});
