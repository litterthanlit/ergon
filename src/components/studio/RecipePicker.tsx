"use client";

import { recipes } from "@/lib/recipes";
import { useStudioStore } from "@/lib/store";

const moodColors: Record<string, string> = {
  dark: "#0a0a2e",
  light: "#f5f0eb",
  warm: "#e8b931",
  cool: "#0088ff",
  minimal: "#f5f5f0",
  maximal: "#ff006e",
};

export function RecipePicker() {
  const loadRecipe = useStudioStore((s) => s.loadRecipe);
  const activeRecipe = useStudioStore((s) => s.activeRecipe);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-ergon-muted">
        Pick a recipe to start composing. Each is a curated stack of blocks.
      </p>
      <div className="flex flex-col gap-3">
        {recipes.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => loadRecipe(recipe)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              activeRecipe?.id === recipe.id
                ? "border-ergon-text bg-ergon-surface"
                : "border-ergon-border hover:border-ergon-muted hover:bg-ergon-surface/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: moodColors[recipe.mood] || "#888" }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-ergon-text block">{recipe.name}</span>
                <span className="text-xs text-ergon-muted mt-1 block">{recipe.description}</span>
              </div>
              <span className="text-[10px] font-mono text-ergon-muted shrink-0">
                {recipe.blocks.length} blocks
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
