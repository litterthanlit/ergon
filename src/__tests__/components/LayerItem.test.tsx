import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LayerItem } from "@/components/studio/LayerItem";

describe("LayerItem", () => {
  const defaultProps = {
    name: "Drift",
    visible: true,
    opacity: 0.8,
    blendMode: "normal" as const,
    isActive: false,
    onSelect: vi.fn(),
    onToggleVisibility: vi.fn(),
    onOpacityChange: vi.fn(),
    onBlendModeChange: vi.fn(),
    onRemove: vi.fn(),
  };

  it("renders layer name", () => {
    render(<LayerItem {...defaultProps} />);
    expect(screen.getByText("Drift")).toBeInTheDocument();
  });

  it("shows active state", () => {
    const { container } = render(<LayerItem {...defaultProps} isActive={true} />);
    expect(container.querySelector("[data-testid='layer-item']")?.className).toContain("border-ergon-text");
  });

  it("shows opacity value", () => {
    render(<LayerItem {...defaultProps} isActive={true} opacity={0.5} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
