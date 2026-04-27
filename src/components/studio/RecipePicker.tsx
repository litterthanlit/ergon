"use client";

import { BLOCK_ROLES, ROLE_LABELS } from "@/lib/blocks";
import { recipes } from "@/lib/recipes";
import { useStudioStore } from "@/lib/store";

const moodStyles: Record<string, { accent: string }> = {
  dark: { accent: "#7dd3fc" },
  light: { accent: "#c4362c" },
  warm: { accent: "#7c3f00" },
  cool: { accent: "#2563eb" },
  minimal: { accent: "#4a5568" },
  maximal: { accent: "#ff99c8" },
};

export function RecipePicker() {
  const loadRecipe = useStudioStore((s) => s.loadRecipe);
  const activeRecipe = useStudioStore((s) => s.activeRecipe);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-ergon-text">
          Start with a recipe.
        </p>
        <p className="text-xs leading-relaxed text-ergon-muted">
          Each one is a curated composition with its own balance of {BLOCK_ROLES.length} material roles.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {recipes.map((recipe) => (
          <button
            type="button"
            key={recipe.id}
            onClick={() => loadRecipe(recipe)}
            className={`group relative overflow-hidden rounded-2xl border text-left transition-all cursor-pointer ${
              activeRecipe?.id === recipe.id
                ? "border-ergon-text bg-white shadow-[0_14px_30px_rgba(10,22,40,0.08)]"
                : "border-ergon-border bg-white/70 hover:border-ergon-muted hover:bg-white hover:shadow-[0_10px_24px_rgba(10,22,40,0.04)]"
            }`}
          >
            <div className="relative p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-4 ring-white/65"
                    style={{ backgroundColor: moodStyles[recipe.mood]?.accent ?? "#888" }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ergon-muted">
                    {recipe.mood}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-ergon-muted shrink-0">
                  {recipe.blocks.length} blocks
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                <span className="block text-base font-semibold text-ergon-text">
                  {recipe.name}
                </span>
                <span className="block text-sm leading-relaxed text-ergon-subtle">
                  {recipe.description}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {Array.from(new Set(recipe.blocks.map((block) => block.role))).map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-ergon-border/70 bg-ergon-surface/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ergon-subtle"
                  >
                    {ROLE_LABELS[role]}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-ergon-border/70 pt-3">
                <span className="text-[11px] text-ergon-muted">
                  Shared drivers already tuned in.
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ergon-text/70 transition-colors group-hover:text-ergon-text">
                  Load
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
