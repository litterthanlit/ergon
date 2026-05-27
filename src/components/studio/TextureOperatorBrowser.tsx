"use client";

import {
  searchTextureOperators,
  textureStarters,
  type TextureRecipeId,
  type TextureOperatorType,
} from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";

const systemGroups = [
  { label: "Sources", icon: "⌘", query: "noise" },
  { label: "Motion", icon: "⌁", query: "curl" },
  { label: "Liquid", icon: "≋", query: "fluid" },
  { label: "Color", icon: "◌", query: "color" },
  { label: "Glow", icon: "☼", query: "bloom" },
  { label: "Depth", icon: "◎", query: "glass" },
  { label: "Grain", icon: "⠿", query: "grain" },
  { label: "Output", icon: "○", query: "out" },
];

export function TextureOperatorBrowser() {
  const patch = useTexturePatchStore((state) => state.patch);
  const browser = useTexturePatchStore((state) => state.operatorBrowser);
  const setOperatorSearch = useTexturePatchStore((state) => state.setOperatorSearch);
  const addOperator = useTexturePatchStore((state) => state.addOperator);
  const loadRecipe = useTexturePatchStore((state) => state.loadRecipe);
  const groups = searchTextureOperators(browser.tab, browser.search);
  const hasOut = patch.nodes.some((node) => node.type === "out");
  const libraryItems = Object.values(groups).flat().filter((operator) => operator.type !== "out" || !hasOut);

  return (
    <aside className="flex min-h-0 flex-col border-r border-white/10 bg-[#15181b]/78 backdrop-blur-xl">
      <div className="border-b border-white/10 p-3 pb-0 text-[13px]">
        <button
          type="button"
          onClick={() => setOperatorSearch("")}
          className="rounded-t-md bg-white/10 px-4 py-3 font-medium text-white"
        >
          Systems
        </button>
      </div>

      <div className="space-y-2 p-4">
        {systemGroups.map((group) => (
          <button
            key={group.label}
            type="button"
            onClick={() => setOperatorSearch(group.query)}
            className="flex h-11 w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-4 text-left text-[14px] text-zinc-200 shadow-sm shadow-black/10 hover:bg-white/[0.075]"
          >
            <span className="grid size-6 place-items-center rounded-full text-[15px] text-cyan-200">{group.icon}</span>
            {group.label}
          </button>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 pb-3 pt-4">
        <label className="sr-only" htmlFor="operator-search">Search Operators</label>
        <input
          id="operator-search"
          value={browser.search}
          onChange={(event) => setOperatorSearch(event.target.value)}
          placeholder="Search Operators"
          className="h-9 w-full rounded-lg border border-white/10 bg-black/18 px-3 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-blue-300/45"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="mb-2 text-[11px] uppercase tracking-[0.08em] text-zinc-600">Quick Add</div>
        <div className="space-y-1.5">
          {libraryItems.slice(0, 8).map((operator) => (
            <button
              key={operator.type}
              type="button"
              aria-label={operator.label.replace(" TOP", "")}
              onClick={() => addOperator(operator.type as TextureOperatorType)}
              className="grid h-9 w-full grid-cols-[1fr_auto] items-center rounded-md border border-transparent px-3 text-left text-[13px] text-zinc-400 hover:border-white/10 hover:bg-white/[0.055] hover:text-white"
            >
              <span className="truncate">{operator.label.replace(" TOP", "")}</span>
              <span className="text-[10px] uppercase text-zinc-700">TOP</span>
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          {textureStarters.slice(0, 3).map((starter) => (
            <button
              key={starter.id}
              type="button"
              onClick={() => loadRecipe(starter.recipeId as TextureRecipeId)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-left hover:bg-white/[0.07]"
            >
              <span className="block text-[13px] font-medium text-zinc-200">{starter.label}</span>
              <span className="mt-0.5 block text-[11px] text-zinc-600">{starter.tags.join(" · ")}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
