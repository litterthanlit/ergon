"use client";

import { useState } from "react";
import { blocks, BLOCK_ROLES, ROLE_LABELS, type BlockRole } from "@/lib/blocks";

type Props = {
  onSelect: (blockId: string) => void;
  onCancel: () => void;
  filterRole?: BlockRole;
  mode?: "add" | "swap";
};

export function BlockPicker({ onSelect, onCancel, filterRole, mode = "add" }: Props) {
  const [activeRole, setActiveRole] = useState<BlockRole | "all">(filterRole || "all");

  const filteredBlocks = activeRole === "all" ? blocks : blocks.filter((b) => b.role === activeRole);

  return (
    <div className="overflow-hidden rounded-2xl border border-ergon-border bg-white shadow-[0_12px_30px_rgba(10,22,40,0.05)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ergon-subtle">
          {mode === "swap" ? "Swap form" : "Add form"}
        </span>
        <button
          onClick={onCancel}
          className="text-[11px] text-ergon-muted transition-colors hover:text-ergon-text cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ergon-text focus-visible:ring-offset-2"
        >
          Cancel
        </button>
      </div>

      {!filterRole && (
        <div className="mx-4 mb-2 flex rounded-xl border border-ergon-border bg-ergon-surface/60 p-1">
          <button
            onClick={() => setActiveRole("all")}
            className={`flex-1 rounded-lg py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-center cursor-pointer transition-colors ${
              activeRole === "all" ? "bg-white text-ergon-text shadow-sm" : "text-ergon-muted hover:text-ergon-subtle"
            }`}
          >
            All
          </button>
          {BLOCK_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex-1 rounded-lg py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-center cursor-pointer transition-colors ${
                activeRole === role ? "bg-white text-ergon-text shadow-sm" : "text-ergon-muted hover:text-ergon-subtle"
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-56 overflow-y-auto px-2 pb-2">
        {filteredBlocks.map((block) => (
          <button
            key={block.id}
            onClick={() => onSelect(block.id)}
            className="group w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-ergon-surface/70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ergon-text"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ergon-text group-hover:text-ergon-text">{block.name}</span>
              <span className="rounded-full border border-ergon-border/70 bg-ergon-surface px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ergon-muted">
                {ROLE_LABELS[block.role]}
              </span>
            </div>
            <span className="mt-1 block line-clamp-1 text-[10px] text-ergon-muted">
              {block.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
