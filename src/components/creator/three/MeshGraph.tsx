"use client";

import { Environment } from "@react-three/drei";
import { useCreatorStore } from "@/lib/creator-store";
import { SphereCluster } from "./layers/SphereCluster";
import { TendrilSystem } from "./layers/TendrilSystem";

// Stubs for layers not yet implemented
function DustCloud() { return null; }
function SplatterParticles() { return null; }
function NebulaCloud() { return null; }
function FlowParticles() { return null; }
function WireframeEdges() { return null; }
function HaloRings() { return null; }
function LightRaysLayer() { return null; }

export function MeshGraph() {
  const layers = useCreatorStore((s) => s.layers);
  const palette = useCreatorStore((s) => s.palette);

  return (
    <group>
      <Environment preset="night" />
      <pointLight position={[100, 100, 200]} intensity={200} color="#ffffff" />
      <pointLight position={[-150, -80, 150]} intensity={150} color={palette[1]} />
      <pointLight position={[0, 150, -100]} intensity={100} color={palette[0]} />

      {layers.spheres.enabled && <SphereCluster />}
      {layers.tendrils.enabled && <TendrilSystem />}
      {layers.dust.enabled && <DustCloud />}
      {layers.splatter.enabled && <SplatterParticles />}
      {layers.nebula.enabled && <NebulaCloud />}
      {layers.flow.enabled && <FlowParticles />}
      {layers.wireframe.enabled && <WireframeEdges />}
      {layers.halos.enabled && <HaloRings />}
      {layers.lightRays.enabled && <LightRaysLayer />}
    </group>
  );
}
