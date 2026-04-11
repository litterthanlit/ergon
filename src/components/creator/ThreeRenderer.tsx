"use client";

import { Canvas } from "@react-three/fiber";
import { CameraRig } from "./three/CameraRig";
import { MeshGraph } from "./three/MeshGraph";
import { ParticleField } from "./three/ParticleField";
import { PostStack } from "./three/PostStack";
import { AdaptiveQuality } from "./three/AdaptiveQuality";
import { ImagePlanes } from "./three/ImagePlanes";

export function ThreeRenderer() {
  return (
    <Canvas
      className="absolute inset-0 w-full h-full"
      style={{ background: "transparent" }}
      flat
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
    >
      <AdaptiveQuality>
        <CameraRig />
        <ambientLight intensity={0.15} />
        <directionalLight position={[0, 0, 500]} intensity={0.5} />
        <MeshGraph />
        <ParticleField />
        <ImagePlanes />
        <PostStack />
      </AdaptiveQuality>
    </Canvas>
  );
}
