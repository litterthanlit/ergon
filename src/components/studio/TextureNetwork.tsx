"use client";

import { useMemo, useState } from "react";
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
  useReactFlow,
} from "@xyflow/react";
import {
  getTextureOperator,
  type TextureNode,
  type TextureOperatorCategory,
  type TextureOperatorType,
} from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";

type TextureNodeData = {
  textureNode: TextureNode;
  selected: boolean;
  viewerNodeId: string;
};

const categoryTone: Record<TextureOperatorCategory, string> = {
  generator: "#67e8f9",
  simulation: "#8cf8d2",
  modifier: "#c4b5fd",
  network: "#fde68a",
  output: "#86efac",
};

function miniPreviewClass(type: TextureOperatorType) {
  if (type === "raymarch-glass") return "from-white/30 via-cyan-200/25 to-black";
  if (type === "bloom") return "from-amber-200/45 via-cyan-200/18 to-black";
  if (type === "reaction-diffusion") return "from-teal-200/35 via-amber-200/20 to-black";
  if (type === "chromatic-aberration") return "from-cyan-200/25 via-fuchsia-300/25 to-black";
  if (type === "film-grain" || type === "color-grade") return "from-slate-200/25 via-cyan-200/18 to-black";
  return "from-cyan-300/30 via-violet-300/20 to-black";
}

