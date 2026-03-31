import { describe, it, expect } from "vitest";
import { downloadDataUrl, exportFilename } from "@/lib/export";

describe("export utilities", () => {
  it("downloadDataUrl is a function", () => {
    expect(typeof downloadDataUrl).toBe("function");
  });

  it("exportFilename generates correct format", () => {
    const filename = exportFilename("Drift", "png");
    expect(filename).toMatch(/^ergon-drift-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.png$/);
  });
});
