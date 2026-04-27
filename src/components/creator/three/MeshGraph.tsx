"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCreatorStore, type RenderMode } from "@/lib/creator-store";
import { useQuality } from "./AdaptiveQuality";

import coreGlsl from "./shaders/core.glsl";
import fluidVert from "./shaders/fluid.vert";
import fluidFrag from "./shaders/fluid.frag";
import nebulaVert from "./shaders/nebula.vert";
import nebulaFrag from "./shaders/nebula.frag";
import crystalVert from "./shaders/crystal.vert";
import crystalFrag from "./shaders/crystal.frag";
import myceliumVert from "./shaders/mycelium.vert";
import myceliumFrag from "./shaders/mycelium.frag";
import plasmaVert from "./shaders/plasma.vert";
import plasmaFrag from "./shaders/plasma.frag";
import erosionVert from "./shaders/erosion.vert";
import erosionFrag from "./shaders/erosion.frag";
import flowVert from "./shaders/flow.vert";
import flowFrag from "./shaders/flow.frag";

// ---------------------------------------------------------------------------
// Shader builder — prepend shared core library to each mode shader
// ---------------------------------------------------------------------------

function buildShader(mode: string, core: string): string {
  return core + "\n" + mode;
}

const SHADERS: Record<RenderMode, { vert: string; frag: string }> = {
  fluid:    { vert: buildShader(fluidVert, coreGlsl), frag: buildShader(fluidFrag, coreGlsl) },
  nebula:   { vert: buildShader(nebulaVert, coreGlsl), frag: buildShader(nebulaFrag, coreGlsl) },
  crystal:  { vert: buildShader(crystalVert, coreGlsl), frag: buildShader(crystalFrag, coreGlsl) },
  mycelium: { vert: buildShader(myceliumVert, coreGlsl), frag: buildShader(myceliumFrag, coreGlsl) },
  plasma:   { vert: buildShader(plasmaVert, coreGlsl), frag: buildShader(plasmaFrag, coreGlsl) },
  erosion:  { vert: buildShader(erosionVert, coreGlsl), frag: buildShader(erosionFrag, coreGlsl) },
  flow:     { vert: buildShader(flowVert, coreGlsl), frag: buildShader(flowFrag, coreGlsl) },
};

type ShaderPair = (typeof SHADERS)[RenderMode];

type GraphUniforms = THREE.ShaderMaterial["uniforms"] & {
  uTime: { value: number };
  uBreathe: { value: number };
  uPulseSpeed: { value: number };
  uTempo: { value: number };
  uSeed: { value: number };
  uPalette: { value: THREE.Vector3[] };
};

// ---------------------------------------------------------------------------
// Hex colour → THREE.Vector3 (sRGB)
// ---------------------------------------------------------------------------

function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

