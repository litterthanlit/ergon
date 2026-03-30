"use client";

import { useRef, useEffect, useCallback } from "react";
import { createBridge, type Bridge } from "@/lib/bridge";
import { useStudioStore } from "@/lib/store";

export function Canvas() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<Bridge | null>(null);

  const code = useStudioStore((s) => s.code);
  const values = useStudioStore((s) => s.values);
  const codeVersion = useStudioStore((s) => s.codeVersion);
  const seed = useStudioStore((s) => s.seed);
  const setSchema = useStudioStore((s) => s.setSchema);
  const setStatus = useStudioStore((s) => s.setStatus);
  const setError = useStudioStore((s) => s.setError);
  const aspect = useStudioStore((s) => s.aspect);

  const codeRef = useRef(code);
  codeRef.current = code;
  const valuesRef = useRef(values);
  valuesRef.current = values;

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

  useEffect(() => {
    if (codeVersion > 0 && bridgeRef.current) {
      const iframe = iframeRef.current;
      if (iframe) {
        iframe.src = iframe.src;
      }
    }
  }, [codeVersion]);

  useEffect(() => {
    bridgeRef.current?.updateParams(values);
  }, [values]);

  useEffect(() => {
    bridgeRef.current?.sendSeed(seed);
  }, [seed]);

  useEffect(() => {
    return () => { bridgeRef.current?.destroy(); };
  }, []);

  const aspectClass =
    aspect === "1:1"
      ? "aspect-square"
      : aspect === "16:9"
        ? "aspect-video"
        : aspect === "4:3"
          ? "aspect-[4/3]"
          : "";

  return (
    <div className="w-full h-full flex items-center justify-center bg-ergon-surface">
      <div className={`${aspectClass ? aspectClass + " max-h-full max-w-full" : "w-full h-full"}`}>
        <iframe
          ref={iframeRef}
          title="Ergon Sandbox"
          src="/sandbox/index.html"
          sandbox="allow-scripts"
          onLoad={handleIframeLoad}
          className="w-full h-full border-0"
          style={{ background: "#fafafa" }}
        />
      </div>
    </div>
  );
}
