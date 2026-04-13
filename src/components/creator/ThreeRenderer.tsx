"use client";

import { Canvas } from "@react-three/fiber";
import { useCreatorStore } from "@/lib/creator-store";
import { CameraRig } from "./three/CameraRig";
import { MeshGraph } from "./three/MeshGraph";
import { ParticleField } from "./three/ParticleField";
import { PostStack } from "./three/PostStack";
import { AdaptiveQuality } from "./three/AdaptiveQuality";
import { SceneInteraction } from "./three/SceneInteraction";
import { ModulationEngine } from "./three/ModulationEngine";
import { PlaybackEngine } from "./three/PlaybackEngine";

export function ThreeRenderer() {
  const theme = useCreatorStore((s) => s.theme);

  return (
    <Canvas
      className="absolute inset-0 w-full h-full"
      style={{ background: theme === "dark" ? "#09090b" : "#f0f0f2" }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: 5, // ACESFilmicToneMapping
        toneMappingExposure: 1.2,
      }}
      dpr={[1, 2]}
    >
      <AdaptiveQuality>
        <CameraRig />
        <ambientLight intensity={0.3} />
        <ModulationEngine />
        <PlaybackEngine />
        <MeshGraph />
        <SceneInteraction />
        <ParticleField />
        <PostStack />
      </AdaptiveQuality>
    </Canvas>
  );
}
