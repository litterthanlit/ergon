"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { useCreatorStore } from "@/lib/creator-store";
import { useQuality } from "./AdaptiveQuality";

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
  vertexPositions: [number, number, number][],
  edgePositions: { from: [number, number, number]; to: [number, number, number] }[],
  palette: string[],
  seed: number,
  spheresPerVertex: number,
  spheresPerEdge: number,
): SphereData {
  const matrices: THREE.Matrix4[] = [];
  const colors: THREE.Color[] = [];
  const tmpMatrix = new THREE.Matrix4();
  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpScale = new THREE.Vector3();

  let idx = 0;

  // Spheres clustered at vertices
  for (let v = 0; v < vertexPositions.length; v++) {
    const [vx, vy, vz] = vertexPositions[v];

    for (let s = 0; s < spheresPerVertex; s++) {
      const r0 = seeded(seed, idx * 7 + 0);
      const r1 = seeded(seed, idx * 7 + 1);
      const r2 = seeded(seed, idx * 7 + 2);
      const r3 = seeded(seed, idx * 7 + 3);
      const r4 = seeded(seed, idx * 7 + 4);

      // Scatter around vertex — gaussian-ish via Box-Muller approximation
      const spread = 25 + seeded(seed, v * 100) * 20;
      const ox = (r0 - 0.5) * spread * 2;
      const oy = (r1 - 0.5) * spread * 2;
      const oz = (r2 - 0.5) * spread * 1.5;

      // Power-law size: exponent 2.5 means mostly small
      const radius = powerRadius(r3, 0.8, 12, 2.5);

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
      // Slight brightness variation
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
// MeshGraph — dense sphere clusters with PBR materials
// ---------------------------------------------------------------------------

export function MeshGraph() {
  const instanceRef = useRef<THREE.InstancedMesh>(null);

  const points = useCreatorStore((s) => s.points);
  const edges = useCreatorStore((s) => s.edges);
  const renderMode = useCreatorStore((s) => s.renderMode);
  const palette = useCreatorStore((s) => s.palette);
  const breathe = useCreatorStore((s) => s.breathe);
  const pulseSpeed = useCreatorStore((s) => s.pulseSpeed);
  const tempo = useCreatorStore((s) => s.tempo);
  const seed = useCreatorStore((s) => s.seed);

  const { viewport } = useThree();
  const quality = useQuality();

  const pointMap = useMemo(() => {
    const map = new Map<string, (typeof points)[number]>();
    for (const p of points) map.set(p.id, p);
    return map;
  }, [points]);

  const toPosition = useMemo(() => {
    return (worldX: number, worldY: number): [number, number, number] => {
      const winW = typeof window !== "undefined" ? window.innerWidth : 1;
      const winH = typeof window !== "undefined" ? window.innerHeight : 1;
      const x = (worldX / winW - 0.5) * 500;
      const y = -(worldY / winH - 0.5) * 300;
      return [x, y, 0];
    };
  }, [viewport.width, viewport.height]);

  // Collect connected vertex positions
  const vertexPositions = useMemo(() => {
    const connectedIds = new Set<string>();
    for (const e of edges) {
      connectedIds.add(e.from);
      connectedIds.add(e.to);
    }
    const positions: [number, number, number][] = [];
    connectedIds.forEach((id) => {
      const pt = pointMap.get(id);
      if (pt) positions.push(toPosition(pt.worldX, pt.worldY));
    });
    return positions;
  }, [edges, pointMap, toPosition]);

  // Edge pairs as 3D positions
  const edgePairs = useMemo(() => {
    return edges.map((e) => {
      const from = pointMap.get(e.from);
      const to = pointMap.get(e.to);
      if (!from || !to) return null;
      return {
        from: toPosition(from.worldX, from.worldY),
        to: toPosition(to.worldX, to.worldY),
      };
    }).filter(Boolean) as { from: [number, number, number]; to: [number, number, number] }[];
  }, [edges, pointMap, toPosition]);

  // Edge line geometry for thin white connections
  const edgeLineArray = useMemo(() => {
    const arr: number[] = [];
    for (const ep of edgePairs) {
      arr.push(ep.from[0], ep.from[1], ep.from[2], ep.to[0], ep.to[1], ep.to[2]);
    }
    return new Float32Array(arr);
  }, [edgePairs]);

  // Sphere counts scale with quality
  const spheresPerVertex = Math.floor(40 * quality.particleMultiplier);
  const spheresPerEdge = Math.floor(12 * quality.particleMultiplier);

  // Generate all sphere data
  const sphereData = useMemo(() => {
    if (vertexPositions.length === 0) return null;
    return generateSpheres(vertexPositions, edgePairs, palette, seed, spheresPerVertex, spheresPerEdge);
  }, [vertexPositions, edgePairs, palette, seed, spheresPerVertex, spheresPerEdge]);

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

  // Breathing animation — gently pulse all spheres
  const baseMatrices = useRef<THREE.Matrix4[]>([]);
  useEffect(() => {
    if (sphereData) {
      baseMatrices.current = sphereData.matrices.map((m) => m.clone());
    }
  }, [sphereData]);

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

  // Material varies by render mode
  const material = useMemo(() => {
    const base: THREE.MeshPhysicalMaterialParameters = {
      roughness: 0.15,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 0.92,
    };

    switch (renderMode) {
      case "fluid":
        return new THREE.MeshPhysicalMaterial({
          ...base,
          roughness: 0.05,
          metalness: 0.1,
          transmission: 0.3,
          thickness: 2.0,
          ior: 1.5,
          color: new THREE.Color(palette[1]),
          emissive: new THREE.Color(palette[0]),
          emissiveIntensity: 0.15,
        });
      case "nebula":
        return new THREE.MeshPhysicalMaterial({
          ...base,
          roughness: 0.4,
          metalness: 0.0,
          emissive: new THREE.Color(palette[0]),
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.7,
          color: new THREE.Color(palette[1]),
        });
      case "crystal":
        return new THREE.MeshPhysicalMaterial({
          ...base,
          roughness: 0.0,
          metalness: 0.0,
          transmission: 0.9,
          thickness: 3.0,
          ior: 2.4,
          clearcoat: 1.0,
          iridescence: 1.0,
          iridescenceIOR: 1.3,
          color: new THREE.Color("#ffffff"),
        });
      case "mycelium":
        return new THREE.MeshPhysicalMaterial({
          ...base,
          roughness: 0.6,
          metalness: 0.0,
          emissive: new THREE.Color(palette[0]),
          emissiveIntensity: 0.8,
          color: new THREE.Color(palette[0]),
          transparent: true,
          opacity: 0.85,
        });
      case "plasma":
        return new THREE.MeshPhysicalMaterial({
          ...base,
          roughness: 0.1,
          metalness: 0.8,
          emissive: new THREE.Color(palette[1]),
          emissiveIntensity: 1.0,
          color: new THREE.Color(palette[2]),
        });
      case "erosion":
        return new THREE.MeshPhysicalMaterial({
          ...base,
          roughness: 0.8,
          metalness: 0.2,
          clearcoat: 0.3,
          color: new THREE.Color(palette[0]),
          emissive: new THREE.Color(palette[1]),
          emissiveIntensity: 0.1,
          opacity: 0.95,
        });
      case "flow":
        return new THREE.MeshPhysicalMaterial({
          ...base,
          roughness: 0.05,
          metalness: 0.5,
          emissive: new THREE.Color(palette[0]),
          emissiveIntensity: 0.4,
          color: new THREE.Color(palette[1]),
        });
      default:
        return new THREE.MeshPhysicalMaterial(base);
    }
  }, [renderMode, palette]);

  const maxInstances = spheresPerVertex * 50 + spheresPerEdge * 50; // generous buffer

  if (vertexPositions.length === 0) return null;

  return (
    <group>
      {/* Environment for reflections */}
      <Environment preset="night" />

      {/* Additional lights for specular highlights */}
      <pointLight position={[100, 100, 200]} intensity={200} color="#ffffff" />
      <pointLight position={[-150, -80, 150]} intensity={150} color={palette[1]} />
      <pointLight position={[0, 150, -100]} intensity={100} color={palette[0]} />

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
