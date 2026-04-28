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
      className={`min-w-[154px] border bg-[#111217] shadow-xl shadow-black/25 ${
        selected ? "border-zinc-100" : "border-white/12"
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
      <div className={`relative h-8 overflow-hidden bg-gradient-to-r ${miniPreviewClass(textureNode.type)}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.65),transparent_18%),radial-gradient(circle_at_72%_64%,rgba(255,255,255,0.22),transparent_24%)]" />
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/70">TOP</span>
          <span className="size-2" style={{ backgroundColor: tone }} />
        </div>
      </div>
      <div className="px-2.5 py-2">
        <div className="truncate text-[12px] font-semibold text-zinc-100">{textureNode.label}</div>
        <div className="mt-1 truncate font-mono text-[9px] text-zinc-600">{textureNode.id}</div>
      </div>
      <div className="grid grid-cols-4 border-t border-white/10 font-mono text-[9px]">
        <span className={`px-2 py-1 text-center ${textureNode.bypass ? "bg-amber-300 text-black" : "text-zinc-600"}`}>B</span>
        <span className={`border-l border-white/10 px-2 py-1 text-center ${textureNode.lock ? "bg-zinc-200 text-black" : "text-zinc-600"}`}>L</span>
        <span className={`border-l border-white/10 px-2 py-1 text-center ${isViewer ? "bg-emerald-300 text-black" : "text-zinc-600"}`}>V</span>
        <span className="border-l border-white/10 px-2 py-1 text-center text-zinc-600">
          {operator?.inputs.length ?? 0}:{operator?.outputs.length ?? 0}
        </span>
      </div>
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
        style: { stroke: "rgba(210, 238, 247, 0.54)", strokeWidth: 1.35 },
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
    <section className="relative min-h-[300px] border-t border-[#20252b] bg-[#070b0f]">
      <div className="absolute left-0 right-0 top-0 z-10 flex h-8 items-center justify-between border-b border-[#20252b] bg-[#0b0f13]/95 px-3 backdrop-blur">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
          <span className="text-cyan-300/70">›</span>
          <span>{"/ Workbench"}</span>
          <span className="border-l border-[#20252b] pl-2">{patch.nodes.length} TOPs</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-600">
          <button type="button" className="grid size-6 place-items-center border border-[#20252b] hover:text-zinc-300">⇤</button>
          <button type="button" className="grid size-6 place-items-center border border-[#20252b] hover:text-zinc-300">⇥</button>
          <button type="button" className="grid size-6 place-items-center border border-[#20252b] hover:text-zinc-300">▦</button>
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 48, y: 84, zoom: 0.68 }}
        minZoom={0.3}
        maxZoom={1.6}
        onConnect={handleConnect}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onNodeDoubleClick={(_, node) => setViewerNode(node.id)}
        onNodeDragStop={(_, node) => setNodePosition(node.id, node.position)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.14)" gap={24} size={1} />
        <Controls className="!border-white/10 !bg-zinc-950/90 !text-zinc-200" />
      </ReactFlow>
    </section>
  );
}
