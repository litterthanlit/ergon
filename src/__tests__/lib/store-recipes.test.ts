import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { transformSync } from "esbuild";
import { Module } from "module";

// store.ts calls require("./blocks") at runtime (CJS-style dynamic require to
// avoid a circular import). Vitest's injected require() uses Node's native
// resolver, which doesn't resolve .ts files by default.
// Register a .ts extension handler so require("./blocks") can load blocks.ts.
// @ts-expect-error – Module._extensions is a private API
if (!Module._extensions[".ts"]) {
  // @ts-expect-error – Module._extensions is a private API
  Module._extensions[".ts"] = function (
    // @ts-expect-error – private Module type
    mod: { _compile: (code: string, filename: string) => void },
    filename: string
  ) {
    const src = readFileSync(filename, "utf-8");
    const result = transformSync(src, { loader: "ts", format: "cjs" });
    mod._compile(result.code, filename);
  };
}

import { useStudioStore } from "@/lib/store";
import { recipes } from "@/lib/recipes";

describe("store recipe actions", () => {
  beforeEach(() => {
    // Reset store to initial state
    useStudioStore.setState({
      compositionMode: false,
      layers: [],
      activeLayerIndex: 0,
      activeRecipe: null,
      soloLayerId: null,
      presoloVisibility: {},
    });
  });

  it("loadRecipe enters composition mode", () => {
    const recipe = recipes[0];
    useStudioStore.getState().loadRecipe(recipe);
    const state = useStudioStore.getState();
    expect(state.compositionMode).toBe(true);
    expect(state.activeRecipe?.id).toBe(recipe.id);
  });

  it("loadRecipe creates correct number of layers", () => {
    const recipe = recipes[0]; // Aurora Night has 3 blocks
    useStudioStore.getState().loadRecipe(recipe);
    const state = useStudioStore.getState();
    expect(state.layers.length).toBe(recipe.blocks.length);
  });

  it("loadRecipe sets shared drivers", () => {
    const recipe = recipes[0];
    useStudioStore.getState().loadRecipe(recipe);
    const state = useStudioStore.getState();
    expect(state.sharedDrivers.palette).toEqual(recipe.drivers.palette);
    expect(state.sharedDrivers.seed).toBe(recipe.drivers.seed);
    expect(state.sharedDrivers.tempo).toBe(recipe.drivers.tempo);
  });

  it("loadRecipe layers have correct roles", () => {
    const recipe = recipes[0];
    useStudioStore.getState().loadRecipe(recipe);
    const state = useStudioStore.getState();
    recipe.blocks.forEach((rb, i) => {
      expect(state.layers[i].role).toBe(rb.role);
    });
  });

  it("setSharedDrivers merges partial updates", () => {
    const recipe = recipes[0];
    useStudioStore.getState().loadRecipe(recipe);
    useStudioStore.getState().setSharedDrivers({ tempo: 2.0 });
    const state = useStudioStore.getState();
    expect(state.sharedDrivers.tempo).toBe(2.0);
    expect(state.sharedDrivers.palette).toEqual(recipe.drivers.palette);
  });

  it("soloLayer mutes others", () => {
    const recipe = recipes[0];
    useStudioStore.getState().loadRecipe(recipe);
    const layers = useStudioStore.getState().layers;
    useStudioStore.getState().soloLayer(layers[0].id);
    const state = useStudioStore.getState();
    expect(state.layers[0].visible).toBe(true);
    for (let i = 1; i < state.layers.length; i++) {
      expect(state.layers[i].visible).toBe(false);
    }
    expect(state.soloLayerId).toBe(layers[0].id);
  });

  it("soloLayer toggle restores visibility", () => {
    const recipe = recipes[0];
    useStudioStore.getState().loadRecipe(recipe);
    const layers = useStudioStore.getState().layers;
    // Solo then unsolo same layer
    useStudioStore.getState().soloLayer(layers[0].id);
    useStudioStore.getState().soloLayer(layers[0].id);
    const state = useStudioStore.getState();
    expect(state.soloLayerId).toBeNull();
    // All should be visible again
    for (const layer of state.layers) {
      expect(layer.visible).toBe(true);
    }
  });

  it("unsoloAll restores visibility", () => {
    const recipe = recipes[0];
    useStudioStore.getState().loadRecipe(recipe);
    const layers = useStudioStore.getState().layers;
    useStudioStore.getState().soloLayer(layers[0].id);
    useStudioStore.getState().unsoloAll();
    const state = useStudioStore.getState();
    expect(state.soloLayerId).toBeNull();
  });
});
