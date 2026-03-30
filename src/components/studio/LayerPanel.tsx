"use client";

import { useStudioStore } from "@/lib/store";
import { templates } from "@/lib/templates/registry";
import { getDefaultValues } from "@/lib/types";
import { LayerItem } from "./LayerItem";
import type { BlendMode } from "@/lib/layers";

export function LayerPanel() {
  const layers = useStudioStore((s) => s.layers);
  const activeLayerIndex = useStudioStore((s) => s.activeLayerIndex);
  const addLayer = useStudioStore((s) => s.addLayer);
  const removeLayer = useStudioStore((s) => s.removeLayer);
  const setActiveLayer = useStudioStore((s) => s.setActiveLayer);
  const updateLayerVisibility = useStudioStore((s) => s.updateLayerVisibility);
  const updateLayerOpacity = useStudioStore((s) => s.updateLayerOpacity);
  const updateLayerBlendMode = useStudioStore((s) => s.updateLayerBlendMode);

  const handleAddLayer = () => {
    // Cycle through templates for variety
    const templateIndex = layers.length % templates.length;
    const t = templates[templateIndex];
    addLayer(t.id, t.name, t.code, t.schema, getDefaultValues(t.schema));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-ergon-subtle uppercase tracking-[0.14em]">
          Layers
        </span>
        <button
          onClick={handleAddLayer}
          className="text-[10px] font-medium text-ergon-muted hover:text-ergon-text transition-colors uppercase tracking-[0.1em]"
        >
          + Add
        </button>
      </div>

      {/* Layer list — bottom layer first visually (reversed) */}
      <div className="flex flex-col gap-1.5">
        {[...layers].reverse().map((layer, reversedIndex) => {
          const actualIndex = layers.length - 1 - reversedIndex;
          return (
            <LayerItem
              key={layer.id}
              name={layer.name}
              visible={layer.visible}
              opacity={layer.opacity}
              blendMode={layer.blendMode}
              isActive={actualIndex === activeLayerIndex}
              onSelect={() => setActiveLayer(actualIndex)}
              onToggleVisibility={() => updateLayerVisibility(layer.id, !layer.visible)}
              onOpacityChange={(opacity) => updateLayerOpacity(layer.id, opacity)}
              onBlendModeChange={(mode: BlendMode) => updateLayerBlendMode(layer.id, mode)}
              onRemove={() => {
                if (layers.length > 1) removeLayer(layer.id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
