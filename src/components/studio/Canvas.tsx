"use client";

import { useRef, useEffect, useCallback } from "react";
import { createBridge, type Bridge } from "@/lib/bridge";
import { useStudioStore } from "@/lib/store";
import type { Layer } from "@/lib/layers";

export function Canvas() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<Bridge | null>(null);

  const code = useStudioStore((s) => s.code);
  const values = useStudioStore((s) => s.values);
  const codeVersion = useStudioStore((s) => s.codeVersion);
  const templateId = useStudioStore((s) => s.template?.id);
  const seed = useStudioStore((s) => s.seed);
  const setSchema = useStudioStore((s) => s.setSchema);
  const setStatus = useStudioStore((s) => s.setStatus);
  const setError = useStudioStore((s) => s.setError);
  const aspect = useStudioStore((s) => s.aspect);
  const compositionMode = useStudioStore((s) => s.compositionMode);
  const layers = useStudioStore((s) => s.layers);
  const sharedDrivers = useStudioStore((s) => s.sharedDrivers);

  const layerIframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());
  const layerBridgeRefs = useRef<Map<string, Bridge>>(new Map());

  const codeRef = useRef(code);
  const valuesRef = useRef(values);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const setupBridge = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    bridgeRef.current?.destroy();

    const bridge = createBridge({
      iframe,
      onSchema: (schema) => { setSchema(schema); },
      onReady: () => { setStatus("ready"); },
      onError: (message) => { setError(message); },
    });

    bridgeRef.current = bridge;

    setTimeout(() => {
      bridge.load(codeRef.current, valuesRef.current);
    }, 100);
  }, [setSchema, setStatus, setError]);

  const handleIframeLoad = useCallback(() => {
    setupBridge();
  }, [setupBridge]);

  // Reload sandbox when user presses Run (codeVersion changes)
  useEffect(() => {
    if (codeVersion > 0 && bridgeRef.current) {
      const iframe = iframeRef.current;
      if (iframe) {
        iframe.src = "/sandbox/index.html?" + Date.now();
      }
    }
  }, [codeVersion]);

  // Reload sandbox when template changes — send new code directly to bridge
  // (iframe.src = iframe.src is unreliable for same-URL sandboxed iframes)
  const prevTemplateId = useRef(templateId);
  useEffect(() => {
    if (prevTemplateId.current !== templateId) {
      prevTemplateId.current = templateId;
      if (bridgeRef.current && iframeRef.current) {
        // Force iframe reload with cache-busting param to get fresh p5 state
        iframeRef.current.src = "/sandbox/index.html?" + Date.now();
      }
    }
  }, [templateId]);

  useEffect(() => {
    bridgeRef.current?.updateParams(values);
  }, [values]);

  useEffect(() => {
    bridgeRef.current?.sendSeed(seed);
  }, [seed]);

  useEffect(() => {
    if (!compositionMode) {
      // Send to single bridge too
      bridgeRef.current?.updateDrivers(sharedDrivers.palette, sharedDrivers.tempo);
      return;
    }
    // Send to all layer bridges
    layerBridgeRefs.current.forEach((bridge) => {
      bridge.updateDrivers(sharedDrivers.palette, sharedDrivers.tempo);
    });
  }, [compositionMode, sharedDrivers]);

  useEffect(() => {
    const layerBridges = layerBridgeRefs.current;
    return () => {
      bridgeRef.current?.destroy();
      // Clean up all layer bridges
      layerBridges.forEach((bridge) => bridge.destroy());
      layerBridges.clear();
    };
  }, []);

  useEffect(() => {
    if (!compositionMode) {
      // Clean up all layer bridges when exiting composition mode
      layerBridgeRefs.current.forEach((bridge) => bridge.destroy());
      layerBridgeRefs.current.clear();
      layerIframeRefs.current.clear();
      return;
    }

    layers.forEach((layer) => {
      const bridge = layerBridgeRefs.current.get(layer.id);
      if (bridge) {
        bridge.updateParams(layer.values);
      }
    });

    // Clean up bridges for removed layers
    const currentLayerIds = new Set(layers.map((l) => l.id));
    layerBridgeRefs.current.forEach((bridge, id) => {
      if (!currentLayerIds.has(id)) {
        bridge.destroy();
        layerBridgeRefs.current.delete(id);
        layerIframeRefs.current.delete(id);
      }
    });
  }, [compositionMode, layers]);

  const handleLayerIframeLoad = useCallback((layerId: string, iframe: HTMLIFrameElement) => {
    // Clean up old bridge
    layerBridgeRefs.current.get(layerId)?.destroy();

    const layer = useStudioStore.getState().layers.find((l: Layer) => l.id === layerId);
    if (!layer) return;

    const bridge = createBridge({
      iframe,
      onSchema: () => {},
      onReady: () => {
        // Send transparent AFTER p5 is fully initialized — fixes noLoop() sketches
        const currentLayers = useStudioStore.getState().layers;
        const layerIndex = currentLayers.findIndex((l: Layer) => l.id === layerId);
        if (layerIndex > 0) {
          bridge.setTransparent(true);
        }
      },
      onError: () => {},
    });

    layerBridgeRefs.current.set(layerId, bridge);

    setTimeout(() => {
      bridge.load(layer.code, layer.values);
      // Send shared drivers after load
      const drivers = useStudioStore.getState().sharedDrivers;
      setTimeout(() => {
        bridge.updateDrivers(drivers.palette, drivers.tempo);
      }, 50);
    }, 100);
  }, []);

  const aspectClass =
    aspect === "1:1"
      ? "aspect-square"
      : aspect === "16:9"
        ? "aspect-video"
        : aspect === "4:3"
          ? "aspect-[4/3]"
          : "";

  if (compositionMode) {
    return (
      <div className="w-full h-full relative bg-ergon-surface">
        {layers.map((layer) => (
          <iframe
            key={layer.id}
            ref={(el) => {
              if (el) layerIframeRefs.current.set(layer.id, el);
            }}
            title={`Layer: ${layer.name}`}
            src="/sandbox/index.html"
            sandbox="allow-scripts"
            allow="accelerometer; gyroscope"
            onLoad={(e) => handleLayerIframeLoad(layer.id, e.currentTarget)}
            className="absolute inset-0 w-full h-full border-0"
            style={{
              background: "transparent",
              opacity: layer.visible ? layer.opacity : 0,
              mixBlendMode: layer.blendMode,
              pointerEvents: "none",
              zIndex: layers.indexOf(layer),
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-ergon-surface">
      <div className={`${aspectClass ? aspectClass + " max-h-full max-w-full" : "w-full h-full"}`}>
        <iframe
          ref={iframeRef}
          title="Ergon Sandbox"
          src="/sandbox/index.html"
          sandbox="allow-scripts"
          allow="accelerometer; gyroscope"
          onLoad={handleIframeLoad}
          className="w-full h-full border-0"
          style={{ background: "#09090b" }}
        />
      </div>
    </div>
  );
}
