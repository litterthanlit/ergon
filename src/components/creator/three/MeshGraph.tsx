"use client";

import { Environment } from "@react-three/drei";
import { useCreatorStore } from "@/lib/creator-store";
import { SphereCluster } from "./layers/SphereCluster";
import { TendrilSystem } from "./layers/TendrilSystem";
import { DustCloud } from "./layers/DustCloud";
import { SplatterParticles } from "./layers/SplatterParticles";
import { NebulaCloud } from "./layers/NebulaCloud";
import { FlowParticles } from "./layers/FlowParticles";
import { WireframeEdges } from "./layers/WireframeEdges";
import { HaloRings } from "./layers/HaloRings";
import { LightRays as LightRaysLayer } from "./layers/LightRays";

export function MeshGraph() {
  const layers = useCreatorStore((s) => s.layers);
  const palette = useCreatorStore((s) => s.palette);
  const theme = useCreatorStore((s) => s.theme);

  return (
    <group>
      <Environment preset={theme === "dark" ? "night" : "studio"} />
      <pointLight position={[100, 100, 200]} intensity={theme === "dark" ? 200 : 120} color="#ffffff" />
      <pointLight position={[-150, -80, 150]} intensity={theme === "dark" ? 150 : 90} color={palette[1]} />
      <pointLight position={[0, 150, -100]} intensity={theme === "dark" ? 100 : 60} color={palette[0]} />
      {theme === "light" && (
        <directionalLight position={[0, 200, 100]} intensity={80} color="#ffffff" />
      )}

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
