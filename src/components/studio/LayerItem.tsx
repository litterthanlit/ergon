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
      className={`px-4 py-3.5 border rounded-2xl cursor-pointer transition-all ${
        isSoloed
          ? "border-ergon-accent bg-amber-50/60 ring-1 ring-ergon-accent/20"
          : isActive
            ? "border-ergon-text bg-white shadow-[0_10px_24px_rgba(10,22,40,0.05)]"
            : "border-ergon-border/80 bg-white/70 hover:border-ergon-muted hover:bg-white"
      } ${!visible && !isSoloed ? "opacity-35" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 rounded-full border border-ergon-border/80 bg-ergon-surface px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ergon-muted">
          {ROLE_LABELS[role]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-ergon-text">
              {name}
            </span>
            <div className="flex shrink-0 items-center gap-0.5">
          {/* Solo */}
          <button
            onClick={(e) => { e.stopPropagation(); onSolo(); }}
            className={`rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ergon-text focus-visible:ring-offset-2 ${
              isSoloed ? "text-ergon-accent" : "text-ergon-muted hover:text-ergon-text"
            }`}
            title={isSoloed ? "Release form" : "Isolate form"}
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
            className="p-1 text-ergon-muted hover:text-ergon-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ergon-text focus-visible:ring-offset-2"
            title="Swap form"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M2 4h8M8 2l2 2-2 2" />
              <path d="M10 8H2M4 6l-2 2 2 2" />
            </svg>
          </button>
          {/* Visibility */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className="p-1 text-ergon-muted hover:text-ergon-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ergon-text focus-visible:ring-offset-2"
            title={visible ? "Hide form" : "Reveal form"}
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
            className="p-1 text-ergon-muted hover:text-ergon-red transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ergon-text focus-visible:ring-offset-2"
            title="Remove form"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" />
            </svg>
          </button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-ergon-muted">
              {visible ? "Visible" : "Hidden"}
            </span>
            <span className="text-[10px] text-ergon-border">•</span>
            <span className="text-[10px] text-ergon-muted">
              {Math.round(opacity * 100)}% opacity
            </span>
            <span className="text-[10px] text-ergon-border">•</span>
            <span className="truncate text-[10px] text-ergon-muted">
              {blendMode}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
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
      </div>

      <div className="mt-2">
        <select
          value={blendMode}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onBlendModeChange(e.target.value as BlendMode)}
          className="w-full rounded-lg border border-ergon-border bg-white px-2.5 py-1.5 text-[11px] text-ergon-subtle focus:outline-none focus:ring-2 focus:ring-ergon-text focus:ring-offset-1"
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
