"use client";

import { useRef, useEffect, useCallback } from "react";
import { createBridge, type Bridge } from "@/lib/bridge";
import { useStudioStore } from "@/lib/store";

export function Canvas() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<Bridge | null>(null);

  const code = useStudioStore((s) => s.code);
  const values = useStudioStore((s) => s.values);
  const setSchema = useStudioStore((s) => s.setSchema);
  const setStatus = useStudioStore((s) => s.setStatus);
  const setError = useStudioStore((s) => s.setError);

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const handleIframeLoad = useCallback(() => {
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
      bridge.load(code, valuesRef.current);
    }, 100);
  }, [code, setSchema, setStatus, setError]);

  useEffect(() => {
    bridgeRef.current?.updateParams(values);
  }, [values]);

  useEffect(() => {
    return () => { bridgeRef.current?.destroy(); };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title="Ergon Sandbox"
      src="/sandbox/index.html"
      sandbox="allow-scripts"
      onLoad={handleIframeLoad}
      className="w-full h-full border-0"
      style={{ background: "#000" }}
    />
  );
}