function pseudoRandom(index: number): number {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function GraphShaderMaterial({
  shaderPair,
  breathe,
  pulseSpeed,
  tempo,
  seed,
  paletteVec3,
}: {
  shaderPair: ShaderPair;
  breathe: number;
  pulseSpeed: number;
  tempo: number;
  seed: number;
  paletteVec3: THREE.Vector3[];
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const initialUniforms = useMemo<GraphUniforms>(() => ({
    uTime: { value: 0 },
    uBreathe: { value: 0 },
    uPulseSpeed: { value: 0 },
    uTempo: { value: 1 },
    uSeed: { value: 0 },
    uPalette: { value: [] },
  }), []);

  useEffect(() => {
    const uniforms = materialRef.current?.uniforms as GraphUniforms | undefined;
    if (!uniforms) return;
    uniforms.uBreathe.value = breathe;
    uniforms.uPulseSpeed.value = pulseSpeed;
    uniforms.uTempo.value = tempo;
    uniforms.uSeed.value = seed;
    uniforms.uPalette.value = paletteVec3;
  }, [breathe, pulseSpeed, tempo, seed, paletteVec3]);

  useFrame(() => {
    const uniforms = materialRef.current?.uniforms as GraphUniforms | undefined;
    if (!uniforms) return;
    // eslint-disable-next-line react-hooks/immutability -- R3F shader uniforms are updated imperatively inside the render loop.
    uniforms.uTime.value += 0.016 * tempo;
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={shaderPair.vert}
      fragmentShader={shaderPair.frag}
      uniforms={initialUniforms}
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  );
}

// ---------------------------------------------------------------------------
// MeshGraph — renders connected vertices as shader spheres + edge lines
// ---------------------------------------------------------------------------

export function MeshGraph() {
  const points = useCreatorStore((s) => s.points);
  const edges = useCreatorStore((s) => s.edges);
  const renderMode = useCreatorStore((s) => s.renderMode);
  const palette = useCreatorStore((s) => s.palette);
  const breathe = useCreatorStore((s) => s.breathe);
  const pulseSpeed = useCreatorStore((s) => s.pulseSpeed);
  const tempo = useCreatorStore((s) => s.tempo);
  const seed = useCreatorStore((s) => s.seed);

  const _quality = useQuality();

  // Collect IDs of connected vertices (only vertices with at least one edge)
  const connectedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of edges) {
      ids.add(e.from);
      ids.add(e.to);
    }
    return ids;
  }, [edges]);

  // Map point ID → point for quick lookup
  const pointMap = useMemo(() => {
    const map = new Map<string, (typeof points)[number]>();
    for (const p of points) map.set(p.id, p);
    return map;
  }, [points]);

  // Convert screen-space worldX/worldY to 3D positions
  const toPosition = useMemo(
    () =>
    // Use a fixed mapping scale so objects spread across the view
    (worldX: number, worldY: number): [number, number, number] => {
      // viewport.width/height give the frustum size in world units at z=0
      // worldX/worldY are pixel coords from the grid init
      const winW = typeof window !== "undefined" ? window.innerWidth : 1;
      const winH = typeof window !== "undefined" ? window.innerHeight : 1;
      const x = (worldX / winW - 0.5) * 500;
      const y = -(worldY / winH - 0.5) * 300;
      return [x, y, 0];
    },
    [],
  );

  // Connected vertex positions
  const connectedPositions = useMemo(() => {
    const result: { id: string; position: [number, number, number] }[] = [];
    connectedIds.forEach((id) => {
      const pt = pointMap.get(id);
      if (pt) result.push({ id: pt.id, position: toPosition(pt.worldX, pt.worldY) });
    });
    return result;
  }, [connectedIds, pointMap, toPosition]);

  // Palette as Vector3 array
  const paletteVec3 = useMemo(
    () => palette.slice(0, 5).map(hexToVec3),
    [palette],
  );

  // Current shader pair
  const shaderPair = SHADERS[renderMode];

  // Flow mode particle data
  const flowParticles = useMemo(() => {
    if (renderMode !== "flow" || edges.length === 0) return null;
    const particlesPerEdge = Math.floor(2000 * _quality.particleMultiplier);
    const totalParticles = edges.length * particlesPerEdge;
    const positions = new Float32Array(totalParticles * 3);
    const velocities = new Float32Array(totalParticles * 3);
    const progress = new Float32Array(totalParticles);
    let idx = 0;
    for (const edge of edges) {
      const from = pointMap.get(edge.from);
      const to = pointMap.get(edge.to);
      if (!from || !to) continue;
      const [fx, fy] = toPosition(from.worldX, from.worldY);
      const [tx, ty] = toPosition(to.worldX, to.worldY);
      const dx = tx - fx;
      const dy = ty - fy;
      for (let p = 0; p < particlesPerEdge; p++) {
        const t = p / particlesPerEdge;
        const i3 = idx * 3;
        const noiseBase = seed * 1000 + idx * 7;
        positions[i3] = fx + dx * t + (pseudoRandom(noiseBase) - 0.5) * 10;
        positions[i3 + 1] = fy + dy * t + (pseudoRandom(noiseBase + 1) - 0.5) * 10;
        positions[i3 + 2] = (pseudoRandom(noiseBase + 2) - 0.5) * 20;
        velocities[i3] = dx * 0.01;
        velocities[i3 + 1] = dy * 0.01;
        velocities[i3 + 2] = (pseudoRandom(noiseBase + 3) - 0.5) * 0.01;
        progress[idx] = pseudoRandom(noiseBase + 4);
        idx++;
      }
    }
    return { positions: positions.slice(0, idx * 3), velocities: velocities.slice(0, idx * 3), progress: progress.slice(0, idx), count: idx };
  }, [renderMode, edges, pointMap, toPosition, _quality.particleMultiplier, seed]);

  // Edge line geometry — flat Float32Array of pairs
  const edgePositions = useMemo(() => {
    const arr: number[] = [];
    for (const e of edges) {
      const fromPt = pointMap.get(e.from);
      const toPt = pointMap.get(e.to);
      if (!fromPt || !toPt) continue;
      const [fx, fy, fz] = toPosition(fromPt.worldX, fromPt.worldY);
      const [tx, ty, tz] = toPosition(toPt.worldX, toPt.worldY);
      arr.push(fx, fy, fz, tx, ty, tz);
    }
    return new Float32Array(arr);
  }, [edges, pointMap, toPosition]);

  // Flow mode renders particles instead of spheres
  if (renderMode === "flow" && flowParticles) {
    return (
      <group>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[flowParticles.positions, 3]} />
            <bufferAttribute attach="attributes-aVelocity" args={[flowParticles.velocities, 3]} />
            <bufferAttribute attach="attributes-aProgress" args={[flowParticles.progress, 1]} />
          </bufferGeometry>
          <GraphShaderMaterial
            shaderPair={shaderPair}
            breathe={breathe}
            pulseSpeed={pulseSpeed}
            tempo={tempo}
            seed={seed}
            paletteVec3={paletteVec3}
          />
        </points>
        {edgePositions.length > 0 && (
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
          </lineSegments>
        )}
      </group>
    );
  }

  return (
    <group>
      {/* Shader geometry at connected vertices */}
      {connectedPositions.map(({ id, position }) => (
        <mesh key={id} position={position}>
          {renderMode === "crystal" ? (
            <icosahedronGeometry args={[10, 1]} />
          ) : (
            <sphereGeometry args={[8, 32, 32]} />
          )}
          <GraphShaderMaterial
            shaderPair={shaderPair}
            breathe={breathe}
            pulseSpeed={pulseSpeed}
            tempo={tempo}
            seed={seed}
            paletteVec3={paletteVec3}
          />
        </mesh>
      ))}

      {/* Edge lines */}
      {edgePositions.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
        </lineSegments>
      )}
    </group>
  );
}
