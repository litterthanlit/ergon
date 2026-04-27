"use client";

import { useEffect, useRef, useState } from "react";
import { createTextureRuntime, type TextureRuntime, type TextureRuntimeCapabilities } from "@/lib/texture-runtime";
import { textureOperators, type TextureRenderPlan } from "@/lib/texture-patch";
import { useTexturePatchStore } from "@/lib/texture-patch-store";

type Props = {
  plan: TextureRenderPlan;
  onRuntimeReady: (runtime: TextureRuntime | null) => void;
};

export function TextureViewer({ plan, onRuntimeReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<TextureRuntime | null>(null);
  const planRef = useRef(plan);
  const setStats = useTexturePatchStore((state) => state.setStats);
  const stats = useTexturePatchStore((state) => state.stats);
  const [capabilities, setCapabilities] = useState<TextureRuntimeCapabilities | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    planRef.current = plan;
    runtimeRef.current?.setPatch(plan);
  }, [plan]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let cancelled = false;

    try {
      const runtime = createTextureRuntime(canvas, textureOperators);
      runtimeRef.current = runtime;
      runtime.setPatch(planRef.current);
      setCapabilities(runtime.getCapabilities());
      onRuntimeReady(runtime);

      const tick = (now: number) => {
        if (cancelled) return;
        const nextStats = runtime.renderFrame(now / 1000);
        if (nextStats.frame % 12 === 0) setStats(nextStats);
        frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      window.queueMicrotask(() => setError(message));
      onRuntimeReady(null);
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
      onRuntimeReady(null);
    };
  }, [onRuntimeReady, setStats]);

  const backendLabel = `${plan.rendererBackend.toUpperCase()} preferred / ${(stats?.backend ?? "webgl2").toUpperCase()} cook`;
  const fallback = capabilities?.fallbackReason && plan.rendererBackend === "webgpu" ? capabilities.fallbackReason : null;

  return (
    <section className="relative min-h-[460px] overflow-hidden border-b border-white/10 bg-[#030407] lg:min-h-[560px]">
      <canvas
        ref={canvasRef}
        data-testid="texture-viewer-canvas"
        className="h-full min-h-[460px] w-full bg-black lg:min-h-[560px]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.11),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_24%,rgba(0,0,0,0.28))] mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:128px_128px]" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.62)]" />

      <div className="pointer-events-none absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
        <div className="border border-white/12 bg-black/58 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-300 backdrop-blur">
          viewer / {plan.viewerNodeId}
        </div>
        <div className="border border-white/12 bg-black/58 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 backdrop-blur">
          {backendLabel}
        </div>
        <div className="border border-white/12 bg-black/58 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 backdrop-blur">
          {plan.quality} / {plan.resolution[0]}x{plan.resolution[1]}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-xl border border-white/12 bg-black/62 px-4 py-3 backdrop-blur">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-200/80">live system</div>
          <div className="mt-1 text-xl font-semibold text-zinc-50">{plan.name}</div>
          <div className="mt-1 text-xs text-zinc-400">
            {plan.passes.length} cooked TOPs · {stats?.persistentBuffers ?? 0} persistent buffers · {stats?.fps.toFixed(0) ?? "--"} fps
          </div>
        </div>
        {fallback && (
          <div className="max-w-sm border border-amber-300/20 bg-amber-950/35 px-3 py-2 text-xs leading-5 text-amber-100/80 backdrop-blur">
            {fallback}
          </div>
        )}
      </div>

      {plan.errors.length > 0 && (
        <div className="absolute right-4 top-4 max-w-xs border border-red-400/30 bg-red-950/70 px-3 py-2 text-xs text-red-100">
          {plan.errors[0]}
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-zinc-100">GPU canvas unavailable</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{error}</p>
          </div>
        </div>
      )}
    </section>
  );
}
