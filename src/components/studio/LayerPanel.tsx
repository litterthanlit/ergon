"use client";

import { useState } from "react";
import { useStudioStore } from "@/lib/store";
import { templates } from "@/lib/templates/registry";
import { getDefaultValues } from "@/lib/types";
import { LayerItem } from "./LayerItem";
import type { BlendMode } from "@/lib/layers";

type Props = {
  onLayerSelect?: () => void;
};

export function LayerPanel({ onLayerSelect }: Props) {
  const layers = useStudioStore((s) => s.layers);
  const activeLayerIndex = useStudioStore((s) => s.activeLayerIndex);
  const addLayer = useStudioStore((s) => s.addLayer);
  const removeLayer = useStudioStore((s) => s.removeLayer);
  const setActiveLayer = useStudioStore((s) => s.setActiveLayer);
  const updateLayerVisibility = useStudioStore((s) => s.updateLayerVisibility);
  const updateLayerOpacity = useStudioStore((s) => s.updateLayerOpacity);
  const updateLayerBlendMode = useStudioStore((s) => s.updateLayerBlendMode);

  const [showPicker, setShowPicker] = useState(false);

  const handleAddFromTemplate = (templateId: string) => {
    const t = templates.find((tpl) => tpl.id === templateId);
    if (t) {
      addLayer(t.id, t.name, t.code, t.schema, getDefaultValues(t.schema));
      // Apply composition hints from template
      if (t.compositionHint) {
        const newLayers = useStudioStore.getState().layers;
        const newLayer = newLayers[newLayers.length - 1];
        if (newLayer) {
          updateLayerOpacity(newLayer.id, t.compositionHint.opacity);
          updateLayerBlendMode(newLayer.id, t.compositionHint.blendMode as BlendMode);
        }
      }
      setShowPicker(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ergon-subtle uppercase tracking-[0.12em]">
          Layers ({layers.length})
        </span>
      </div>

      {/* Layer list — top layer first (reversed from array order) */}
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
              onSelect={() => {
                setActiveLayer(actualIndex);
                onLayerSelect?.();
              }}
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

      {/* Add layer — inline template picker */}
      {showPicker ? (
        <div className="border border-ergon-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-ergon-surface">
            <span className="text-[11px] font-semibold text-ergon-subtle uppercase tracking-[0.1em]">
              Choose template
            </span>
            <button
              onClick={() => setShowPicker(false)}
              className="text-[11px] text-ergon-muted hover:text-ergon-text cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleAddFromTemplate(t.id)}
                className="w-full px-3 py-2 text-left hover:bg-ergon-surface/50 transition-colors border-t border-ergon-border cursor-pointer"
              >
                <span className="text-sm font-medium text-ergon-text block">{t.name}</span>
                <span className="text-[10px] text-ergon-muted block mt-0.5 line-clamp-1">
                  {t.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-2.5 text-sm font-medium text-ergon-subtle border border-dashed border-ergon-border rounded-lg hover:border-ergon-muted hover:bg-ergon-surface/50 transition-colors cursor-pointer"
        >
          + Add layer
        </button>
      )}
    </div>
  );
}
