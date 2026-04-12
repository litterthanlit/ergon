"use client";

import { useState, useCallback } from "react";
import { useCreatorStore, type Trigger } from "@/lib/creator-store";

function TriggerBadge({ trigger }: { trigger: Trigger }) {
  const label =
    trigger.type === "time"
      ? `${(trigger.delay / 1000).toFixed(1)}s`
      : trigger.type === "click"
        ? "tap"
        : `${trigger.param}`;

  return (
    <span className="px-1.5 py-0.5 bg-[#18181b] border border-[#3f3f46] rounded text-[7px] text-[#71717a]">
      {label}
    </span>
  );
}

export function SequencerPanel() {
  const snapshots = useCreatorStore((s) => s.snapshots);
  const connections = useCreatorStore((s) => s.connections);
  const activeSnapshotId = useCreatorStore((s) => s.activeSnapshotId);
  const isPlaying = useCreatorStore((s) => s.isPlaying);
  const loadSnapshot = useCreatorStore((s) => s.loadSnapshot);
  const deleteSnapshot = useCreatorStore((s) => s.deleteSnapshot);
  const addConnection = useCreatorStore((s) => s.addConnection);
  const removeConnection = useCreatorStore((s) => s.removeConnection);
  const setPlaying = useCreatorStore((s) => s.setPlaying);
  const takeSnapshot = useCreatorStore((s) => s.takeSnapshot);

  const [draggingFrom, setDraggingFrom] = useState<string | null>(null);

  const handleNodeClick = useCallback(
    (snapId: string) => {
      if (draggingFrom) {
        if (draggingFrom !== snapId) {
          addConnection(draggingFrom, snapId, { type: "time", delay: 3000 });
        }
        setDraggingFrom(null);
      } else {
        loadSnapshot(snapId);
      }
    },
    [draggingFrom, addConnection, loadSnapshot],
  );

  return (
    <div className="flex h-full">
      {/* Transport column */}
      <div className="w-[60px] border-r border-[#27272a] flex flex-col items-center justify-center gap-2 shrink-0">
        <span className="text-[9px] text-[#52525b] uppercase tracking-wider">Scenes</span>
        <button
          onClick={() => setPlaying(!isPlaying)}
          className="w-7 h-7 rounded-full border border-[#3f3f46] flex items-center justify-center text-[12px] cursor-pointer hover:border-[#00ffa3] transition-colors"
          style={{ color: isPlaying ? "#00ffa3" : "#71717a" }}
        >
          {isPlaying ? "\u23F8" : "\u25B6"}
        </button>
      </div>

      {/* Scene graph canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3">
        <div className="flex items-start gap-4 min-w-max h-full">
          {snapshots.map((snap, i) => {
            const outConns = connections.filter((c) => c.from === snap.id);
            const isActive = snap.id === activeSnapshotId;

            return (
              <div key={snap.id} className="flex items-center gap-3">
                {/* Scene node card */}
                <div
                  className={`w-[90px] rounded-lg p-2 cursor-pointer transition-all border ${
                    isActive
                      ? "border-[#a78bfa] bg-[#18181b]"
                      : "border-[#27272a] bg-[#18181b] hover:border-[#3f3f46]"
                  }`}
                  onClick={() => handleNodeClick(snap.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (confirm(`Delete "${snap.name}"?`)) {
                      deleteSnapshot(snap.id);
                    }
                  }}
                >
                  <div className={`text-[8px] mb-0.5 ${isActive ? "text-[#a78bfa]" : "text-[#52525b]"}`}>
                    SCENE {i + 1}
                  </div>
                  <div className="text-[9px] text-[#e4e4e7] truncate">{snap.name}</div>
                  <div className="mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraggingFrom(snap.id);
                      }}
                      className="text-[7px] text-[#3f3f46] hover:text-[#71717a] cursor-pointer"
                    >
                      {draggingFrom === snap.id ? "click target..." : "connect \u2192"}
                    </button>
                  </div>
                </div>

                {/* Connection arrows */}
                {outConns.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {outConns.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => removeConnection(conn.id)}
                        title="Click to remove"
                      >
                        <div className="w-6 border-t border-dashed border-[#3f3f46]" />
                        <TriggerBadge trigger={conn.trigger} />
                        <div className="w-3 border-t border-dashed border-[#3f3f46]" />
                        <span className="text-[8px] text-[#3f3f46]">&rarr;</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add scene button */}
          <button
            onClick={() => takeSnapshot(`Scene ${snapshots.length + 1}`)}
            className="w-[90px] h-[60px] rounded-lg border border-dashed border-[#27272a] flex items-center justify-center text-[#3f3f46] text-lg hover:border-[#3f3f46] hover:text-[#52525b] cursor-pointer transition-colors shrink-0"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
