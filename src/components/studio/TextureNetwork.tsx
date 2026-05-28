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
} from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";
import { StudioSecondaryButton, studio } from "./studio-primitives";

type TextureNodeData = {
  textureNode: TextureNode;
  selected: boolean;
  viewerNodeId: string;
};

const categoryTone: Record<TextureOperatorCategory, string> = {
  generator: "#64d2ff",
  simulation: "#5de6b5",
  modifier: "#bf5af2",
  network: "#ffd60a",
  output: "#30d158",
};

function TextureGraphNode({ data }: NodeProps<Node<TextureNodeData>>) {
  const { textureNode, selected, viewerNodeId } = data;
  const operator = getTextureOperator(textureNode.type);
  const tone = categoryTone[operator?.category ?? "network"];
  const isViewer = viewerNodeId === textureNode.id;

  return (
    <div
      className={`min-w-[140px] overflow-hidden rounded-[10px] border bg-[#2c2c2e] shadow-lg ${
        selected ? "border-[#0a84ff] ring-2 ring-[#0a84ff]/30" : "border-white/[0.1]"
      } ${textureNode.bypass ? "opacity-50" : ""}`}
    >
      {(operator?.inputs ?? []).map((port, index) => (
        <Handle
          key={port.id}
          id={port.id}
          type="target"
          position={Position.Left}
          className="!size-2.5 !rounded-full !border-2 !border-[#1c1c1e]"
          style={{ top: 36 + index * 16, background: tone }}
        />
      ))}
      <div className="mx-2.5 mt-2.5 h-10 rounded-[6px]" style={{ background: `linear-gradient(135deg, ${tone}33, #1c1c1e)` }} />
      <div className="px-2.5 py-2">
        <div className="truncate text-[12px] font-medium text-[#f5f5f7]">{textureNode.label.replace(" TOP", "")}</div>
      </div>
      {isViewer && (
        <span className="absolute bottom-2 right-2 size-1.5 rounded-full bg-[#0a84ff]" />
      )}
      {operator?.outputs.map((port) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={Position.Right}
          className="!size-2.5 !rounded-full !border-2 !border-[#1c1c1e]"
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
          stroke: edge.id === activeEdgeId ? "#f5f5f7" : patch.viewerNodeId === edge.target ? "#0a84ff" : "#636366",
          strokeWidth: edge.id === activeEdgeId ? 2 : patch.viewerNodeId === edge.target ? 1.75 : 1.25,
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
    <section className={`relative h-[240px] shrink-0 border-t ${studio.separator} bg-[#161618]`}>
      <div
        className={`absolute left-0 right-0 top-0 z-10 flex h-9 items-center justify-between border-b ${studio.separator} px-3`}
        style={{ background: "rgba(44, 44, 46, 0.85)" }}
      >
        <span className="text-[12px] font-medium text-[#98989d]">Node Graph</span>
        <div className="flex items-center gap-1">
          <StudioSecondaryButton ariaLabel="Duplicate node" onClick={duplicateSelectedNode} disabled={!canDuplicateSelected}>
            Duplicate
          </StudioSecondaryButton>
          <StudioSecondaryButton ariaLabel="Delete node" onClick={deleteSelectedNode} disabled={!canDeleteSelected}>
            Delete
          </StudioSecondaryButton>
          <label className="sr-only" htmlFor="selected-texture-cable">Selected cable</label>
          <select
            id="selected-texture-cable"
            aria-label="Selected cable"
            value={activeEdgeId}
            onChange={(event) => setSelectedEdgeId(event.target.value)}
            disabled={patch.edges.length === 0}
            className="h-[28px] max-w-[140px] rounded-[6px] border border-white/[0.08] bg-white/[0.06] px-2 text-[11px] text-[#f5f5f7] outline-none disabled:opacity-30"
          >
            {patch.edges.map((edge) => (
              <option key={edge.id} value={edge.id}>
                {edge.source} → {edge.target}
              </option>
            ))}
          </select>
          <StudioSecondaryButton ariaLabel="Disconnect cable" onClick={() => activeEdgeId && disconnectEdge(activeEdgeId)} disabled={!activeEdgeId}>
            Disconnect
          </StudioSecondaryButton>
          <StudioSecondaryButton ariaLabel="Fit graph" onClick={() => flow.fitView({ padding: 0.2, duration: 220 })}>
            Fit
          </StudioSecondaryButton>
          <StudioSecondaryButton ariaLabel="Auto layout" onClick={autoLayout}>
            Layout
          </StudioSecondaryButton>
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 28, y: 80, zoom: 0.82 }}
        minZoom={0.3}
        maxZoom={1.6}
        onConnect={handleConnect}
        onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onNodeDoubleClick={(_, node) => setViewerNode(node.id)}
        onNodeDragStop={(_, node) => setNodePosition(node.id, node.position)}
        proOptions={{ hideAttribution: true }}
        className="bg-[#161618]"
      >
        <Background color="rgba(255,255,255,0.04)" gap={20} size={1} />
        <Controls className="!hidden" />
      </ReactFlow>
    </section>
  );
}
