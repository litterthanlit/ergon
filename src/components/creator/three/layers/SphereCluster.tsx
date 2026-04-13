"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCreatorStore } from "@/lib/creator-store";
import { useQuality } from "../AdaptiveQuality";

// ---------------------------------------------------------------------------
// Deterministic pseudo-random from seed
// ---------------------------------------------------------------------------

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Power-law distribution: mostly small, occasional large
function powerRadius(rand: number, min: number, max: number, power: number): number {
  return min + (max - min) * Math.pow(rand, power);
}

// ---------------------------------------------------------------------------
// Generate sphere instances: positions, scales, colors for InstancedMesh
// ---------------------------------------------------------------------------

type SphereData = {
  matrices: THREE.Matrix4[];
  colors: THREE.Color[];
  count: number;
};

function generateSpheres(
  nodePositions: [number, number, number][],
  edgePositions: { from: [number, number, number]; to: [number, number, number] }[],
  palette: string[],
  seed: number,
  spheresPerVertex: number,
  spheresPerEdge: number,
  scatterRadius: number,
  sizeMin: number,
  sizeMax: number,
): SphereData {
  const matrices: THREE.Matrix4[] = [];
  const colors: THREE.Color[] = [];
  const tmpMatrix = new THREE.Matrix4();
  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpScale = new THREE.Vector3();

  let idx = 0;

  // Spheres clustered at nodes
  for (let v = 0; v < nodePositions.length; v++) {
    const [vx, vy, vz] = nodePositions[v];

    for (let s = 0; s < spheresPerVertex; s++) {
      const r0 = seeded(seed, idx * 7 + 0);
      const r1 = seeded(seed, idx * 7 + 1);
      const r2 = seeded(seed, idx * 7 + 2);
      const r3 = seeded(seed, idx * 7 + 3);
      const r4 = seeded(seed, idx * 7 + 4);

      // Scatter around node — spread driven by scatterRadius param
      const spread = scatterRadius + seeded(seed, v * 100) * (scatterRadius * 0.8);
      const ox = (r0 - 0.5) * spread * 2;
      const oy = (r1 - 0.5) * spread * 2;
      const oz = (r2 - 0.5) * spread * 1.5;

      // Power-law size: exponent 2.5 means mostly small
      const radius = powerRadius(r3, sizeMin, sizeMax, 2.5);

      // A few hero spheres (top 5%)
      const heroRadius = r4 > 0.95 ? powerRadius(r4, 15, 30, 1.0) : radius;

      tmpPos.set(vx + ox, vy + oy, vz + oz);
      tmpQuat.identity();
      tmpScale.set(heroRadius, heroRadius, heroRadius);
      tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
      matrices.push(tmpMatrix.clone());

      // Color from palette with slight variation
      const colorIdx = Math.floor(r0 * palette.length) % palette.length;
      const col = new THREE.Color(palette[colorIdx]);
      col.multiplyScalar(0.7 + r1 * 0.6);
      colors.push(col);

      idx++;
    }
  }

  // Spheres scattered along edges
  for (let e = 0; e < edgePositions.length; e++) {
    const { from, to } = edgePositions[e];
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dz = to[2] - from[2];

    for (let s = 0; s < spheresPerEdge; s++) {
      const t = seeded(seed, idx * 7 + 0);
      const r1 = seeded(seed, idx * 7 + 1);
      const r2 = seeded(seed, idx * 7 + 2);
      const r3 = seeded(seed, idx * 7 + 3);

      const x = from[0] + dx * t + (r1 - 0.5) * 15;
      const y = from[1] + dy * t + (r2 - 0.5) * 15;
      const z = from[2] + dz * t + (seeded(seed, idx * 7 + 4) - 0.5) * 10;

      const radius = powerRadius(r3, 0.5, 5, 2.0);

      tmpPos.set(x, y, z);
      tmpQuat.identity();
      tmpScale.set(radius, radius, radius);
      tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
      matrices.push(tmpMatrix.clone());

      const colorIdx = Math.floor(seeded(seed, idx * 3) * palette.length) % palette.length;
      colors.push(new THREE.Color(palette[colorIdx]).multiplyScalar(0.6 + r1 * 0.5));

      idx++;
    }
  }

  return { matrices, colors, count: matrices.length };
}

// ---------------------------------------------------------------------------
// SphereCluster — dense PBR sphere clusters, driven by layers.spheres config
// ---------------------------------------------------------------------------

