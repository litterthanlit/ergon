import { beforeEach, describe, expect, it, vi } from "vitest";
import { textureRecipes } from "@/lib/texture-patch";
import type { WorkDocument } from "@/lib/work-document";

const mockState = vi.hoisted(() => ({
  supabase: null as unknown,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(async () => mockState.supabase),
}));

import { saveWork } from "@/lib/actions/works";

type QueryChain = {
  error: null;
  eq: ReturnType<typeof vi.fn>;
};

function createQueryChain(): QueryChain {
  const chain: QueryChain = {
    error: null,
    eq: vi.fn(() => chain),
  };
  return chain;
}

function createSupabaseMock() {
  const inserts: unknown[] = [];
  const updates: unknown[] = [];
  const eqCalls: unknown[][] = [];
  const uploads: unknown[][] = [];

  const updateChain = createQueryChain();
  updateChain.eq.mockImplementation((...args: unknown[]) => {
    eqCalls.push(args);
    return updateChain;
  });

  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    },
    from: vi.fn(() => ({
      insert: vi.fn((payload: unknown) => {
        inserts.push(payload);
        return {
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: { id: "work-1" }, error: null })),
          })),
        };
      }),
      update: vi.fn((payload: unknown) => {
        updates.push(payload);
        return updateChain;
      }),
      select: vi.fn(() => updateChain),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async (...args: unknown[]) => {
          uploads.push(args);
          return { error: null };
        }),
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://cdn.example/${path}` },
        })),
      })),
    },
  };

  return { supabase, inserts, updates, eqCalls, uploads };
}

describe("work persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves texture documents with engine fields and uploads thumbnails", async () => {
    const { supabase, inserts, updates, uploads } = createSupabaseMock();
    mockState.supabase = supabase;
    const patch = textureRecipes[0].create();
    const document: WorkDocument = {
      engine: "texture-patch",
      version: 1,
      patch,
      exposedControls: [],
      seeds: { seed: 18 },
    };

    const result = await saveWork({
      title: "Liquid Aurora",
      document,
      thumbnailDataUrl: "data:image/png;base64,aGVsbG8=",
    });

    expect(result).toEqual({ id: "work-1", thumbnailUrl: "https://cdn.example/user-1/work-1/thumb.png" });
    expect(inserts[0]).toMatchObject({
      user_id: "user-1",
      title: "Liquid Aurora",
      engine: "texture-patch",
      document_version: 1,
      template_id: "texture-patch",
      document,
    });
    expect(uploads[0][0]).toBe("user-1/work-1/thumb.png");
    expect(uploads[0][2]).toMatchObject({ contentType: "image/png", upsert: true });
    expect(updates.at(-1)).toMatchObject({
      thumbnail_url: "https://cdn.example/user-1/work-1/thumb.png",
    });
  });

  it("updates existing works with owner constraints", async () => {
    const { supabase, updates, eqCalls } = createSupabaseMock();
    mockState.supabase = supabase;
    const document: WorkDocument = {
      engine: "p5-sketch",
      version: 1,
      code: "function draw() {}",
      templateId: "drift",
      params: { density: 400 },
    };

    const result = await saveWork({
      id: "work-99",
      title: "Updated Sketch",
      document,
    });

    expect(result).toEqual({ id: "work-99" });
    expect(updates[0]).toMatchObject({
      title: "Updated Sketch",
      engine: "p5-sketch",
      document_version: 1,
      code: "function draw() {}",
      template_id: "drift",
      params: { density: 400 },
    });
    expect(eqCalls).toContainEqual(["id", "work-99"]);
    expect(eqCalls).toContainEqual(["user_id", "user-1"]);
  });
});
