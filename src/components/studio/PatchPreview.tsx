"use client";

import { useCallback, useEffect, useRef } from "react";
import { createBridge, type Bridge } from "@/lib/bridge";
import type { RenderPlanLayer } from "@/lib/visual-patch";

type Props = {
  layers: RenderPlanLayer[];
};

export function PatchPreview({ layers }: Props) {
  const bridgeRefs = useRef<Map<string, Bridge>>(new Map());
  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());
  const layersRef = useRef(layers);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    const bridges = bridgeRefs.current;
    const iframes = iframeRefs.current;
    return () => {
      bridges.forEach((bridge) => bridge.destroy());
      bridges.clear();
      iframes.clear();
    };
  }, []);

  useEffect(() => {
    const layerIds = new Set(layers.map((layer) => layer.nodeId));
    bridgeRefs.current.forEach((bridge, id) => {
      if (!layerIds.has(id)) {
        bridge.destroy();
        bridgeRefs.current.delete(id);
        iframeRefs.current.delete(id);
      }
    });

    layers.forEach((layer) => {
      bridgeRefs.current.get(layer.nodeId)?.updateParams(layer.params);
    });
  }, [layers]);

  const handleLoad = useCallback((layerId: string, iframe: HTMLIFrameElement) => {
    bridgeRefs.current.get(layerId)?.destroy();
    const layer = layersRef.current.find((item) => item.nodeId === layerId);
    if (!layer) return;

    const bridge = createBridge({
      iframe,
      onSchema: () => {},
      onReady: () => {
        const index = layersRef.current.findIndex((item) => item.nodeId === layerId);
        if (index > 0) bridge.setTransparent(true);
      },
      onError: () => {},
    });

    bridgeRefs.current.set(layerId, bridge);
    setTimeout(() => {
      bridge.load(layer.code, layer.params);
    }, 80);
  }, []);

  return (
    <div className="relative h-full min-h-[360px] overflow-hidden rounded-[22px] border border-white/10 bg-black shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.12),transparent_28%),linear-gradient(180deg,transparent,rgba(0,0,0,0.24))]" />
      <div className="pointer-events-none absolute inset-0 z-20 opacity-70 mix-blend-screen [background-image:radial-gradient(circle_at_28%_22%,rgba(56,189,248,0.55),transparent_24%),radial-gradient(circle_at_62%_44%,rgba(244,114,182,0.42),transparent_28%),radial-gradient(circle_at_74%_76%,rgba(167,139,250,0.34),transparent_24%),linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.08)_42%,transparent_44%)]" />
      {layers.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-zinc-500">
          Connect a source into output to render the patch.
        </div>
      ) : (
        layers.map((layer, index) => (
          <iframe
            key={layer.nodeId}
            ref={(el) => {
              if (el) iframeRefs.current.set(layer.nodeId, el);
            }}
            title={`Patch layer: ${layer.nodeId}`}
            src="/sandbox/index.html"
            sandbox="allow-scripts"
            allow="accelerometer; gyroscope"
            onLoad={(event) => handleLoad(layer.nodeId, event.currentTarget)}
            className="absolute inset-0 h-full w-full border-0"
            style={{
              background: index === 0 ? "#050505" : "transparent",
              mixBlendMode: layer.blendMode,
              opacity: layer.opacity,
              pointerEvents: "none",
              zIndex: index,
            }}
          />
        ))
      )}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-full border border-white/12 bg-black/50 px-3 py-1.5 text-[11px] font-medium text-zinc-300 backdrop-blur-md">
        Live output · {layers.length} operators
      </div>
    </div>
  );
}
