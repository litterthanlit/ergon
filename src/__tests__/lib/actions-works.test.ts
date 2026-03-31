import { describe, it, expect } from "vitest";

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "work"}-${suffix}`;
}

describe("generateSlug", () => {
  it("converts title to lowercase slug with suffix", () => {
    const slug = generateSlug("My Cool Art");
    expect(slug).toMatch(/^my-cool-art-[a-z0-9]+$/);
  });

  it("handles empty title", () => {
    const slug = generateSlug("");
    expect(slug).toMatch(/^work-[a-z0-9]+$/);
  });

  it("strips special characters", () => {
    const slug = generateSlug("Art @#$ Test!!!");
    expect(slug).toMatch(/^art-test-[a-z0-9]+$/);
  });

  it("truncates long titles", () => {
    const slug = generateSlug("This is a very long title that should be truncated to thirty characters max");
    const base = slug.split("-").slice(0, -1).join("-");
    expect(base.length).toBeLessThanOrEqual(30);
  });
});
