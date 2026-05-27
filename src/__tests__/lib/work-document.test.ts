import { describe, expect, it } from "vitest";
import { parseWorkDocument } from "@/lib/work-document";
import { textureRecipes } from "@/lib/texture-patch";
import type { Work } from "@/lib/supabase/types";

function baseWork(overrides: Partial<Work>): Work {
  return {
    id: "work-1",
    user_id: "user-1",
    title: "Untitled",
    code: "",
    template_id: null,
    params: null,
    engine: null,
    document_version: null,
    document: null,
    thumbnail_url: null,
    is_published: false,
    slug: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("work documents", () => {
  it("parses a stored texture patch document", () => {
    const patch = textureRecipes[0].create();
    const document = parseWorkDocument(
      baseWork({
        engine: "texture-patch",
        document_version: 1,
        document: {
          engine: "texture-patch",
          version: 1,
          patch,
          exposedControls: [],
          seeds: { seed: 42 },
        },
      })
    );

    expect(document.engine).toBe("texture-patch");
    if (document.engine === "texture-patch") {
      expect(document.patch.name).toBe("Liquid Aurora");
      expect(document.exposedControls).toEqual([]);
      expect(document.seeds.seed).toBe(42);
    }
  });

  it("parses a stored p5 sketch document", () => {
    const document = parseWorkDocument(
      baseWork({
        engine: "p5-sketch",
        document_version: 1,
        document: {
          engine: "p5-sketch",
          version: 1,
          code: "function setup() {}",
          templateId: "drift",
          params: { density: 2000 },
        },
      })
    );

    expect(document).toMatchObject({
      engine: "p5-sketch",
      version: 1,
      code: "function setup() {}",
      templateId: "drift",
      params: { density: 2000 },
    });
  });

  it("migrates legacy p5 rows from code/template/params", () => {
    const document = parseWorkDocument(
      baseWork({
        code: "function draw() {}",
        template_id: "grid",
        params: { count: 40 },
      })
    );

    expect(document).toMatchObject({
      engine: "p5-sketch",
      version: 1,
      code: "function draw() {}",
      templateId: "grid",
      params: { count: 40 },
    });
  });

  it("recovers legacy texture patches saved as JSON code", () => {
    const patch = textureRecipes[1].create();
    const document = parseWorkDocument(
      baseWork({
        code: JSON.stringify(patch),
        template_id: "texture-patch",
        params: { patch },
      })
    );

    expect(document.engine).toBe("texture-patch");
    if (document.engine === "texture-patch") {
      expect(document.patch.name).toBe("Glass Veil");
    }
  });
});