function TextureGraphNode({ data }: NodeProps<Node<TextureNodeData>>) {
  const { textureNode, selected, viewerNodeId } = data;
  const operator = getTextureOperator(textureNode.type);
  const tone = categoryTone[operator?.category ?? "network"];
  const isViewer = viewerNodeId === textureNode.id;

  return (
    <div
      className={`min-w-[148px] overflow-hidden rounded-lg border bg-[#1a1d20]/92 shadow-xl shadow-black/25 backdrop-blur ${
        selected ? "border-blue-400 shadow-blue-500/10" : "border-white/14"
      } ${textureNode.bypass ? "opacity-55" : ""}`}
    >
      {(operator?.inputs ?? []).map((port, index) => (
        <Handle
          key={port.id}
          id={port.id}
          type="target"
          position={Position.Left}
          className="!size-3 !rounded-none !border !border-black"
          style={{ top: 38 + index * 18, background: tone }}
        />
      ))}
      <div className={`relative mx-3 mt-3 h-12 overflow-hidden rounded-md bg-gradient-to-r ${miniPreviewClass(textureNode.type)}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.65),transparent_18%),radial-gradient(circle_at_72%_64%,rgba(255,255,255,0.22),transparent_24%)]" />
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <span className="size-2" style={{ backgroundColor: tone }} />
        </div>
      </div>
      <div className="px-3 py-2.5">
        <div className="truncate text-[13px] font-medium text-zinc-100">{textureNode.label.replace(" TOP", "")}</div>
      </div>
      <span className={`absolute right-3 bottom-3 size-2.5 rounded-full ${isViewer ? "bg-white" : "bg-white/20"}`} />
      {operator?.outputs.map((port) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={Position.Right}
          className="!size-3 !rounded-none !border !border-black"
          style={{ background: tone }}
        />
      ))}
    </div>
  );
}

const nodeTypes = { textureNode: TextureGraphNode };

export function TextureNetwork() {
  const flow = useReactFlow();
  const [selectedEdgeId, setSelectedEdgeId] = useState("");
  const patch = useTexturePatchStore((state) => state.patch);
  const setSelectedNode = useTexturePatchStore((state) => state.setSelectedNode);
  const setViewerNode = useTexturePatchStore((state) => state.setViewerNode);
  const setNodePosition = useTexturePatchStore((state) => state.setNodePosition);
  const connectNodes = useTexturePatchStore((state) => state.connectNodes);
  const disconnectEdge = useTexturePatchStore((state) => state.disconnectEdge);
  const deleteSelectedNode = useTexturePatchStore((state) => state.deleteSelectedNode);
  const duplicateSelectedNode = useTexturePatchStore((state) => state.duplicateSelectedNode);
  const autoLayout = useTexturePatchStore((state) => state.autoLayout);
  const selectedNode = patch.nodes.find((node) => node.id === patch.selectedNodeId);
  const canDeleteSelected = Boolean(selectedNode && !selectedNode.lock && (selectedNode.type !== "out" || patch.nodes.filter((node) => node.type === "out").length > 1));
  const canDuplicateSelected = Boolean(selectedNode && selectedNode.type !== "out");
  const activeEdgeId = patch.edges.some((edge) => edge.id === selectedEdgeId) ? selectedEdgeId : patch.edges[0]?.id ?? "";

  const nodes: Node<TextureNodeData>[] = useMemo(
    () =>
      patch.nodes.map((textureNode) => ({
        id: textureNode.id,
        type: "textureNode",
        position: textureNode.position,
        data: {
          textureNode,
          selected: textureNode.id === patch.selectedNodeId,
          viewerNodeId: patch.viewerNodeId,
        },
      })),
    [patch.nodes, patch.selectedNodeId, patch.viewerNodeId]
  );

  const edges: Edge[] = useMemo(
    () =>
      patch.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourcePort,
        target: edge.target,
        targetHandle: edge.targetPort,
        style: {
          stroke: edge.id === activeEdgeId ? "rgba(255,255,255,0.92)" : patch.viewerNodeId === edge.target ? "rgba(173,216,255,0.88)" : "rgba(196, 214, 220, 0.5)",
          strokeWidth: edge.id === activeEdgeId ? 2.4 : patch.viewerNodeId === edge.target ? 2 : 1.35,
        },
        animated: patch.viewerNodeId === edge.target,
      })),
    [activeEdgeId, patch.edges, patch.viewerNodeId]
  );

  const handleConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      connectNodes(connection.source, connection.target, connection.targetHandle ?? undefined);
    }
  };

  return (
    <section className="relative min-h-[360px] bg-[#121619]">
      <div className="absolute left-0 right-0 top-0 z-10 flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#171a1d]/80 px-4 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-[13px] text-zinc-300">
          <span className="text-zinc-500">⌃</span>
          <span>Advanced Graph</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[12px] text-zinc-300">
          <button
            type="button"
            aria-label="Duplicate node"
            onClick={duplicateSelectedNode}
            disabled={!canDuplicateSelected}
            className="rounded-md border border-white/10 bg-white/[0.045] px-2.5 py-1.5 hover:bg-white/10 disabled:text-zinc-700"
          >
            Duplicate
          </button>
          <button
            type="button"
            aria-label="Delete node"
            onClick={deleteSelectedNode}
            disabled={!canDeleteSelected}
            className="rounded-md border border-white/10 bg-white/[0.045] px-2.5 py-1.5 hover:bg-white/10 disabled:text-zinc-700"
          >
            Delete
          </button>
          <label className="sr-only" htmlFor="selected-texture-cable">Selected cable</label>
          <select
            id="selected-texture-cable"
            aria-label="Selected cable"
            value={activeEdgeId}
            onChange={(event) => setSelectedEdgeId(event.target.value)}
            disabled={patch.edges.length === 0}
            className="h-8 max-w-44 rounded-md border border-white/10 bg-black/25 px-2 text-xs text-zinc-200 outline-none disabled:text-zinc-700"
          >
            {patch.edges.map((edge) => (
              <option key={edge.id} value={edge.id}>
                {edge.source} → {edge.target}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Disconnect cable"
            onClick={() => activeEdgeId && disconnectEdge(activeEdgeId)}
            disabled={!activeEdgeId}
            className="rounded-md border border-white/10 bg-white/[0.045] px-2.5 py-1.5 hover:bg-white/10 disabled:text-zinc-700"
          >
            Disconnect
          </button>
          <button
            type="button"
            aria-label="Fit graph"
            onClick={() => flow.fitView({ padding: 0.2, duration: 220 })}
            className="rounded-md border border-white/10 bg-white/[0.045] px-2.5 py-1.5 hover:bg-white/10"
          >
            Fit
          </button>
          <button
            type="button"
            aria-label="Auto layout"
            onClick={autoLayout}
            className="rounded-md border border-white/10 bg-white/[0.045] px-2.5 py-1.5 hover:bg-white/10"
          >
            Layout
          </button>
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 28, y: 110, zoom: 0.78 }}
        minZoom={0.3}
        maxZoom={1.6}
        onConnect={handleConnect}
        onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onNodeDoubleClick={(_, node) => setViewerNode(node.id)}
        onNodeDragStop={(_, node) => setNodePosition(node.id, node.position)}
        proOptions={{ hideAttribution: true }}
        className="bg-[radial-gradient(circle_at_45%_18%,rgba(110,135,152,0.14),transparent_32%),#121619]"
      >
        <Background color="rgba(255,255,255,0.08)" gap={24} size={1} />
        <Controls className="!hidden" />
      </ReactFlow>
    </section>
  );
}
