"use client";

import {
  searchTextureOperators,
  textureOperatorBrowserTabs,
  textureOperatorCategoryLabels,
  type TextureOperatorType,
} from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";
import { TextureThumb } from "./TextureThumb";

export function TextureOperatorBrowser() {
  const patch = useTexturePatchStore((state) => state.patch);
  const stats = useTexturePatchStore((state) => state.stats);
  const browser = useTexturePatchStore((state) => state.operatorBrowser);
  const selectOperatorCategory = useTexturePatchStore((state) => state.selectOperatorCategory);
  const setOperatorSearch = useTexturePatchStore((state) => state.setOperatorSearch);
  const addOperator = useTexturePatchStore((state) => state.addOperator);
  const selectedNode = patch.nodes.find((node) => node.id === patch.selectedNodeId);
  const nodeStats = selectedNode ? stats?.nodeStats[selectedNode.id] : undefined;
  const groups = searchTextureOperators(browser.tab, browser.search);

  return (
    <aside className="flex min-h-0 flex-col border-r border-[#20252b] bg-[#0b1014]">
      <div className="grid grid-cols-6 border-b border-[#20252b] text-[10px] uppercase tracking-[0.12em]">
        {textureOperatorBrowserTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => selectOperatorCategory(tab)}
            className={`h-8 border-r border-[#20252b] last:border-r-0 ${
              browser.tab === tab ? "bg-[#141a20] text-zinc-200" : "text-zinc-600 hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
        <button type="button" onClick={() => addOperator("null")} className="h-8 text-zinc-500 hover:text-zinc-200">+</button>
      </div>

      <div className="border-b border-[#20252b] p-2">
        <label className="sr-only" htmlFor="operator-search">Search Operators</label>
        <input
          id="operator-search"
          value={browser.search}
          onChange={(event) => setOperatorSearch(event.target.value)}
          placeholder="Search Operators"
          className="h-8 w-full border border-[#252c33] bg-[#0a0e12] px-3 font-mono text-[11px] text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-cyan-300/35"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {browser.tab !== "TOP" ? (
          <div className="mt-6 border border-[#20252b] bg-[#0e1318] p-3 text-xs leading-5 text-zinc-500">
            {browser.tab} operators are reserved for the next domain pass. TOPs are active in V2.1.
          </div>
        ) : (
          Object.entries(groups).map(([category, items]) => (
            <div key={category} className="border-b border-[#1b2026] py-2 last:border-b-0">
              <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                <span>{textureOperatorCategoryLabels[category as keyof typeof textureOperatorCategoryLabels]}</span>
                <span>{items.length.toString().padStart(2, "0")}</span>
              </div>
              <div className="space-y-0.5">
                {items.map((operator) => (
                  <button
                    key={operator.type}
                    type="button"
                    aria-label={operator.label.replace(" TOP", "")}
                    onClick={() => addOperator(operator.type as TextureOperatorType)}
                    className="grid h-6 w-full grid-cols-[1fr_auto] items-center border border-transparent px-1.5 text-left text-[11px] text-zinc-500 hover:border-[#29313a] hover:bg-[#11171d] hover:text-zinc-200"
                    title={operator.description}
                  >
                    <span className="truncate">{operator.label.replace(" TOP", "")}</span>
                    <span className="font-mono text-[9px] uppercase text-zinc-700">TOP</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[#20252b] p-2">
        <TextureThumb id="organic-refraction" accent="#67e8f9" className="h-[90px] border border-[#242b33]" />
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-500">
          <span>Resolution</span><span>{patch.resolution[0]} {patch.resolution[1]}</span>
          <span>Pixel Format</span><span>RGBA 16f</span>
          <span>Selected</span><span className="truncate">{selectedNode?.label ?? "None"}</span>
          <span>GPU</span><span>{nodeStats?.cookMs.toFixed(2) ?? "0.00"} ms</span>
          <span>Last Cook</span><span>{stats?.cookMs.toFixed(2) ?? "0.00"} ms</span>
        </div>
      </div>
    </aside>
  );
}
