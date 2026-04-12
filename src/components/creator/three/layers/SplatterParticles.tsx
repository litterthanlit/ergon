"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCreatorStore } from "@/lib/creator-store";
import { useQuality } from "../AdaptiveQuality";

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildSplatTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function hslShift(hex: string, hShift: number, sShift: number, lShift: number): [number, number, number] {
  // Parse hex to r,g,b [0-1]
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const h = ((hsl.h + hShift) % 1 + 1) % 1;
  const s = Math.max(0, Math.min(1, hsl.s + sShift));
  const l = Math.max(0, Math.min(1, hsl.l + lShift));
  const out = new THREE.Color().setHSL(h, s, l);
  return [out.r, out.g, out.b];
}

export function SplatterParticles() {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useCreatorStore((s) => s.nodes);
  const seed = useCreatorStore((s) => s.seed);
  const tempo = useCreatorStore((s) => s.tempo);
  const palette = useCreatorStore((s) => s.palette);
  const config = useCreatorStore((s) => s.layers.splatter);
  const quality = useQuality();

  const baseColor = config.color ?? palette[3] ?? "#f39c12";
  const count = Math.floor((config.params.count ?? 100) * quality.particleMultiplier);
  const spread = config.params.spread ?? 50;
  const splashiness = config.params.splashiness ?? 0.5;
  const particleSize = config.params.size ?? 8;

  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    return buildSplatTexture();
  }, []);

  const { positions, colors } = useMemo(() => {
    if (nodes.length === 0) return { positions: new Float32Array(0), colors: new Float32Array(0) };

    const perNode = Math.max(1, Math.floor(count / nodes.length));
    const total = perNode * nodes.length;
    const pos = new Float32Array(total * 3);
    const col = new Float32Array(total * 3);

    let idx = 0;
    for (let n = 0; n < nodes.length; n++) {
      const [nx, ny, nz] = nodes[n].position;
      for (let p = 0; p < perNode; p++) {
        const r0 = seeded(seed, idx * 7 + 0);
        const r1 = seeded(seed, idx * 7 + 1);
        const r2 = seeded(seed, idx * 7 + 2);
        const r3 = seeded(seed, idx * 7 + 3);
        const r4 = seeded(seed, idx * 7 + 4);
        const r5 = seeded(seed, idx * 7 + 5);

        // Paint-splat: mostly flat (small z variance), wide xy splash
        const splashRadius = spread * (0.5 + splashiness * r3);
        const angle = r0 * Math.PI * 2;
        const radius = splashRadius * Math.sqrt(r1); // uniform disk distribution
        const x = nx + Math.cos(angle) * radius;
        const y = ny + Math.sin(angle) * radius;
        const z = nz + (r2 - 0.5) * spread * 0.2; // shallow z

        const i3 = idx * 3;
        pos[i3] = x;
        pos[i3 + 1] = y;
        pos[i3 + 2] = z;

        // Per-particle color with HSL variation
        const hShift = (r4 - 0.5) * 0.12;
        const lShift = (r5 - 0.5) * 0.3;
        const [cr, cg, cb] = hslShift(baseColor, hShift, 0, lShift);
        col[i3] = cr;
        col[i3 + 1] = cg;
        col[i3 + 2] = cb;

        idx++;
      }
    }

    return { positions: pos, colors: col };
  }, [nodes, count, seed, spread, splashiness, baseColor]);

  const timeRef = useRef(0);
  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta * tempo * 0.3;
    groupRef.current.rotation.z = Math.sin(timeRef.current * 0.4) * 0.04;
  });

  if (nodes.length === 0 || positions.length === 0 || !texture) return null;

  const opacity = config.intensity;

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          size={particleSize}
          vertexColors
          transparent
          opacity={opacity}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          alphaTest={0.01}
        />
      </points>
    </group>
  );
}
