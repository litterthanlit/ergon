"use client";

import { useState } from "react";
import { blocks, BLOCK_ROLES, ROLE_LABELS, type BlockRole } from "@/lib/blocks";

type Props = {
  onSelect: (blockId: string) => void;
  onCancel: () => void;
  filterRole?: BlockRole;
};

export function BlockPicker({ onSelect, onCancel, filterRole }: Props) {
  const [activeRole, setActiveRole] = useState<BlockRole | "all">(filterRole || "all");

  const filteredBlocks = activeRole === "all"
    ? blocks
    : blocks.filter((b) => b.role === activeRole);

  return (
    <div className="border border-ergon-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-ergon-surface">
        <span className="text-[11px] font-semibold text-ergon-subtle uppercase tracking-[0.1em]">
          Choose block
        </span>
        <button
          onClick={onCancel}
          className="text-[11px] text-ergon-muted hover:text-ergon-text cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Role tabs */}
      {!filterRole && (
        <div className="flex border-y border-ergon-border">
          <button
            onClick={() => setActiveRole("all")}
            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-center cursor-pointer transition-colors ${
              activeRole === "all" ? "text-ergon-text bg-white" : "text-ergon-muted hover:text-ergon-subtle bg-ergon-surface/50"
            }`}
          >
            All
          </button>
          {BLOCK_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-center cursor-pointer transition-colors ${
                activeRole === role ? "text-ergon-text bg-white" : "text-ergon-muted hover:text-ergon-subtle bg-ergon-surface/50"
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}

      {/* Block list */}
      <div className="max-h-56 overflow-y-auto">
        {filteredBlocks.map((block) => (
          <button
            key={block.id}
            onClick={() => onSelect(block.id)}
            className="w-full px-4 py-2.5 text-left hover:bg-ergon-surface/50 transition-colors border-t border-ergon-border cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ergon-text">{block.name}</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ergon-muted bg-ergon-surface px-1.5 py-0.5 rounded">
                {ROLE_LABELS[block.role]}
              </span>
            </div>
            <span className="text-[10px] text-ergon-muted block mt-0.5 line-clamp-1">
              {block.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
