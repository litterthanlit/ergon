import { describe, it, expect } from "vitest";
import type { Profile, Work, WorkWithProfile } from "@/lib/supabase/types";

describe("Supabase types", () => {
  it("Profile type has required fields", () => {
    const profile: Profile = {
      id: "uuid",
      username: "artist",
      display_name: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(profile.username).toBe("artist");
  });

  it("Work type has required fields", () => {
    const work: Work = {
      id: "uuid",
      user_id: "uuid",
      title: "Untitled",
      code: "function setup() {}",
      template_id: "drift",
      params: { density: 2000 },
      is_published: false,
      slug: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(work.title).toBe("Untitled");
    expect(work.is_published).toBe(false);
  });

  it("WorkWithProfile includes profile data", () => {
    const work: WorkWithProfile = {
      id: "uuid",
      user_id: "uuid",
      title: "My Work",
      code: "",
      template_id: null,
      params: null,
      is_published: true,
      slug: "my-work-abc",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      profiles: { username: "artist", display_name: "The Artist" },
    };
    expect(work.profiles.username).toBe("artist");
  });
});
