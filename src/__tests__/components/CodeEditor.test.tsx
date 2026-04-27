import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CodeEditor } from "@/components/studio/CodeEditor";

describe("CodeEditor", () => {
  it("renders a container element", () => {
    const { container } = render(
      <CodeEditor code="function draw() {}" onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='code-editor']")).toBeInTheDocument();
  });

  it("accepts code prop", () => {
    const { container } = render(
      <CodeEditor code="// hello" onChange={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='code-editor']")).toBeInTheDocument();
  });
});
