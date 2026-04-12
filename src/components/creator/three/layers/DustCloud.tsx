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

export function DustCloud() {
  const pointsRef = useRef<THREE.Points>(null);

  const nodes = useCreatorStore((s) => s.nodes);
  const seed = useCreatorStore((s) => s.seed);
  const tempo = useCreatorStore((s) => s.tempo);
  const palette = useCreatorStore((s) => s.palette);
  const config = useCreatorStore((s) => s.layers.dust);
  const quality = useQuality();

  const density = Math.floor((config.params.density ?? 1000) * quality.particleMultiplier);
  const particleSize = config.params.particleSize ?? 1.5;
  const driftSpeed = config.params.drift ?? 0.5;

  const { positions, basePositions } = useMemo(() => {
    if (nodes.length === 0) return { positions: new Float32Array(0), basePositions: new Float32Array(0) };

    const particlesPerNode = Math.floor(density / Math.max(nodes.length, 1));
    const total = particlesPerNode * nodes.length;
    const pos = new Float32Array(total * 3);
    const base = new Float32Array(total * 3);

    let idx = 0;
    for (let n = 0; n < nodes.length; n++) {
      const [nx, ny, nz] = nodes[n].position;
      for (let p = 0; p < particlesPerNode; p++) {
        const r0 = seeded(seed, idx * 5 + 0);
        const r1 = seeded(seed, idx * 5 + 1);
        const r2 = seeded(seed, idx * 5 + 2);

        // Gaussian-ish distribution around node
        const spread = 40 + seeded(seed, n * 50) * 30;
        const x = nx + (r0 - 0.5) * spread * 2;
        const y = ny + (r1 - 0.5) * spread * 2;
        const z = nz + (r2 - 0.5) * spread;

        const i3 = idx * 3;
        pos[i3] = x;
        pos[i3 + 1] = y;
        pos[i3 + 2] = z;
        base[i3] = x;
        base[i3 + 1] = y;
        base[i3 + 2] = z;

        idx++;
      }
    }

    return { positions: pos, basePositions: base };
  }, [nodes, density, seed]);

  const timeRef = useRef(0);
  useFrame((_state, delta) => {
    if (!pointsRef.current || positions.length === 0) return;
    timeRef.current += delta * tempo;
    const t = timeRef.current;

    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    const count = arr.length / 3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Brownian drift — oscillate around base positions
      arr[i3] = basePositions[i3] + Math.sin(t * driftSpeed + i * 0.7) * 2;
      arr[i3 + 1] = basePositions[i3 + 1] + Math.cos(t * driftSpeed * 0.8 + i * 1.1) * 2;
      arr[i3 + 2] = basePositions[i3 + 2] + Math.sin(t * driftSpeed * 0.5 + i * 0.3) * 1;
    }
    posAttr.needsUpdate = true;
  });

  if (positions.length === 0) return null;

  const dustColor = config.color ?? palette[3] ?? "#ffffff";
  const opacity = (config.params.opacity ?? 0.6) * config.intensity;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={dustColor}
        size={particleSize}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
