import { describe, it, expect } from "vitest";
import { recipes, getRecipe } from "@/lib/recipes";
import { getBlock } from "@/lib/blocks";

describe("recipes", () => {
  it("has 5 starter recipes", () => {
    expect(recipes.length).toBe(5);
  });

  it("every recipe has required fields", () => {
    for (const recipe of recipes) {
      expect(recipe.id).toBeTruthy();
      expect(recipe.name).toBeTruthy();
      expect(recipe.description).toBeTruthy();
      expect(recipe.mood).toBeTruthy();
      expect(recipe.blocks.length).toBeGreaterThanOrEqual(2);
      expect(recipe.blocks.length).toBeLessThanOrEqual(4);
      expect(recipe.drivers.palette.length).toBe(5);
      expect(typeof recipe.drivers.seed).toBe("number");
      expect(typeof recipe.drivers.tempo).toBe("number");
    }
  });

  it("every recipe block references a valid block", () => {
    for (const recipe of recipes) {
      for (const rb of recipe.blocks) {
        const block = getBlock(rb.blockId);
        expect(block).toBeDefined();
      }
    }
  });

  it("getRecipe returns correct recipe", () => {
    const aurora = getRecipe("aurora-night");
    expect(aurora).toBeDefined();
    expect(aurora!.name).toBe("Aurora Night");
    expect(aurora!.mood).toBe("dark");
  });

  it("getRecipe returns undefined for unknown id", () => {
    expect(getRecipe("nonexistent")).toBeUndefined();
  });

  it("every recipe has a unique id", () => {
    const ids = recipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("palette colors are valid hex", () => {
    for (const recipe of recipes) {
      for (const color of recipe.drivers.palette) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it("tempo is within valid range", () => {
    for (const recipe of recipes) {
      expect(recipe.drivers.tempo).toBeGreaterThanOrEqual(0);
      expect(recipe.drivers.tempo).toBeLessThanOrEqual(2);
    }
  });
});
