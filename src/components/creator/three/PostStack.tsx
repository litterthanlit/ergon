"use client";

import type { JSX } from "react";
import { useCreatorStore } from "@/lib/creator-store";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  DepthOfField,
  Noise,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { useQuality } from "./AdaptiveQuality";
import * as THREE from "three";

export function PostStack() {
  const postFX = useCreatorStore((s) => s.postFX);
  const quality = useQuality();

  const effects: JSX.Element[] = [];

  if (postFX.bloom) {
    effects.push(
      <Bloom
        key="bloom"
        intensity={1.5}
        luminanceThreshold={0.1}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    );
  }

  if (postFX.chromatic) {
    effects.push(
      <ChromaticAberration
        key="chromatic"
        offset={new THREE.Vector2(0.003, 0.003)}
        radialModulation
        modulationOffset={0.5}
      />
    );
  }

  if (postFX.vignette) {
    effects.push(
      <Vignette
        key="vignette"
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
    );
  }

  if (postFX.dof) {
    effects.push(
      <DepthOfField
        key="dof"
        focusDistance={0.02}
        focalLength={0.05}
        bokehScale={6}
      />
    );
  }

  if (postFX.grain) {
    effects.push(
      <Noise key="grain" premultiply blendFunction={BlendFunction.ADD} />
    );
  }

  if (postFX.toneMapping) {
    effects.push(
      <ToneMapping key="toneMapping" mode={ToneMappingMode.ACES_FILMIC} />
    );
  }

  // motionBlur requires per-object velocity buffers — deferred to polish pass

  if (effects.length === 0) return null;

  return (
    <EffectComposer
      multisampling={0}
      resolutionScale={quality.postProcessingScale}
    >
      {effects as [JSX.Element, ...JSX.Element[]]}
    </EffectComposer>
  );
}
