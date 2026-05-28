"use client";

import { useState } from "react";
import { TextureInspector } from "./TextureInspector";
import { getTextureOperator, textureCommands, textureStarters, type TextureCommandId, type TextureRecipeId } from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";
import { StudioGroupedPanel, StudioSegmented, StudioSidebarRow, studio } from "./studio-primitives";

const recipeActions: { label: string; commandId: TextureCommandId }[] = [
  { label: "Make softer", commandId: "slow-motion" },
  { label: "Add glow", commandId: "increase-bloom" },
  { label: "Slow motion", commandId: "slow-motion" },
  { label: "Add glass", commandId: "add-glass-refraction" },
  { label: "Dark editorial grade", commandId: "make-editorial-black" },
  { label: "More organic detail", commandId: "make-more-liquid" },
];

type PanelTab = "node" | "recipe";

export function TextureRightPanel() {
  const [tab, setTab] = useState<PanelTab>("node");
  const patch = useTexturePatchStore((state) => state.patch);
  const loadRecipe = useTexturePatchStore((state) => state.loadRecipe);
  const applyCommand = useTexturePatchStore((state) => state.applyCommand);
  const toggleBypass = useTexturePatchStore((state) => state.toggleBypass);
  const setViewerNode = useTexturePatchStore((state) => state.setViewerNode);
  const selectedNode = patch.nodes.find((node) => node.id === patch.selectedNodeId);
  const operator = selectedNode ? getTextureOperator(selectedNode.type) : null;

  return (
    <aside
      className={`flex w-[280px] shrink-0 flex-col border-l ${studio.separator} ${studio.bg}`}
    >
      <div className={`flex items-center justify-between border-b ${studio.separator} px-3 py-2.5`}>
        <span className="text-[13px] font-semibold text-[#f5f5f7]">Inspector</span>
        <StudioSegmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "node", label: "Node", ariaLabel: "node" },
            { value: "recipe", label: "Templates", ariaLabel: "recipe" },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "node" && (
          <div className="space-y-3">
            <StudioGroupedPanel>
              <p className="text-[15px] font-semibold text-[#f5f5f7]">
                {selectedNode?.label.replace(" TOP", "") ?? "No Selection"}
              </p>
              <p className="mt-1 text-pretty text-[13px] leading-relaxed text-[#98989d]">
                {operator?.description ?? "Select a node in the graph to inspect its properties."}
              </p>
            </StudioGroupedPanel>

            {selectedNode && (
              <StudioGroupedPanel className="space-y-3">
                <label className="flex items-center justify-between text-[13px] text-[#f5f5f7]">
                  <span>Bypass</span>
                  <input
                    type="checkbox"
                    checked={selectedNode.bypass}
                    onChange={() => toggleBypass(selectedNode.id)}
                    className="size-4 rounded accent-[#0a84ff]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setViewerNode(selectedNode.id)}
                  className="w-full rounded-[6px] bg-white/[0.06] py-1.5 text-[13px] text-[#64b5ff] hover:bg-white/[0.1]"
                >
                  Set as viewer output
                </button>
              </StudioGroupedPanel>
            )}

            <TextureInspector embedded />
          </div>
        )}

        {tab === "recipe" && (
          <div className="space-y-2">
            <p className="px-1 text-pretty text-[13px] leading-relaxed text-[#98989d]">
              Start from a template to load a complete operator graph.
            </p>
            {textureStarters.map((starter) => (
              <button
                key={starter.id}
                type="button"
                onClick={() => loadRecipe(starter.recipeId as TextureRecipeId)}
                className={`w-full ${studio.radius} ${studio.surface} p-3 text-left transition-colors hover:bg-[#48484a]`}
                aria-label={starter.label}
                title={starter.description}
              >
                <span className="block text-[13px] font-medium text-[#f5f5f7]">{starter.label}</span>
                <span className="mt-0.5 block text-[11px] text-[#98989d]">{starter.tags.join(" · ")}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`border-t ${studio.separator} p-3`}>
        <p className="mb-2 text-[11px] font-semibold text-[#98989d]">Adjustments</p>
        <div className="space-y-0.5">
          {recipeActions.map((action) => (
            <StudioSidebarRow
              key={action.label}
              onClick={() => applyCommand(action.commandId)}
            >
              {action.label}
            </StudioSidebarRow>
          ))}
          <span className="sr-only">{textureCommands.length} recipe commands available</span>
        </div>
      </div>
    </aside>
  );
}
