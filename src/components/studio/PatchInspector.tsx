"use client";

import { ParameterPanel } from "./ParameterPanel";
import { useVisualPatchStore } from "@/lib/visual-patch-store";
import { nodeKindLabel } from "@/lib/visual-patch";
import type { ParamValue } from "@/lib/types";

export function PatchInspector() {
  const patch = useVisualPatchStore((state) => state.patch);
  const updateNodeParam = useVisualPatchStore((state) => state.updateNodeParam);
  const addOrUpdateKeyframe = useVisualPatchStore((state) => state.addOrUpdateKeyframe);
  const selectedNode = patch.nodes.find((node) => node.id === patch.selectedNodeId);

  if (!selectedNode) {
    return (
      <aside className="flex h-[320px] w-full shrink-0 items-center justify-center border-t border-white/10 bg-zinc-950 px-6 text-sm text-zinc-500 xl:h-full xl:w-[320px] xl:border-l xl:border-t-0">
        Select a node to shape the patch.
      </aside>
    );
  }

  const trackKeys = new Set(
    patch.tracks
      .filter((track) => track.nodeId === selectedNode.id)
      .map((track) => track.paramKey)
  );

  return (
    <aside className="flex h-[380px] w-full shrink-0 flex-col border-t border-white/10 bg-[#0b0c10] xl:h-full xl:w-[320px] xl:border-l xl:border-t-0">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            {nodeKindLabel(selectedNode.kind)}
          </span>
          <span className="font-mono text-[10px] text-zinc-600">{selectedNode.id}</span>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-zinc-50">{selectedNode.label}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{selectedNode.description}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {selectedNode.kind === "output" ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm leading-relaxed text-zinc-400">
              Output collects the connected graph and renders the final live canvas.
            </p>
          </div>
        ) : (
          <>
            <ParameterPanel
              schema={selectedNode.schema}
              values={selectedNode.params}
              onChange={(key, value) => updateNodeParam(selectedNode.id, key, value as ParamValue)}
              tone="dark"
              title="Node parameters"
              description="Shape this operator. Add keyframes below to animate the selected values over time."
            />

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Keyframes
                </h3>
                <span className="font-mono text-[10px] text-zinc-600">
                  {patch.currentTime.toFixed(2)}s
                </span>
              </div>
              {Object.keys(selectedNode.schema).slice(0, 8).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => addOrUpdateKeyframe(selectedNode.id, key)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-white/8"
                >
                  <span>{selectedNode.schema[key].label}</span>
                  <span className={trackKeys.has(key) ? "text-sky-300" : "text-zinc-600"}>
                    {trackKeys.has(key) ? "keyframed" : "set key"}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
