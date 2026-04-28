"use client";

import { useState } from "react";
import { TextureInspector } from "./TextureInspector";
import { TextureThumb } from "./TextureThumb";
import { textureStarters, type TextureRecipeId } from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";

export function TextureRightPanel() {
  const [tab, setTab] = useState<"params" | "info" | "code">("params");
  const patch = useTexturePatchStore((state) => state.patch);
  const loadRecipe = useTexturePatchStore((state) => state.loadRecipe);
  const selectedNode = patch.nodes.find((node) => node.id === patch.selectedNodeId);

  return (
    <aside className="grid min-h-0 grid-cols-[minmax(0,1fr)_168px] border-l border-[#20252b] bg-[#0a0e12]">
      <div className="min-w-0 border-r border-[#20252b]">
        <div className="flex h-8 border-b border-[#20252b] text-[10px] uppercase tracking-[0.12em]">
          {(["params", "info", "code"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`border-r border-[#20252b] px-4 ${tab === item ? "bg-[#141a20] text-zinc-200" : "text-zinc-600 hover:text-zinc-300"}`}
            >
              {item}
            </button>
          ))}
        </div>
        {tab === "params" && <TextureInspector embedded />}
        {tab === "info" && (
          <div className="p-4 text-sm leading-6 text-zinc-500">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">Patch Info</div>
            <h2 className="mt-2 text-lg font-semibold text-zinc-100">{patch.name}</h2>
            <p className="mt-2">Selected node: {selectedNode?.label ?? "None"}</p>
            <p>{patch.nodes.length} nodes, {patch.edges.length} cables</p>
            <p className="mt-4">WebGPU remains the preferred backend contract; this milestone keeps WebGL2 compatibility rendering active.</p>
          </div>
        )}
        {tab === "code" && (
          <pre className="h-full overflow-auto p-4 font-mono text-[10px] leading-5 text-zinc-500">
            {JSON.stringify({ id: patch.id, name: patch.name, selectedNodeId: patch.selectedNodeId, viewerNodeId: patch.viewerNodeId }, null, 2)}
          </pre>
        )}
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="grid h-8 grid-cols-2 border-b border-[#20252b] text-[10px] uppercase tracking-[0.12em]">
          <button type="button" className="bg-[#141a20] text-zinc-200">Recipe</button>
          <button type="button" className="border-l border-[#20252b] text-zinc-600">Starter</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <div className="space-y-1.5">
            {textureStarters.map((starter) => (
              <button
                key={starter.id}
                type="button"
                onClick={() => loadRecipe(starter.recipeId as TextureRecipeId)}
                className="grid w-full grid-cols-[46px_1fr] gap-2 border border-transparent p-1 text-left hover:border-[#33404c] hover:bg-[#121820]"
                aria-label={starter.label}
                title={starter.description}
              >
                <TextureThumb id={starter.thumbnail} accent={starter.accent} className="h-10 border border-[#252c33]" />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold text-zinc-300">{starter.label}</span>
                  <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-[0.1em] text-zinc-700">
                    {starter.tags.join(" / ")}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-[#20252b] p-2">
          <button type="button" className="h-8 w-full border border-[#252c33] bg-[#0d1217] text-[11px] text-zinc-500 hover:text-zinc-200">
            Open Recipe...
          </button>
        </div>
      </div>
    </aside>
  );
}
