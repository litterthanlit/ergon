"use client";

import Link from "next/link";
import { textureCommands, textureRecipes, type TextureCommandId, type TextureRecipeId } from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";

type Props = {
  onSave: () => void;
  onPublish: () => void;
  onExport: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  workSlug: string | null;
};

const recipeTone: Record<string, string> = {
  "liquid-aurora": "from-cyan-300/40 via-violet-300/25 to-black",
  "glass-veil": "from-emerald-200/35 via-slate-200/25 to-black",
  "bloom-signal": "from-amber-200/45 via-rose-300/30 to-black",
  "reaction-field": "from-teal-200/35 via-amber-200/25 to-black",
  "chromatic-smoke": "from-slate-300/30 via-violet-300/28 to-black",
};

export function TextureCommandBar({ onSave, onPublish, onExport, isSaving, isPublishing, workSlug }: Props) {
  const patch = useTexturePatchStore((state) => state.patch);
  const loadRecipe = useTexturePatchStore((state) => state.loadRecipe);
  const applyCommand = useTexturePatchStore((state) => state.applyCommand);

  return (
    <header className="shrink-0 border-b border-white/10 bg-[#07080c]/95 px-3 py-3 backdrop-blur md:px-4">
      <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)_auto]">
        <Link href="/" className="flex items-center gap-3 self-start">
          <span className="flex size-9 items-center justify-center border border-white/15 bg-white/8 font-mono text-xs text-zinc-100 shadow-[inset_0_0_18px_rgba(255,255,255,0.06)]">E</span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.16em] text-zinc-100">Ergon</span>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-cyan-300/70">organic TOP lab</span>
          </span>
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="hidden border border-white/10 bg-white/[0.035] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 md:block">
              {patch.name}
            </div>
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
              {textureRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => loadRecipe(recipe.id as TextureRecipeId)}
                  aria-label={recipe.label}
                  className="group grid min-w-[166px] grid-cols-[42px_1fr] items-center gap-2 border border-white/10 bg-black/38 p-1.5 text-left transition-colors hover:border-cyan-200/35 hover:bg-white/[0.06]"
                  title={recipe.description}
                >
                  <span className={`relative h-10 overflow-hidden bg-gradient-to-br ${recipeTone[recipe.id] ?? "from-zinc-400/30 to-black"}`}>
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.72),transparent_18%),radial-gradient(circle_at_68%_58%,rgba(255,255,255,0.25),transparent_26%)]" />
                    <span className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/70 to-transparent" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-zinc-100">{recipe.label}</span>
                    <span className="block truncate text-[10px] text-zinc-600 group-hover:text-zinc-400">starter system</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="hidden border border-cyan-200/15 bg-cyan-200/[0.055] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cyan-100/80 md:block">
              art direction
            </div>
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1" aria-label="Run local command">
              {textureCommands.map((command) => (
                <button
                  key={command.id}
                  type="button"
                  onClick={() => applyCommand(command.id as TextureCommandId)}
                  className="shrink-0 border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-[11px] text-zinc-300 transition-colors hover:border-cyan-200/35 hover:bg-cyan-200/10 hover:text-cyan-50"
                  title={command.description}
                >
                  {command.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start justify-end gap-2">
          <button type="button" onClick={onExport} className="border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/8">
            Export
          </button>
          <button type="button" onClick={onSave} disabled={isSaving} className="border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/8 disabled:opacity-50">
            {isSaving ? "Saving" : "Save"}
          </button>
          <button type="button" onClick={onPublish} disabled={isPublishing} className="bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50">
            {workSlug ? "Published" : isPublishing ? "Publishing" : "Publish"}
          </button>
        </div>
      </div>
    </header>
  );
}
