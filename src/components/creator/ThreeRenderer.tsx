"use client";

import { Canvas } from "@react-three/fiber";
import { CameraRig } from "./three/CameraRig";
import { MeshGraph } from "./three/MeshGraph";
import { ParticleField } from "./three/ParticleField";
import { PostStack } from "./three/PostStack";
import { AdaptiveQuality } from "./three/AdaptiveQuality";
import { SceneInteraction } from "./three/SceneInteraction";

export function ThreeRenderer() {
  return (
    <Canvas
      className="absolute inset-0 w-full h-full"
      style={{ background: "transparent" }}
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
        <MeshGraph />
        <SceneInteraction />
        <ParticleField />
        <PostStack />
      </AdaptiveQuality>
    </Canvas>
  );
}
