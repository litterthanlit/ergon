"use client";

import { useState, useCallback } from "react";
import { useCreatorStore, type Trigger } from "@/lib/creator-store";

function captureCanvasThumbnail(): string {
  const canvas = document.querySelector("canvas");
  if (!canvas) return "";
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 200;
  tempCanvas.height = 120;
  const ctx = tempCanvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(canvas, 0, 0, 200, 120);
  return tempCanvas.toDataURL("image/png", 0.5);
}

function TriggerBadge({ trigger }: { trigger: Trigger }) {
  const label =
    trigger.type === "time"
      ? `${(trigger.delay / 1000).toFixed(1)}s`
      : trigger.type === "click"
        ? "tap"
        : `${trigger.param}`;

  return (
    <span
      className="px-1.5 py-0.5 rounded text-[7px] border"
      style={{ background: "var(--bg-card)", borderColor: "var(--off)", color: "var(--text-muted)" }}
    >
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
      <div
        className="w-[60px] border-r flex flex-col items-center justify-center gap-2 shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Scenes</span>
        <button
          onClick={() => setPlaying(!isPlaying)}
          className="w-7 h-7 rounded-full border flex items-center justify-center text-[12px] cursor-pointer transition-colors"
          style={{
            borderColor: isPlaying ? "var(--success)" : "var(--off)",
            color: isPlaying ? "var(--success)" : "var(--text-muted)",
          }}
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
                  className="w-[100px] rounded-lg overflow-hidden cursor-pointer transition-all border"
                  style={{
                    borderColor: isActive ? "var(--accent)" : "var(--border)",
                    background: "var(--bg-card)",
                  }}
                  onClick={() => handleNodeClick(snap.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (confirm(`Delete "${snap.name}"?`)) {
                      deleteSnapshot(snap.id);
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="h-[60px] w-full bg-cover bg-center"
                    style={
                      snap.thumbnail
                        ? { backgroundImage: `url(${snap.thumbnail})` }
                        : { background: "var(--bg-app)" }
                    }
                  />

                  {/* Info section */}
                  <div className="p-1.5">
                    <div
                      className="text-[8px] mb-0.5"
                      style={{ color: isActive ? "var(--accent)" : "var(--text-dim)" }}
                    >
                      SCENE {i + 1}
                    </div>
                    <div className="text-[9px] truncate" style={{ color: "var(--text-primary)" }}>{snap.name}</div>

                    {/* Palette strip */}
                    <div className="flex gap-0.5 mt-1 mb-1">
                      {(snap.state.palette ?? []).slice(0, 5).map((color: string, ci: number) => (
                        <div
                          key={ci}
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraggingFrom(snap.id);
                      }}
                      className="text-[7px] cursor-pointer"
                      style={{ color: "var(--off)" }}
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
                        <div className="w-6 border-t border-dashed" style={{ borderColor: "var(--off)" }} />
                        <TriggerBadge trigger={conn.trigger} />
                        <div className="w-3 border-t border-dashed" style={{ borderColor: "var(--off)" }} />
                        <span className="text-[8px]" style={{ color: "var(--off)" }}>&rarr;</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add scene button */}
          <button
            onClick={() => takeSnapshot(`Scene ${snapshots.length + 1}`, captureCanvasThumbnail())}
            className="w-[100px] h-[60px] rounded-lg border border-dashed flex items-center justify-center text-lg cursor-pointer transition-colors shrink-0"
            style={{ borderColor: "var(--border)", color: "var(--off)" }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
