import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Canvas } from "@/components/studio/Canvas";

// Mock the store
vi.mock("@/lib/store", () => ({
  useStudioStore: vi.fn((selector) => {
    const state = {
      code: "function draw() {}",
      values: { count: 50 },
      setSchema: vi.fn(),
      setStatus: vi.fn(),
      setError: vi.fn(),
    };
    return selector(state);
  }),
}));

describe("Canvas", () => {
  it("renders an iframe with sandbox attributes", () => {
    render(<Canvas />);
    const iframe = screen.getByTitle("Ergon Sandbox");
    expect(iframe).toBeInTheDocument();
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute("sandbox");
  });

  it("iframe has correct sandbox permissions", () => {
    render(<Canvas />);
    const iframe = screen.getByTitle("Ergon Sandbox");
    const sandbox = iframe.getAttribute("sandbox");
    expect(sandbox).toContain("allow-scripts");
  });

  it("iframe points to sandbox URL", () => {
    render(<Canvas />);
    const iframe = screen.getByTitle("Ergon Sandbox");
    expect(iframe).toHaveAttribute("src", "/sandbox/index.html");
  });
});
