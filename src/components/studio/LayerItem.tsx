"use client";

import type { BlendMode } from "@/lib/layers";
import { BLEND_MODES } from "@/lib/layers";
import { ROLE_LABELS, type BlockRole } from "@/lib/blocks";

type Props = {
  name: string;
  role: BlockRole;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  isActive: boolean;
  isSoloed: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onOpacityChange: (opacity: number) => void;
  onBlendModeChange: (mode: BlendMode) => void;
  onSolo: () => void;
  onSwap: () => void;
  onRemove: () => void;
};

export function LayerItem({
  name,
  role,
  visible,
  opacity,
  blendMode,
  isActive,
  isSoloed,
  onSelect,
  onToggleVisibility,
  onOpacityChange,
  onBlendModeChange,
  onSolo,
  onSwap,
  onRemove,
}: Props) {
  return (
    <div
      data-testid="layer-item"
      onClick={onSelect}
      className={`px-3.5 py-3 border rounded-lg cursor-pointer transition-all ${
        isSoloed
          ? "border-ergon-accent/50 bg-ergon-accent/5"
          : isActive
            ? "border-ergon-border bg-ergon-elevated"
            : "border-transparent hover:border-ergon-border hover:bg-ergon-elevated/50"
      } ${!visible && !isSoloed ? "opacity-30" : ""}`}
    >
      {/* Top row: role badge + name + actions */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-ergon-muted bg-ergon-bg px-1.5 py-0.5 rounded shrink-0">
          {ROLE_LABELS[role]}
        </span>
        <span className="text-sm font-medium text-ergon-text truncate flex-1">
          {name}
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Solo */}
          <button
            onClick={(e) => { e.stopPropagation(); onSolo(); }}
            className={`p-1 rounded transition-colors ${
              isSoloed ? "text-ergon-accent" : "text-ergon-muted hover:text-ergon-text"
            }`}
            title={isSoloed ? "Unsolo" : "Solo"}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
              {isSoloed ? (
                <><circle cx="6" cy="6" r="4.5" /><circle cx="6" cy="6" r="1.5" fill="currentColor" /></>
              ) : (
                <circle cx="6" cy="6" r="4.5" />
              )}
            </svg>
          </button>
          {/* Swap */}
          <button
            onClick={(e) => { e.stopPropagation(); onSwap(); }}
            className="p-1 text-ergon-muted hover:text-ergon-text transition-colors"
            title="Swap block"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M2 4h8M8 2l2 2-2 2" />
              <path d="M10 8H2M4 6l-2 2 2 2" />
            </svg>
          </button>
          {/* Visibility */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className="p-1 text-ergon-muted hover:text-ergon-text transition-colors"
            title={visible ? "Hide" : "Show"}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              {visible ? (
                <><circle cx="6" cy="6" r="2" /><path d="M1 6s2-3.5 5-3.5S11 6 11 6s-2 3.5-5 3.5S1 6 1 6z" /></>
              ) : (
                <><path d="M1 1l10 10" /><path d="M4.5 4.5a2 2 0 0 0 3 3" /><path d="M1 6s2-3.5 5-3.5c1 0 1.8.3 2.5.7" /></>
              )}
            </svg>
          </button>
          {/* Remove */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1 text-ergon-muted hover:text-ergon-red transition-colors"
            title="Remove"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-2 mt-2.5">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={opacity}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="text-[10px] font-mono text-ergon-muted w-7 text-right">
          {Math.round(opacity * 100)}%
        </span>
      </div>

      {/* Blend mode */}
      <div className="mt-2">
        <select
          value={blendMode}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onBlendModeChange(e.target.value as BlendMode)}
          className="w-full text-[11px] text-ergon-subtle bg-ergon-bg border border-ergon-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-ergon-muted"
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
