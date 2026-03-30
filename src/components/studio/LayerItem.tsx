"use client";

import type { BlendMode } from "@/lib/layers";
import { BLEND_MODES } from "@/lib/layers";

type Props = {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  isActive: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onOpacityChange: (opacity: number) => void;
  onBlendModeChange: (mode: BlendMode) => void;
  onRemove: () => void;
};

export function LayerItem({
  name,
  visible,
  opacity,
  blendMode,
  isActive,
  onSelect,
  onToggleVisibility,
  onOpacityChange,
  onBlendModeChange,
  onRemove,
}: Props) {
  return (
    <div
      data-testid="layer-item"
      onClick={onSelect}
      className={`px-3 py-2.5 border rounded cursor-pointer transition-colors ${
        isActive
          ? "border-ergon-text bg-ergon-surface"
          : "border-ergon-border hover:border-ergon-muted"
      } ${!visible ? "opacity-40" : ""}`}
    >
      {/* Top row: name + visibility + remove */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-ergon-text truncate">
          {name}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className="p-0.5 text-ergon-muted hover:text-ergon-text transition-colors"
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
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-0.5 text-ergon-muted hover:text-ergon-red transition-colors"
            title="Remove"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Opacity — always visible */}
      <div className="flex items-center gap-2 mt-1">
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

      {/* Blend mode — always visible as dropdown */}
      <div className="mt-1.5">
        <select
          value={blendMode}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onBlendModeChange(e.target.value as BlendMode)}
          className="w-full text-[11px] text-ergon-subtle bg-white border border-ergon-border rounded px-2 py-1 focus:outline-none focus:border-ergon-text"
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
