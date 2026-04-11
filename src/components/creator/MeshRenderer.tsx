"use client";

import { useRef, useEffect } from "react";
import { useCreatorStore } from "@/lib/creator-store";

function noise2d(x: number, y: number, s: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + s) * 43758.5453;
  return n - Math.floor(n);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

type Pos = { x: number; y: number };

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
  const renderMode = useCreatorStore((s) => s.renderMode);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const maybeCtx = el.getContext("2d");
    if (!maybeCtx) return;
    const canvas = el;
    const ctx = maybeCtx;

    let t = 0;

    function getPositions(): Map<string, Pos> {
      const pos = new Map<string, Pos>();
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
      return pos;
    }

    // ---- RENDER MODE: NET (Breathing Net) ----
    function renderNet(pos: Map<string, Pos>, w: number, h: number) {
      // Edge glows
      for (let i = 0; i < edges.length; i++) {
        const from = pos.get(edges[i].from);
        const to = pos.get(edges[i].to);
        if (!from || !to) continue;
        const color = palette[i % palette.length];
        const pulse = Math.sin(t * pulseSpeed * 3 + i * 0.8) * 0.3 + 0.7;

        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.globalAlpha = pulse * 0.12;
        ctx.filter = "blur(8px)"; ctx.stroke();

        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = pulse * 0.9;
        ctx.filter = "none"; ctx.stroke();
      }

      // Vertex glows
      for (const p of points) {
        const vp = pos.get(p.id);
        if (!vp) continue;
        const ec = edges.filter((e) => e.from === p.id || e.to === p.id).length;
        if (ec === 0) continue;
        const glow = Math.sin(t * pulseSpeed * 2 + vp.x * 0.01) * 0.3 + 0.7;
        ctx.beginPath(); ctx.arc(vp.x, vp.y, 2 + ec * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; ctx.globalAlpha = glow * 0.8; ctx.fill();
      }

      // Particles
      void w; void h;
      for (let i = 0; i < edges.length; i++) {
        const from = pos.get(edges[i].from);
        const to = pos.get(edges[i].to);
        if (!from || !to) continue;
        for (let p = 0; p < 3; p++) {
          const progress = ((t * pulseSpeed * 0.5 + i * 0.3 + p * 0.33) % 1);
          ctx.beginPath();
          ctx.arc(from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = palette[i % palette.length]; ctx.globalAlpha = 0.7; ctx.fill();
        }
      }
    }

    // ---- RENDER MODE: STARS (Flowing constellation) ----
    function renderStars(pos: Map<string, Pos>, w: number, h: number) {
      // Faint connections
      for (let i = 0; i < edges.length; i++) {
        const from = pos.get(edges[i].from);
        const to = pos.get(edges[i].to);
        if (!from || !to) continue;
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = palette[i % palette.length]; ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.2; ctx.stroke();
      }

      // Twinkling stars at vertices
      for (const p of points) {
        const vp = pos.get(p.id);
        if (!vp) continue;
        const ec = edges.filter((e) => e.from === p.id || e.to === p.id).length;
        if (ec === 0) continue;

        const twinkle = Math.sin(t * 2 + p.col * 1.3 + p.row * 0.7 + seed) * 0.5 + 0.5;
        const size = 1 + ec * 0.8 + twinkle * 3;

        // Star glow
        ctx.beginPath(); ctx.arc(vp.x, vp.y, size + 8, 0, Math.PI * 2);
        ctx.fillStyle = palette[ec % palette.length];
        ctx.globalAlpha = twinkle * 0.06; ctx.filter = "blur(6px)"; ctx.fill();

        // Star core
        ctx.beginPath(); ctx.arc(vp.x, vp.y, size, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; ctx.globalAlpha = 0.5 + twinkle * 0.5;
        ctx.filter = "none"; ctx.fill();

        // Cross rays
        ctx.globalAlpha = twinkle * 0.3;
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 0.5;
        const ray = size * 3;
        ctx.beginPath(); ctx.moveTo(vp.x - ray, vp.y); ctx.lineTo(vp.x + ray, vp.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(vp.x, vp.y - ray); ctx.lineTo(vp.x, vp.y + ray); ctx.stroke();
      }

      // Scattered background stars
      void w; void h;
      ctx.filter = "none";
      for (let i = 0; i < 60; i++) {
        const sx = noise2d(i * 3.1, seed, 0) * w;
        const sy = noise2d(i * 7.3, seed, 100) * h;
        const st = Math.sin(t * 1.5 + i) * 0.5 + 0.5;
        ctx.beginPath(); ctx.arc(sx, sy, 0.5 + st * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; ctx.globalAlpha = st * 0.15; ctx.fill();
      }
    }

    // ---- RENDER MODE: STRIPES (Vertical color bands) ----
    function renderStripes(pos: Map<string, Pos>) {
      for (let i = 0; i < edges.length; i++) {
        const from = pos.get(edges[i].from);
        const to = pos.get(edges[i].to);
        if (!from || !to) continue;

        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const spread = Math.abs(to.x - from.x) + 60;
        const stripeCount = 12 + i * 4;

        for (let s = 0; s < stripeCount; s++) {
          const offset = (s - stripeCount / 2) * (spread / stripeCount);
          const x = midX + offset;
          const wave = Math.sin(t * pulseSpeed + s * 0.4 + i) * 20;
          const stripeH = 60 + Math.sin(t * 0.5 + s * 0.7) * 40;

          ctx.beginPath(); ctx.moveTo(x + wave, midY - stripeH); ctx.lineTo(x + wave, midY + stripeH);
          ctx.strokeStyle = palette[(i + s) % palette.length];
          ctx.lineWidth = spread / stripeCount * 0.8;
          ctx.globalAlpha = 0.1 + Math.sin(t + s * 0.3) * 0.05;
          ctx.stroke();
        }
      }
    }

    // ---- RENDER MODE: FLOW (Ink flow along edges) ----
    function renderFlow(pos: Map<string, Pos>) {
      for (let i = 0; i < edges.length; i++) {
        const from = pos.get(edges[i].from);
        const to = pos.get(edges[i].to);
        if (!from || !to) continue;
        const color = palette[i % palette.length];
        const [r, g, b] = hexToRgb(color);

        // Many particles flowing along the edge
        for (let p = 0; p < 20; p++) {
          const progress = ((t * pulseSpeed * 0.3 + i * 0.15 + p * 0.05) % 1);
          const px = from.x + (to.x - from.x) * progress;
          const py = from.y + (to.y - from.y) * progress;
          // Drift perpendicular to edge
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          const drift = noise2d(p * 0.5, t * 0.3 + i, seed) * breathe * 3 - breathe * 1.5;

          ctx.beginPath(); ctx.arc(px + nx * drift, py + ny * drift, 1 + noise2d(p, i, t) * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + noise2d(p, t, i) * 0.4})`;
          ctx.globalAlpha = 1; ctx.fill();
        }
      }
    }

    // ---- RENDER MODE: PULSE (Expanding rings from vertices) ----
    function renderPulse(pos: Map<string, Pos>) {
      for (const p of points) {
        const vp = pos.get(p.id);
        if (!vp) continue;
        const ec = edges.filter((e) => e.from === p.id || e.to === p.id).length;
        if (ec === 0) continue;

        const color = palette[ec % palette.length];
        // Multiple rings expanding outward
        for (let ring = 0; ring < 4; ring++) {
          const radius = ((t * pulseSpeed * 30 + ring * 25 + p.col * 10) % 100);
          const alpha = Math.max(0, 1 - radius / 100) * 0.3;
          ctx.beginPath(); ctx.arc(vp.x, vp.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = alpha; ctx.stroke();
        }

        // Center dot
        ctx.beginPath(); ctx.arc(vp.x, vp.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; ctx.globalAlpha = 0.8; ctx.fill();
      }

      // Faint edges
      for (let i = 0; i < edges.length; i++) {
        const from = pos.get(edges[i].from);
        const to = pos.get(edges[i].to);
        if (!from || !to) continue;
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = palette[i % palette.length]; ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.15; ctx.stroke();
      }
    }

    // ---- RENDER MODE: SCATTER (Particles scattered around edges) ----
    function renderScatter(pos: Map<string, Pos>) {
      for (let i = 0; i < edges.length; i++) {
        const from = pos.get(edges[i].from);
        const to = pos.get(edges[i].to);
        if (!from || !to) continue;
        const color = palette[i % palette.length];

        // Scatter particles in the area around the edge
        for (let p = 0; p < 30; p++) {
          const along = noise2d(p * 1.1, i * 0.7, seed + t * 0.1);
          const px = from.x + (to.x - from.x) * along;
          const py = from.y + (to.y - from.y) * along;
          const spread = breathe * 4;
          const ox = (noise2d(p * 2.3, i, seed) - 0.5) * spread;
          const oy = (noise2d(p * 3.1, i, seed + 50) - 0.5) * spread;
          const size = 1 + noise2d(p, i, t * 0.2) * 4;
          const alpha = 0.1 + noise2d(p, t * 0.5, i) * 0.3;

          ctx.beginPath(); ctx.arc(px + ox, py + oy, size, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.fill();
        }
      }
    }

    function animate() {
      const w = canvas.width = canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight;
      t += 0.016 * tempo;

      ctx.clearRect(0, 0, w, h);
      ctx.filter = "none";
      ctx.globalAlpha = 1;

      if (edges.length === 0) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      const pos = getPositions();

      switch (renderMode as string) {
        case "net": renderNet(pos, w, h); break;
        case "stars": renderStars(pos, w, h); break;
        case "stripes": renderStripes(pos); break;
        case "flow": renderFlow(pos); break;
        case "pulse": renderPulse(pos); break;
        case "scatter": renderScatter(pos); break;
        default: renderNet(pos, w, h);
      }

      ctx.globalAlpha = 1;
      ctx.filter = "none";
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [points, edges, palette, tempo, breathe, pulseSpeed, seed, renderMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}
