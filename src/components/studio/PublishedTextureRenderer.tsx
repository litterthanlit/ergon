"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { compileTexturePatch, textureOperators, type TexturePatch } from "@/lib/texture-patch";
import { createTextureRuntime, type TextureRuntime } from "@/lib/texture-runtime";

type Props = {
  patch: TexturePatch;
  title: string;
};

export function PublishedTextureRenderer({ patch, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<TextureRuntime | null>(null);
  const plan = useMemo(() => compileTexturePatch(patch), [patch]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;
    let cancelled = false;
    const startedAt = performance.now();

    try {
      const runtime = createTextureRuntime(canvas, textureOperators);
      runtimeRef.current = runtime;
      runtime.setPatch(plan);

      const tick = (now: number) => {
        if (cancelled) return;
        runtime.renderFrame((now - startedAt) / 1000);
        frame = window.requestAnimationFrame(tick);
      };

      frame = window.requestAnimationFrame(tick);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      window.queueMicrotask(() => setError(message));
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
  }, [plan]);

  return (
    <section data-testid="published-texture-renderer" className="absolute inset-0 bg-black">
      <canvas
        ref={canvasRef}
        aria-label={title}
        className="absolute inset-0 h-full w-full bg-black"
      />
      {plan.errors.length > 0 && (
        <div className="absolute right-5 top-5 max-w-sm rounded-lg border border-red-400/30 bg-red-950/80 px-4 py-3 text-sm text-red-100">
          {plan.errors[0]}
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Texture renderer unavailable</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{error}</p>
          </div>
        </div>
      )}
    </section>
  );
}
