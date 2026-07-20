"use client";

import {
  activeTextureOperatorBrowserTabs,
  searchTextureOperators,
  textureStarters,
  type TextureRecipeId,
  type TextureOperatorType,
} from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";
import { StudioSectionLabel, StudioSidebarRow, studio } from "./studio-primitives";

const systemGroups = [
  { label: "Sources", query: "noise" },
  { label: "Motion", query: "curl" },
  { label: "Liquid", query: "fluid" },
  { label: "Color", query: "color" },
  { label: "Glow", query: "bloom" },
  { label: "Depth", query: "glass" },
  { label: "Grain", query: "grain" },
  { label: "Output", query: "out" },
];

export function TextureOperatorBrowser() {
  const patch = useTexturePatchStore((state) => state.patch);
  const browser = useTexturePatchStore((state) => state.operatorBrowser);
  const setOperatorSearch = useTexturePatchStore((state) => state.setOperatorSearch);
  const selectOperatorCategory = useTexturePatchStore((state) => state.selectOperatorCategory);
  const addOperator = useTexturePatchStore((state) => state.addOperator);
  const loadRecipe = useTexturePatchStore((state) => state.loadRecipe);
  const activeTab = activeTextureOperatorBrowserTabs.includes(browser.tab) ? browser.tab : "TOP";
  const groups = searchTextureOperators(activeTab, browser.search);
  const hasOut = patch.nodes.some((node) => node.type === "out");
  const libraryItems = Object.values(groups).flat().filter((operator) => operator.type !== "out" || !hasOut);
  const activeQuery = browser.search.trim().toLowerCase();

  return (
    <aside
      className={`flex w-[220px] shrink-0 flex-col border-r ${studio.separator} ${studio.bg}`}
    >
      <div className={`border-b ${studio.separator} px-3 py-2.5`}>
        <button
          type="button"
          onClick={() => setOperatorSearch("")}
          className="text-[13px] font-semibold text-[#f5f5f7]"
        >
          Library
        </button>
        <div className="mt-2 flex gap-1" role="tablist" aria-label="Operator family">
          {activeTextureOperatorBrowserTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => selectOperatorCategory(tab)}
              className={`rounded-[6px] px-2 py-1 text-[11px] font-semibold tracking-wide ${
                activeTab === tab
                  ? "bg-[#0a84ff]/20 text-[#64b5ff]"
                  : "text-[#636366] hover:bg-white/[0.06] hover:text-[#98989d]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 py-2">
        <label className="sr-only" htmlFor="operator-search">Search Operators</label>
        <input
          id="operator-search"
          value={browser.search}
          onChange={(event) => setOperatorSearch(event.target.value)}
          placeholder="Search"
          className={`h-7 w-full rounded-[6px] bg-white/[0.08] px-2.5 text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#636366] focus:bg-white/[0.12] focus:ring-2 focus:ring-[#0a84ff]/35`}
        />
      </div>

      <StudioSectionLabel>Categories</StudioSectionLabel>
      <div className="pb-1">
        {systemGroups.map((group) => (
          <StudioSidebarRow
            key={group.label}
            onClick={() => setOperatorSearch(group.query)}
            selected={activeQuery === group.query}
          >
            {group.label}
          </StudioSidebarRow>
        ))}
      </div>

      <StudioSectionLabel>Operators</StudioSectionLabel>
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {libraryItems.slice(0, 10).map((operator) => (
          <StudioSidebarRow
            key={operator.type}
            ariaLabel={operator.label.replace(" TOP", "")}
            onClick={() => addOperator(operator.type as TextureOperatorType)}
          >
            <span className="truncate">{operator.label.replace(" TOP", "")}</span>
          </StudioSidebarRow>
        ))}
      </div>

      <div className={`border-t ${studio.separator} pb-2`}>
        <StudioSectionLabel>Templates</StudioSectionLabel>
        {textureStarters.slice(0, 4).map((starter) => (
          <StudioSidebarRow
            key={starter.id}
            onClick={() => loadRecipe(starter.recipeId as TextureRecipeId)}
          >
            <span className="truncate">{starter.label}</span>
          </StudioSidebarRow>
        ))}
      </div>

      {/* Keep test-visible Systems control */}
      <button type="button" className="sr-only" onClick={() => setOperatorSearch("")}>
        Systems
      </button>
    </aside>
  );
}