export function SphereCluster() {
  const instanceRef = useRef<THREE.InstancedMesh>(null);

  const nodes = useCreatorStore((s) => s.nodes);
  const edges = useCreatorStore((s) => s.edges);
  const palette = useCreatorStore((s) => s.palette);
  const breathe = useCreatorStore((s) => s.breathe);
  const pulseSpeed = useCreatorStore((s) => s.pulseSpeed);
  const tempo = useCreatorStore((s) => s.tempo);
  const seed = useCreatorStore((s) => s.seed);
  const theme = useCreatorStore((s) => s.theme);
  const sphereConfig = useCreatorStore((s) => s.layers.spheres);

  const quality = useQuality();

  // Node positions directly from SceneNode — no worldX/worldY conversion needed
  // Include ALL nodes (not just edge-connected ones) — free-form canvas
  const nodePositions = useMemo(() => {
    return nodes.map((n) => n.position);
  }, [nodes]);

  const edgePairs = useMemo(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    return edges
      .map((e) => {
        const from = nodeMap.get(e.from);
        const to = nodeMap.get(e.to);
        if (!from || !to) return null;
        return { from: from.position, to: to.position };
      })
      .filter(Boolean) as { from: [number, number, number]; to: [number, number, number] }[];
  }, [nodes, edges]);

  // Edge line geometry for thin connections
  const edgeLineArray = useMemo(() => {
    const arr: number[] = [];
    for (const ep of edgePairs) {
      arr.push(ep.from[0], ep.from[1], ep.from[2], ep.to[0], ep.to[1], ep.to[2]);
    }
    return new Float32Array(arr);
  }, [edgePairs]);

  // Sphere counts scale with quality
  const spheresPerVertex = Math.floor(
    (sphereConfig.params.countPerVertex ?? 40) * quality.particleMultiplier,
  );
  const spheresPerEdge = Math.floor(12 * quality.particleMultiplier);

  // Generate all sphere data
  const sphereData = useMemo(() => {
    if (nodePositions.length === 0) return null;
    return generateSpheres(
      nodePositions,
      edgePairs,
      palette,
      seed,
      spheresPerVertex,
      spheresPerEdge,
      sphereConfig.params.scatterRadius ?? 25,
      sphereConfig.params.sizeMin ?? 0.8,
      sphereConfig.params.sizeMax ?? 12,
    );
  }, [nodePositions, edgePairs, palette, seed, spheresPerVertex, spheresPerEdge, sphereConfig.params]);

  // Apply instance matrices and colors
  useEffect(() => {
    if (!instanceRef.current || !sphereData) return;
    const mesh = instanceRef.current;
    for (let i = 0; i < sphereData.count; i++) {
      mesh.setMatrixAt(i, sphereData.matrices[i]);
      mesh.setColorAt(i, sphereData.colors[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = sphereData.count;
  }, [sphereData]);

  // Store base matrices for breathing animation
  const baseMatrices = useRef<THREE.Matrix4[]>([]);
  useEffect(() => {
    if (sphereData) {
      baseMatrices.current = sphereData.matrices.map((m) => m.clone());
    }
  }, [sphereData]);

  // Breathing animation — gently pulse all spheres
  const timeRef = useRef(0);
  useFrame((_state, delta) => {
    if (!instanceRef.current || !sphereData || baseMatrices.current.length === 0) return;
    timeRef.current += delta * tempo;
    const t = timeRef.current;
    const mesh = instanceRef.current;
    const tmpPos = new THREE.Vector3();
    const tmpQuat = new THREE.Quaternion();
    const tmpScale = new THREE.Vector3();

    for (let i = 0; i < sphereData.count; i++) {
      baseMatrices.current[i].decompose(tmpPos, tmpQuat, tmpScale);

      // Breathing: scale pulsation
      const phase = seeded(seed, i * 13) * Math.PI * 2;
      const breatheFactor = 1.0 + Math.sin(t * pulseSpeed + phase) * breathe * 0.01;

      // Subtle position drift
      const drift = Math.sin(t * 0.5 + i * 0.1) * breathe * 0.15;
      tmpPos.y += drift;

      tmpScale.multiplyScalar(breatheFactor);
      mesh.setMatrixAt(i, new THREE.Matrix4().compose(tmpPos, tmpQuat, tmpScale));
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  // Single MeshPhysicalMaterial driven by layers.spheres.params
  const material = useMemo(() => {
    const p = sphereConfig.params;
    return new THREE.MeshPhysicalMaterial({
      roughness: (p.roughness ?? 0.15) + (theme === "light" ? 0.1 : 0),
      metalness: p.metalness ?? 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: theme === "light" ? 1.0 : 1.5,
      transparent: true,
      opacity: 0.92 * sphereConfig.intensity,
      transmission: p.transmission ?? 0.3,
      thickness: 2.0,
      ior: 1.5,
      iridescence: p.iridescence ?? 0,
      color: new THREE.Color(sphereConfig.color ?? palette[1]),
      emissive: new THREE.Color(palette[0]),
      emissiveIntensity: Math.max(0, (p.emissiveIntensity ?? 0.15) - (theme === "light" ? 0.05 : 0)),
    });
  }, [sphereConfig, palette, theme]);

  const maxInstances = spheresPerVertex * 50 + spheresPerEdge * 50;

  if (nodePositions.length === 0) return null;

  return (
    <group>
      {/* Instanced sphere cluster */}
      <instancedMesh
        ref={instanceRef}
        args={[undefined, undefined, maxInstances]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <primitive object={material} attach="material" />
      </instancedMesh>

      {/* Thin white edge lines */}
      {edgeLineArray.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[edgeLineArray, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} />
        </lineSegments>
      )}
    </group>
  );
}
