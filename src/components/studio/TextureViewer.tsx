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

  const fallback = capabilities?.fallbackReason && plan.rendererBackend === "webgpu" ? capabilities.fallbackReason : null;
  const frameLabel = `${(playback.frame / playback.fpsTarget).toFixed(2)}s`;

  return (
    <section className="relative min-h-0 flex-1 bg-black">
      <canvas
        ref={canvasRef}
        data-testid="texture-viewer-canvas"
        className="absolute inset-0 h-full w-full"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 py-2.5">
        <span className="text-[13px] font-medium text-white/90">{plan.name}</span>
        <span className="tabular-nums text-[11px] text-white/45">
          {stats?.fps.toFixed(0) ?? "--"} fps · {plan.quality}
        </span>
      </div>

      {fallback && (
        <div className="absolute right-4 top-12 max-w-xs rounded-[8px] bg-[#2c2c2e]/90 px-3 py-2 text-[12px] leading-relaxed text-[#ffd60a] backdrop-blur-md">
          {fallback}
        </div>
      )}

      {plan.errors.length > 0 && (
        <div className="absolute right-4 top-12 max-w-xs rounded-[8px] bg-red-950/80 px-3 py-2 text-[12px] text-red-100">
          {plan.errors[0]}
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 px-6 text-center">
          <div>
            <p className="text-[15px] font-semibold text-[#f5f5f7]">Preview unavailable</p>
            <p className="mt-2 max-w-md text-pretty text-[13px] leading-relaxed text-[#98989d]">{error}</p>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 border-t border-white/[0.08] bg-black/50 px-4 py-2 backdrop-blur-md">
        <div className="mb-1 flex items-center justify-between text-[11px] text-white/45">
          <span>Timeline</span>
          <span className="tabular-nums">{frameLabel}</span>
        </div>
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
          className="ergon-dark-range w-full"
        />
      </div>

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
