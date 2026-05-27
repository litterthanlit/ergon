import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Work } from "@/lib/supabase/types";

const cardState = vi.hoisted(() => ({
  works: [] as unknown[],
  artistWorks: [] as Work[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(async () => ({ data: cardState.works, error: null })),
          })),
        })),
      })),
    })),
  })),
}));

vi.mock("@/lib/actions/works", () => ({
  getArtistWorks: vi.fn(async () => ({
    profile: { username: "artist", display_name: "Artist", created_at: "2026-01-01T00:00:00Z" },
    works: cardState.artistWorks,
  })),
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

import HomePage from "@/app/page";
import ArtistPage from "@/app/artist/[username]/page";

function work(overrides: Partial<Work>): Work {
  return {
    id: "work-1",
    user_id: "user-1",
    title: "Thumbnail Work",
    code: "",
    template_id: "texture-patch",
    params: null,
    engine: "texture-patch",
    document_version: 1,
    document: null,
    thumbnail_url: "https://cdn.example/thumb.png",
    is_published: true,
    slug: "thumbnail-work",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("published work cards", () => {
  it("shows home card thumbnails when available", async () => {
    cardState.works = [{ ...work({}), profiles: { username: "artist", display_name: "Artist" } }];

    render(await HomePage());

    expect(screen.getByRole("img", { name: "Thumbnail Work preview" })).toHaveAttribute(
      "src",
      "https://cdn.example/thumb.png"
    );
  });

  it("shows artist card thumbnails when available", async () => {
    cardState.artistWorks = [work({})];

    render(await ArtistPage({ params: Promise.resolve({ username: "artist" }) }));

    expect(screen.getByRole("img", { name: "Thumbnail Work preview" })).toHaveAttribute(
      "src",
      "https://cdn.example/thumb.png"
    );
  });
});
