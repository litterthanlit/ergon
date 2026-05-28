"use client";

import { ParameterPanel } from "./ParameterPanel";
import { getTextureOperator, type TextureOperatorDefinition, type TextureQuality, type TextureRendererBackend } from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";
import type { ParamSchema, ParamValue, ParamValues } from "@/lib/types";

type Props = {
  embedded?: boolean;
};

function schemaGroups(operator: TextureOperatorDefinition) {
  const used = new Set<string>();
  const groups = (operator.paramGroups ?? [])
    .map((group) => {
      const entries = group.keys
        .filter((key) => key in operator.schema)
        .map((key) => [key, operator.schema[key]] as const);
      entries.forEach(([key]) => used.add(key));
      return { label: group.label, schema: Object.fromEntries(entries) as ParamSchema };
    })
    .filter((group) => Object.keys(group.schema).length > 0);

  const rest = Object.entries(operator.schema).filter(([key]) => !used.has(key));
  if (rest.length > 0) groups.push({ label: "Parameters", schema: Object.fromEntries(rest) as ParamSchema });
  return groups;
}

function valuesFor(schema: ParamSchema, values: ParamValues) {
  return Object.fromEntries(Object.keys(schema).map((key) => [key, values[key]])) as ParamValues;
}

export function TextureInspector({ embedded = false }: Props) {
  const patch = useTexturePatchStore((state) => state.patch);
  const stats = useTexturePatchStore((state) => state.stats);
  const updateNodeParam = useTexturePatchStore((state) => state.updateNodeParam);
  const toggleBypass = useTexturePatchStore((state) => state.toggleBypass);
  const toggleLock = useTexturePatchStore((state) => state.toggleLock);
  const setViewerNode = useTexturePatchStore((state) => state.setViewerNode);
  const setRendererBackend = useTexturePatchStore((state) => state.setRendererBackend);
  const setQuality = useTexturePatchStore((state) => state.setQuality);
  const selectedNode = patch.nodes.find((node) => node.id === patch.selectedNodeId);
  const operator = selectedNode ? getTextureOperator(selectedNode.type) : undefined;

  if (!selectedNode || !operator) {
    return (
      <aside className={`${embedded ? "h-full" : "min-h-[300px] border-t lg:border-l lg:border-t-0"} flex w-full items-center justify-center border-white/10 bg-[#0a0b10] text-sm text-zinc-500`}>
        Select a TOP.
      </aside>
    );
  }

  const nodeStats = stats?.nodeStats[selectedNode.id];
  const groups = schemaGroups(operator);

  if (embedded) {
    return (
      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="rounded-[10px] bg-[#2c2c2e] p-4 text-[13px] text-[#98989d]">
            This node has no adjustable properties.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="rounded-[10px] bg-[#2c2c2e] p-3">
              <ParameterPanel
                schema={group.schema}
                values={valuesFor(group.schema, selectedNode.params)}
                onChange={(key, value) => updateNodeParam(selectedNode.id, key, value as ParamValue)}
                tone="dark"
                title={group.label}
                description=""
              />
            </div>
          ))
        )}

        {operator.presets && operator.presets.length > 0 && (
          <div className="rounded-[10px] bg-[#2c2c2e] p-3">
            <h3 className="text-[11px] font-semibold text-[#98989d]">Presets</h3>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {operator.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    for (const [key, value] of Object.entries(preset.params)) {
                      updateNodeParam(selectedNode.id, key, value as ParamValue);
                    }
                  }}
                  className="rounded-[6px] bg-white/[0.06] px-2.5 py-1.5 text-left text-[12px] text-[#f5f5f7] hover:bg-white/[0.1]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-[10px] bg-[#2c2c2e] p-3">
          <div className="mb-2 text-[11px] font-semibold text-[#98989d]">Performance</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums text-[#636366]">
            <span>{nodeStats?.cookMs.toFixed(2) ?? "0.00"} ms</span>
            <span>{nodeStats?.resolution.join("×") ?? "—"}</span>
            <span>{operator.inputs.length} inputs</span>
            <span>{operator.outputs.length} outputs</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className={`${embedded ? "h-full" : "min-h-[300px] border-t lg:border-l lg:border-t-0"} flex w-full shrink-0 flex-col border-white/10 bg-[#0a0b10]`}>
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="border border-white/10 bg-white/6 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            {operator.family} / {operator.category}
          </span>
          <span className="font-mono text-[10px] text-zinc-600">{selectedNode.id}</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-zinc-50">{selectedNode.label}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{operator.description}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => toggleBypass(selectedNode.id)}
            className={`border px-2 py-2 text-xs ${selectedNode.bypass ? "border-amber-300 bg-amber-300 text-black" : "border-white/10 text-zinc-400 hover:bg-white/8"}`}
          >
            Bypass
          </button>
          <button
            type="button"
            onClick={() => toggleLock(selectedNode.id)}
            className={`border px-2 py-2 text-xs ${selectedNode.lock ? "border-zinc-200 bg-zinc-200 text-black" : "border-white/10 text-zinc-400 hover:bg-white/8"}`}
          >
            Lock
          </button>
          <button
            type="button"
            onClick={() => setViewerNode(selectedNode.id)}
            className={`border px-2 py-2 text-xs ${patch.viewerNodeId === selectedNode.id ? "border-emerald-300 bg-emerald-300 text-black" : "border-white/10 text-zinc-400 hover:bg-white/8"}`}
          >
            Viewer
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-6 border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">Render</div>
              <div className="mt-1 text-xs text-zinc-400">
                {stats?.requestedBackend ?? patch.rendererBackend} requested / {stats?.backend ?? "webgl2"} running
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
              {stats?.cookMs.toFixed(2) ?? "0.00"} ms
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["webgpu", "webgl2"] as TextureRendererBackend[]).map((backend) => (
              <button
                key={backend}
                type="button"
                onClick={() => setRendererBackend(backend)}
                className={`border px-2 py-2 text-xs uppercase tracking-[0.08em] ${
                  patch.rendererBackend === backend ? "border-cyan-200 bg-cyan-200 text-black" : "border-white/10 text-zinc-400 hover:bg-white/8"
                }`}
              >
                {backend}
              </button>
            ))}
            {(["preview", "final"] as TextureQuality[]).map((quality) => (
              <button
                key={quality}
                type="button"
                onClick={() => setQuality(quality)}
                className={`border px-2 py-2 text-xs uppercase tracking-[0.08em] ${
                  patch.quality === quality ? "border-zinc-100 bg-zinc-100 text-black" : "border-white/10 text-zinc-400 hover:bg-white/8"
                }`}
              >
                {quality}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {groups.length === 0 ? (
            <div className="border border-white/10 bg-white/[0.035] p-4 text-sm text-zinc-500">
              This TOP has no exposed artist parameters.
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="border border-white/10 bg-white/[0.025] p-4">
                <ParameterPanel
                  schema={group.schema}
                  values={valuesFor(group.schema, selectedNode.params)}
                  onChange={(key, value) => updateNodeParam(selectedNode.id, key, value as ParamValue)}
                  tone="dark"
                  title={group.label}
                  description=""
                />
              </div>
            ))
          )}
        </div>

        {operator.presets && operator.presets.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Quick Presets</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {operator.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    for (const [key, value] of Object.entries(preset.params)) {
                      updateNodeParam(selectedNode.id, key, value as ParamValue);
                    }
                  }}
                  className="border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/8"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Cook Stats</div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-zinc-400">
            <span>{nodeStats?.cookMs.toFixed(2) ?? "0.00"} ms</span>
            <span>{nodeStats?.resolution.join("x") ?? "pending"}</span>
            <span>{operator.inputs.length} in</span>
            <span>{operator.outputs.length} out</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
