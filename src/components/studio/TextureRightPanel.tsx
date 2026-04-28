"use client";

import { useState } from "react";
import { TextureInspector } from "./TextureInspector";
import { TextureThumb } from "./TextureThumb";
import { getTextureOperator, textureCommands, textureStarters, type TextureCommandId, type TextureRecipeId } from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";

const recipeActions: { label: string; commandId: TextureCommandId }[] = [
  { label: "Make softer", commandId: "slow-motion" },
  { label: "Add glow", commandId: "increase-bloom" },
  { label: "Slow motion", commandId: "slow-motion" },
  { label: "Add glass", commandId: "add-glass-refraction" },
  { label: "Dark editorial grade", commandId: "make-editorial-black" },
  { label: "More organic detail", commandId: "make-more-liquid" },
];

export function TextureRightPanel() {
  const [tab, setTab] = useState<"look" | "node" | "recipe">("node");
  const patch = useTexturePatchStore((state) => state.patch);
  const loadRecipe = useTexturePatchStore((state) => state.loadRecipe);
  const applyCommand = useTexturePatchStore((state) => state.applyCommand);
  const toggleBypass = useTexturePatchStore((state) => state.toggleBypass);
  const setViewerNode = useTexturePatchStore((state) => state.setViewerNode);
  const selectedNode = patch.nodes.find((node) => node.id === patch.selectedNodeId);
  const operator = selectedNode ? getTextureOperator(selectedNode.type) : null;

  return (
    <aside className="flex min-h-0 flex-col border-l border-white/10 bg-[#15181b]/80 backdrop-blur-xl">
      <div className="grid grid-cols-3 border-b border-white/10 px-3 pt-2 text-[13px]">
        {(["look", "node", "recipe"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-t-md px-3 py-3 capitalize ${tab === item ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-200"}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "node" && (
          <div className="p-4">
            <div className="flex items-start gap-3 border-b border-white/10 pb-4">
              <TextureThumb id="organic-refraction" accent="#67e8f9" className="h-12 w-12 shrink-0 rounded-md border border-white/10" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium text-white">{selectedNode?.label.replace(" TOP", "") ?? "No node"}</div>
                <div className="mt-1 text-xs text-zinc-500">{operator?.description ?? "Select a node to edit it."}</div>
              </div>
              <button type="button" aria-label="Favorite" className="text-zinc-400 hover:text-white">☆</button>
            </div>
            <div className="space-y-3 border-b border-white/10 py-4 text-[13px]">
              <label className="flex items-center justify-between gap-4 text-zinc-400">
                Expose to Look
                <input type="checkbox" defaultChecked className="size-4 accent-blue-400" />
              </label>
              <label className="flex items-center justify-between gap-4 text-zinc-400">
                Bypass
                <input
                  type="checkbox"
                  checked={selectedNode?.bypass ?? false}
                  onChange={() => selectedNode && toggleBypass(selectedNode.id)}
                  className="size-4 accent-blue-400"
                />
              </label>
              <button type="button" className="flex w-full items-center justify-between rounded-md py-1 text-left text-zinc-400 hover:text-white">
                Replace Node <span>›</span>
              </button>
              <button type="button" onClick={() => selectedNode && setViewerNode(selectedNode.id)} className="flex w-full items-center justify-between rounded-md py-1 text-left text-zinc-400 hover:text-white">
                View Output <span>↗</span>
              </button>
            </div>
            <TextureInspector embedded />
          </div>
        )}

        {tab === "look" && (
          <div className="space-y-5 p-4">
            {["Motion", "Liquid", "Glow", "Depth", "Color", "Grain", "Detail"].map((label, index) => (
              <label key={label} className="block">
                <span className="mb-2 flex justify-between text-[13px] text-zinc-300">
                  {label}
                  <span className="text-zinc-600">{[42, 68, 76, 58, 64, 21, 72][index]}%</span>
                </span>
                <input type="range" min={0} max={100} defaultValue={[42, 68, 76, 58, 64, 21, 72][index]} className="ergon-dark-range" />
              </label>
            ))}
          </div>
        )}

        {tab === "recipe" && (
          <div className="space-y-2 p-4">
            {textureStarters.map((starter) => (
              <button
                key={starter.id}
                type="button"
                onClick={() => loadRecipe(starter.recipeId as TextureRecipeId)}
                className="grid w-full grid-cols-[44px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-2 text-left hover:bg-white/[0.07]"
                aria-label={starter.label}
                title={starter.description}
              >
                <TextureThumb id={starter.thumbnail} accent={starter.accent} className="h-10 rounded-md border border-white/10" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-zinc-200">{starter.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-zinc-600">{starter.tags.join(" / ")}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center justify-between text-[14px] font-medium text-zinc-200">
          Recipe <span className="text-zinc-500">⌃</span>
        </div>
        <div className="space-y-2">
          {recipeActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => applyCommand(action.commandId)}
                className="flex h-8 w-full items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 text-left text-[13px] text-zinc-300 hover:bg-white/[0.08]"
              >
                <span className="text-zinc-400">✦</span>
                {action.label}
              </button>
          ))}
          <span className="sr-only">{textureCommands.length} recipe commands available</span>
        </div>
      </div>
    </aside>
  );
}
