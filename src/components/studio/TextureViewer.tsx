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
  const playback = useTexturePatchStore((state) => state.playback);
  const setPlaying = useTexturePatchStore((state) => state.setPlaying);
  const setFrame = useTexturePatchStore((state) => state.setFrame);
  const setPlaybackRate = useTexturePatchStore((state) => state.setPlaybackRate);
  const [capabilities, setCapabilities] = useState<TextureRuntimeCapabilities | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playbackRef = useRef(playback);
  const playbackClockRef = useRef<{ lastNow: number | null; frame: number }>({ lastNow: null, frame: playback.frame });

  useEffect(() => {
    planRef.current = plan;
    runtimeRef.current?.setPatch(plan);
  }, [plan]);

  useEffect(() => {
    playbackRef.current = playback;
    playbackClockRef.current.frame = playback.frame;
  }, [playback]);

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
        const playbackState = playbackRef.current;
        if (playbackState.playing) {
          const lastNow = playbackClockRef.current.lastNow ?? now;
          const deltaFrames = ((now - lastNow) / 1000) * playbackState.fpsTarget * playbackState.playbackRate;
          playbackClockRef.current.frame = playbackClockRef.current.frame + deltaFrames;
          if (playbackState.loop) playbackClockRef.current.frame %= playbackState.durationFrames;
          else playbackClockRef.current.frame = Math.min(playbackClockRef.current.frame, playbackState.durationFrames);
          playbackClockRef.current.lastNow = now;
          if (Math.floor(playbackClockRef.current.frame) !== playbackState.frame) {
            setFrame(Math.floor(playbackClockRef.current.frame));
          }
        } else {
          playbackClockRef.current.lastNow = now;
        }
        const renderTime = (playbackState.playing ? playbackClockRef.current.frame : playbackState.frame) / playbackState.fpsTarget;
        const nextStats = runtime.renderFrame(renderTime);
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
  }, [onRuntimeReady, setFrame, setStats]);

  const backendLabel = `${plan.rendererBackend.toUpperCase()} preferred / ${(stats?.backend ?? "webgl2").toUpperCase()} cook`;
  const fallback = capabilities?.fallbackReason && plan.rendererBackend === "webgpu" ? capabilities.fallbackReason : null;

  return (
    <section className="relative h-full min-h-[360px] overflow-hidden bg-[#030507]">
      <canvas
        ref={canvasRef}
        data-testid="texture-viewer-canvas"
        className="absolute inset-0 h-full w-full bg-black"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_42%_16%,rgba(255,255,255,0.18),transparent_16%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent_52%,rgba(0,0,0,0.24))] mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_80px_130px_rgba(0,0,0,0.48),inset_0_-80px_120px_rgba(0,0,0,0.42)]" />

      <div className="pointer-events-none absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3 text-xs text-zinc-400">
        <div className="rounded-lg border border-white/10 bg-black/28 px-3 py-2 backdrop-blur-xl">
          <span className="text-zinc-200">{plan.name}</span>
          <span className="mx-2 text-zinc-600">·</span>
          <span>{plan.passes.length} nodes</span>
          <span className="mx-2 text-zinc-600">·</span>
          <span>{stats?.fps.toFixed(0) ?? "--"} fps</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/28 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] backdrop-blur-xl">
          {backendLabel} · {plan.quality} · {plan.resolution[0]}x{plan.resolution[1]}
        </div>
        {fallback && (
          <div className="max-w-sm rounded-lg border border-amber-300/20 bg-amber-950/35 px-3 py-2 leading-5 text-amber-100/80 backdrop-blur">
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
      <input
        aria-label="Timeline frame"
        type="range"
        min={0}
        max={playback.durationFrames}
        value={playback.frame}
        onChange={(event) => {
          setPlaying(false);
          setFrame(Number(event.target.value));
        }}
        className="sr-only"
      />
      <select
        aria-label="Viewer playback rate"
        value={playback.playbackRate}
        onChange={(event) => setPlaybackRate(Number(event.target.value))}
        className="sr-only"
      >
        <option value={0.5}>0.5x</option>
        <option value={1}>1.0x</option>
        <option value={2}>2.0x</option>
      </select>
    </section>
  );
}
