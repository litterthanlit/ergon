"use client";

import { useState } from "react";
import { useStudioStore } from "@/lib/store";
import { getBlock } from "@/lib/blocks";
import { getDefaultValues } from "@/lib/types";
import { LayerItem } from "./LayerItem";
import { BlockPicker } from "./BlockPicker";
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
  const swapBlock = useStudioStore((s) => s.swapBlock);
  const soloLayer = useStudioStore((s) => s.soloLayer);
  const soloLayerId = useStudioStore((s) => s.soloLayerId);

  const [showPicker, setShowPicker] = useState(false);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);

  const handleAddBlock = (blockId: string) => {
    const block = getBlock(blockId);
    if (block) {
      addLayer(block.id, block.role, block.name, block.code, block.schema, getDefaultValues(block.schema));
      // Apply block defaults
      const newLayers = useStudioStore.getState().layers;
      const newLayer = newLayers[newLayers.length - 1];
      if (newLayer) {
        updateLayerOpacity(newLayer.id, block.defaults.opacity);
        updateLayerBlendMode(newLayer.id, block.defaults.blendMode as BlendMode);
      }
    }
    setShowPicker(false);
  };

  const handleSwapBlock = (blockId: string) => {
    if (swapTarget) {
      swapBlock(swapTarget, blockId);
      setSwapTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-ergon-subtle uppercase tracking-[0.12em]">
            Forms ({layers.length})
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-ergon-muted">
          Keep the stack simple. Swap or isolate a form to compare how each one changes the piece.
        </p>
      </div>

      {/* Layer list */}
      <div className="flex flex-col gap-2.5">
        {[...layers].reverse().map((layer, reversedIndex) => {
          const actualIndex = layers.length - 1 - reversedIndex;
          return (
            <LayerItem
              key={layer.id}
              name={layer.name}
              role={layer.role}
              visible={layer.visible}
              opacity={layer.opacity}
              blendMode={layer.blendMode}
              isActive={actualIndex === activeLayerIndex}
              isSoloed={soloLayerId === layer.id}
              onSelect={() => {
                setActiveLayer(actualIndex);
                onLayerSelect?.();
              }}
              onToggleVisibility={() => updateLayerVisibility(layer.id, !layer.visible)}
              onOpacityChange={(opacity) => updateLayerOpacity(layer.id, opacity)}
              onBlendModeChange={(mode: BlendMode) => updateLayerBlendMode(layer.id, mode)}
              onSolo={() => soloLayer(layer.id)}
              onSwap={() => setSwapTarget(layer.id)}
              onRemove={() => {
                if (layers.length > 1) removeLayer(layer.id);
              }}
            />
          );
        })}
      </div>

      {/* Swap picker */}
      {swapTarget && (
        <BlockPicker
          onSelect={handleSwapBlock}
          onCancel={() => setSwapTarget(null)}
          filterRole={layers.find((l) => l.id === swapTarget)?.role}
          mode="swap"
        />
      )}

      {/* Add block picker */}
      {showPicker && !swapTarget ? (
        <BlockPicker
          onSelect={handleAddBlock}
          onCancel={() => setShowPicker(false)}
          mode="add"
        />
      ) : !swapTarget ? (
        <button
          onClick={() => setShowPicker(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ergon-border bg-white/60 px-4 py-3 text-sm font-medium text-ergon-subtle transition-colors hover:border-ergon-muted hover:bg-white cursor-pointer"
        >
          <span className="text-base leading-none">+</span>
          <span>Add form</span>
        </button>
      ) : null}
    </div>
  );
}
