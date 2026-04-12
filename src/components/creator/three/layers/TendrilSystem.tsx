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

export function TendrilSystem() {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useCreatorStore((s) => s.nodes);
  const edges = useCreatorStore((s) => s.edges);
  const palette = useCreatorStore((s) => s.palette);
  const seed = useCreatorStore((s) => s.seed);
  const tempo = useCreatorStore((s) => s.tempo);
  const config = useCreatorStore((s) => s.layers.tendrils);
  const quality = useQuality();

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Generate tube curves for each edge
  const tubes = useMemo(() => {
    if (edges.length === 0) return [];
    const branchCount = Math.floor((config.params.branchCount ?? 3) * quality.particleMultiplier);
    const thickness = config.params.thickness ?? 1.5;

    return edges.flatMap((edge, ei) => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return [];

      const branches: { curve: THREE.CatmullRomCurve3; radius: number; colorIdx: number }[] = [];

      for (let b = 0; b < branchCount; b++) {
        const r0 = seeded(seed, ei * 100 + b * 10 + 0);
        const r1 = seeded(seed, ei * 100 + b * 10 + 1);
        const r2 = seeded(seed, ei * 100 + b * 10 + 2);

        const from = new THREE.Vector3(...fromNode.position);
        const to = new THREE.Vector3(...toNode.position);

        // Offset start/end slightly for branch variation
        const offset = 8;
        from.x += (r0 - 0.5) * offset;
        from.y += (r1 - 0.5) * offset;
        to.x += (r2 - 0.5) * offset;
        to.y += (seeded(seed, ei * 100 + b * 10 + 3) - 0.5) * offset;

        // Mid control points with organic bulge
        const mid = from.clone().lerp(to, 0.5);
        const bulge = 15 + r0 * 20;
        mid.x += (seeded(seed, ei * 100 + b * 10 + 4) - 0.5) * bulge;
        mid.y += (seeded(seed, ei * 100 + b * 10 + 5) - 0.5) * bulge;
        mid.z += (seeded(seed, ei * 100 + b * 10 + 6) - 0.5) * bulge * 0.5;

        const curve = new THREE.CatmullRomCurve3([from, mid, to]);
        branches.push({
          curve,
          radius: thickness * (0.3 + r0 * 0.7),
          colorIdx: Math.floor(r1 * palette.length) % palette.length,
        });
      }

      return branches;
    });
  }, [edges, nodeMap, seed, config.params, palette.length, quality.particleMultiplier]);

  // Animation — subtle undulation
  const timeRef = useRef(0);
  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta * tempo;
    // Gentle Y-axis wave on the group
    groupRef.current.position.y = Math.sin(timeRef.current * 0.3) * 0.5;
  });

  if (tubes.length === 0) return null;

  const glowIntensity = config.params.glowIntensity ?? 0.5;
  const baseColor = config.color ?? palette[0];

  return (
    <group ref={groupRef}>
      {tubes.map((tube, i) => (
        <mesh key={i}>
          <tubeGeometry args={[tube.curve, 20, tube.radius, 6, false]} />
          <meshPhysicalMaterial
            color={new THREE.Color(baseColor)}
            emissive={new THREE.Color(palette[tube.colorIdx])}
            emissiveIntensity={glowIntensity * config.intensity}
            transparent
            opacity={0.7 * config.intensity}
            roughness={0.4}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
