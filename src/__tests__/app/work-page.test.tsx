import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { textureRecipes } from "@/lib/texture-patch";
import type { WorkWithProfile } from "@/lib/supabase/types";

const pageState = vi.hoisted(() => ({
  work: undefined as WorkWithProfile | undefined,
}));

vi.mock("@/lib/actions/works", () => ({
  getPublishedWork: vi.fn(async () => ({ work: pageState.work })),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import WorkPage from "@/app/work/[slug]/page";

function publishedWork(overrides: Partial<WorkWithProfile>): WorkWithProfile {
  return {
    id: "work-1",
    user_id: "user-1",
    title: "Published Work",
    code: "function setup() {}",
    template_id: "drift",
    params: null,
    engine: null,
    document_version: null,
    document: null,
    thumbnail_url: null,
    is_published: true,
    slug: "published-work",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    profiles: { username: "artist", display_name: "Artist" },
    ...overrides,
  };
}

describe("published work page", () => {
  it("renders texture patch documents with the texture renderer", async () => {
    const patch = textureRecipes[0].create();
    pageState.work = publishedWork({
      engine: "texture-patch",
      document_version: 1,
      document: {
        engine: "texture-patch",
        version: 1,
        patch,
        exposedControls: [],
        seeds: {},
      },
    });

    render(await WorkPage({ params: Promise.resolve({ slug: "published-work" }) }));

    expect(screen.getByTestId("published-texture-renderer")).toBeInTheDocument();
    expect(screen.queryByTitle("Published Work")).not.toBeInTheDocument();
  });

  it("keeps legacy p5 sketches in the sandbox iframe", async () => {
    pageState.work = publishedWork({
      code: "function draw() {}",
      template_id: "drift",
      params: { density: 40 },
    });

    render(await WorkPage({ params: Promise.resolve({ slug: "published-work" }) }));

    const iframe = screen.getByTitle("Published Work");
    expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
    expect(iframe).toHaveAttribute("src", expect.stringContaining("/sandbox/index.html#code="));
    expect(screen.queryByTestId("published-texture-renderer")).not.toBeInTheDocument();
  });
});
