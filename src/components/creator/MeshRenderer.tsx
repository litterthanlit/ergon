"use client";

import { useRef, useEffect } from "react";
import { useCreatorStore } from "@/lib/creator-store";

export function MeshRenderer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const points = useCreatorStore((s) => s.points);
  const edges = useCreatorStore((s) => s.edges);
  const palette = useCreatorStore((s) => s.palette);
  const tempo = useCreatorStore((s) => s.tempo);
  const breathe = useCreatorStore((s) => s.breathe);
  const pulseSpeed = useCreatorStore((s) => s.pulseSpeed);
  const seed = useCreatorStore((s) => s.seed);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const maybeCtx = el.getContext("2d");
    if (!maybeCtx) return;

    // Capture in local consts so TS knows they're non-null in the closure
    const canvas = el;
    const ctx = maybeCtx;

    let t = 0;

    function noise2d(x: number, y: number, s: number): number {
      const n = Math.sin(x * 12.9898 + y * 78.233 + s) * 43758.5453;
      return n - Math.floor(n);
    }

    function animate() {
      const w = canvas.width = canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight;
      t += 0.016 * tempo;

      ctx.clearRect(0, 0, w, h);

      if (edges.length === 0) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      // Build position lookup: all points get {x, y}, connected ones get displaced
      const pos = new Map<string, { x: number; y: number }>();
      for (const p of points) {
        const connected = edges.some((e) => e.from === p.id || e.to === p.id);
        if (connected) {
          const nx = noise2d(p.col * 0.7, p.row * 0.7 + t * 0.5, seed) - 0.5;
          const ny = noise2d(p.col * 0.7 + 100, p.row * 0.7 + t * 0.5, seed) - 0.5;
          pos.set(p.id, { x: p.worldX + nx * breathe * 2, y: p.worldY + ny * breathe * 2 });
        } else {
          pos.set(p.id, { x: p.worldX, y: p.worldY });
        }
      }

      // Draw edge glows
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const from = pos.get(edge.from);
        const to = pos.get(edge.to);
        if (!from || !to) continue;

        const colorIdx = i % palette.length;
        const color = palette[colorIdx];

        // Pulse: opacity oscillates along the edge
        const pulse = Math.sin(t * pulseSpeed * 3 + i * 0.8) * 0.3 + 0.7;

        // Glow line (thick, blurred)
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.globalAlpha = pulse * 0.15;
        ctx.filter = "blur(8px)";
        ctx.stroke();

        // Core line
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = pulse * 0.9;
        ctx.filter = "none";
        ctx.stroke();
      }

      // Draw vertex glows at connected points
      for (const p of points) {
        const connected = edges.some((e) => e.from === p.id || e.to === p.id);
        if (!connected) continue;
        const vp = pos.get(p.id);
        if (!vp) continue;
        const edgeCount = edges.filter((e) => e.from === p.id || e.to === p.id).length;
        const glow = Math.sin(t * pulseSpeed * 2 + vp.x * 0.01) * 0.3 + 0.7;
        const radius = 2 + edgeCount * 1.5;

        ctx.beginPath();
        ctx.arc(vp.x, vp.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = palette[0];
        ctx.globalAlpha = glow * 0.1;
        ctx.filter = "blur(6px)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(vp.x, vp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = glow * 0.8;
        ctx.filter = "none";
        ctx.fill();
      }

      // Particles flowing along edges
      ctx.globalAlpha = 1;
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const from = pos.get(edge.from);
        const to = pos.get(edge.to);
        if (!from || !to) continue;

        const colorIdx = i % palette.length;
        // 2 particles per edge
        for (let p = 0; p < 2; p++) {
          const progress = ((t * pulseSpeed * 0.5 + i * 0.3 + p * 0.5) % 1);
          const px = from.x + (to.x - from.x) * progress;
          const py = from.y + (to.y - from.y) * progress;

          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = palette[colorIdx];
          ctx.globalAlpha = 0.6;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      ctx.filter = "none";

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [points, edges, palette, tempo, breathe, pulseSpeed, seed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}
