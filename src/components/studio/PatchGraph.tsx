"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useVisualPatchStore } from "@/lib/visual-patch-store";
import { nodeKindLabel, type VisualNode, type VisualNodeKind } from "@/lib/visual-patch";

type PatchNodeData = {
  visualNode: VisualNode;
  selected: boolean;
};

const nodeColors: Record<VisualNodeKind, string> = {
  source: "#f8fafc",
  motion: "#38bdf8",
  color: "#f472b6",
  feedback: "#a78bfa",
  composite: "#facc15",
  output: "#86efac",
};

function PatchNode({ data }: NodeProps<Node<PatchNodeData>>) {
  const { visualNode, selected } = data;
  const color = nodeColors[visualNode.kind];

  return (
    <div
      className={`min-w-40 rounded-2xl border bg-zinc-950/92 px-3.5 py-3 shadow-xl shadow-black/25 ${
        selected ? "border-white/70" : "border-white/12"
      }`}
    >
      {visualNode.kind !== "source" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!size-3 !border !border-zinc-950"
          style={{ background: color }}
        />
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {nodeKindLabel(visualNode.kind)}
        </span>
        <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-50">{visualNode.label}</div>
      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
        {visualNode.description}
      </p>
      {visualNode.kind !== "output" && (
        <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2 text-[10px] text-zinc-500">
          <span>{Object.keys(visualNode.schema).length} params</span>
          <span>{Math.round(visualNode.opacity * 100)}%</span>
        </div>
      )}
      {visualNode.kind !== "output" && (
        <Handle
          type="source"
          position={Position.Right}
          className="!size-3 !border !border-zinc-950"
          style={{ background: color }}
        />
      )}
    </div>
  );
}

const nodeTypes = { patchNode: PatchNode };

export function PatchGraph() {
  const patch = useVisualPatchStore((state) => state.patch);
  const setSelectedNode = useVisualPatchStore((state) => state.setSelectedNode);
  const setNodePosition = useVisualPatchStore((state) => state.setNodePosition);
  const connectNodes = useVisualPatchStore((state) => state.connectNodes);
  const addNode = useVisualPatchStore((state) => state.addNode);

  const nodes: Node<PatchNodeData>[] = useMemo(
    () =>
      patch.nodes.map((visualNode) => ({
        id: visualNode.id,
        type: "patchNode",
        position: visualNode.position,
        data: {
          visualNode,
          selected: visualNode.id === patch.selectedNodeId,
        },
      })),
    [patch.nodes, patch.selectedNodeId]
  );

  const edges: Edge[] = useMemo(
    () =>
      patch.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
        style: { stroke: "rgba(244,244,245,0.42)", strokeWidth: 1.5 },
      })),
    [patch.edges]
  );

  const handleConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      connectNodes(connection.source, connection.target);
    }
  };

  return (
    <div className="relative h-full min-h-[300px] overflow-hidden rounded-[22px] border border-white/10 bg-[#08090d]">
      <div className="absolute left-4 top-4 z-10 flex gap-2">
        {(["source", "motion", "color", "feedback", "composite"] as VisualNodeKind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => addNode(kind)}
            className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/12 sm:px-3"
          >
            + {nodeKindLabel(kind)}
          </button>
        ))}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 26, y: 210, zoom: 0.78 }}
        minZoom={0.45}
        maxZoom={1.3}
        onConnect={handleConnect}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onNodeDragStop={(_, node) => setNodePosition(node.id, node.position)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.12)" gap={24} size={1} />
        <Controls className="!border-white/10 !bg-zinc-950/80 !text-zinc-200" />
      </ReactFlow>
    </div>
  );
}
