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
  const patch = useTexturePatchStore((state) => state.patch);
  const setSelectedNode = useTexturePatchStore((state) => state.setSelectedNode);
  const setViewerNode = useTexturePatchStore((state) => state.setViewerNode);
  const setNodePosition = useTexturePatchStore((state) => state.setNodePosition);
  const connectNodes = useTexturePatchStore((state) => state.connectNodes);

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
        style: { stroke: patch.viewerNodeId === edge.target ? "rgba(173,216,255,0.88)" : "rgba(196, 214, 220, 0.5)", strokeWidth: patch.viewerNodeId === edge.target ? 2 : 1.35 },
        animated: patch.viewerNodeId === edge.target,
      })),
    [patch.edges, patch.viewerNodeId]
  );

  const handleConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      connectNodes(connection.source, connection.target, connection.targetHandle ?? undefined);
    }
  };

  return (
    <section className="relative min-h-[360px] bg-[#121619]">
      <div className="absolute left-0 right-0 top-0 z-10 flex h-10 items-center justify-between border-b border-white/10 bg-[#171a1d]/80 px-4 backdrop-blur-xl">
        <div className="mx-auto flex items-center gap-2 text-[13px] text-zinc-300">
          <span className="text-zinc-500">⌃</span>
          <span>Advanced Graph</span>
        </div>
        <div className="absolute right-4 flex items-center gap-1 text-[12px] text-zinc-600">
          <button type="button" className="grid size-7 place-items-center rounded-md hover:bg-white/10 hover:text-zinc-200">⇤</button>
          <button type="button" className="grid size-7 place-items-center rounded-md hover:bg-white/10 hover:text-zinc-200">⇥</button>
          <button type="button" className="grid size-7 place-items-center rounded-md hover:bg-white/10 hover:text-zinc-200">▦</button>
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
