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
  const frameMarks = [1, 120, 240, 360, 480, 600];

  return (
    <section className="relative grid min-h-[360px] grid-rows-[minmax(0,1fr)_48px] overflow-hidden border-b border-[#20252b] bg-[#030407]">
      <canvas
        ref={canvasRef}
        data-testid="texture-viewer-canvas"
        className="h-full min-h-[312px] w-full bg-black"
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

      <div className="pointer-events-none absolute bottom-16 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
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
      <div className="z-10 grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-[#20252b] bg-[#0b0f13] px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPlaying(!playback.playing)}
            aria-label={playback.playing ? "Pause playback" : "Play playback"}
            className="grid size-7 place-items-center border border-[#26303a] bg-[#111820] text-zinc-300 hover:bg-[#18222b]"
          >
            {playback.playing ? "Ⅱ" : "▶"}
          </button>
          <button type="button" aria-label="Stop playback" onClick={() => { setPlaying(false); setFrame(0); }} className="grid size-7 place-items-center border border-[#26303a] text-zinc-500 hover:text-zinc-200">■</button>
          <span className="ml-2 border border-[#26303a] px-2 py-1 font-mono text-[10px] text-zinc-500">{playback.frame.toString().padStart(3, "0")}</span>
        </div>
        <div className="min-w-0">
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
            className="ergon-dark-range"
          />
          <div className="mt-1 grid grid-cols-6 font-mono text-[9px] text-zinc-700">
            {frameMarks.map((mark) => <span key={mark}>{mark}</span>)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <select
            aria-label="Viewer playback rate"
            value={playback.playbackRate}
            onChange={(event) => setPlaybackRate(Number(event.target.value))}
            className="h-7 border border-[#26303a] bg-[#0d1217] px-2 font-mono text-[10px] text-zinc-400"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x</option>
            <option value={2}>2.0x</option>
          </select>
          <button type="button" aria-label="Snapshot" className="grid size-7 place-items-center border border-[#26303a] text-zinc-500 hover:text-zinc-200">◎</button>
          <button type="button" aria-label="Fullscreen" className="grid size-7 place-items-center border border-[#26303a] text-zinc-500 hover:text-zinc-200">⛶</button>
        </div>
      </div>
    </section>
  );
}
