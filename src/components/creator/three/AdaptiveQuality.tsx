"use client";

import { useEffect, useRef, createContext, useContext, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { getGPUTier, type TierResult } from "detect-gpu";

type QualityTier = 1 | 2 | 3;

type QualitySettings = {
  tier: QualityTier;
  particleMultiplier: number;
  postProcessingScale: number;
  maxParticles: number;
};

const TIER_SETTINGS: Record<QualityTier, QualitySettings> = {
  1: { tier: 1, particleMultiplier: 0.3, postProcessingScale: 0.5, maxParticles: 15000 },
  2: { tier: 2, particleMultiplier: 1.0, postProcessingScale: 1.0, maxParticles: 50000 },
  3: { tier: 3, particleMultiplier: 1.5, postProcessingScale: 1.0, maxParticles: 80000 },
};

const QualityContext = createContext<QualitySettings>(TIER_SETTINGS[2]);

export function useQuality(): QualitySettings {
  return useContext(QualityContext);
}

export function AdaptiveQuality({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<QualityTier>(2);
  const { gl } = useThree();
  const frameTimes = useRef<number[]>([]);
  const lastTime = useRef<number | null>(null);
  const stableFrames = useRef(0);
  const currentTier = useRef<QualityTier>(2);
  const baseTier = useRef<QualityTier>(2);

  useEffect(() => {
    const glContext = gl.getContext() as WebGLRenderingContext | WebGL2RenderingContext;
    getGPUTier({ glContext }).then((result: TierResult) => {
      let detected: QualityTier = 2;
      if (result.tier <= 1) detected = 1;
      else if (result.tier >= 3) detected = 3;
      baseTier.current = detected;
      currentTier.current = detected;
      setTier(detected);
    });
  }, [gl]);

  useFrame(() => {
    const now = performance.now();
    if (lastTime.current === null) {
      lastTime.current = now;
      return;
    }
    const delta = now - lastTime.current;
    lastTime.current = now;
    frameTimes.current.push(delta);
    if (frameTimes.current.length > 60) frameTimes.current.shift();

    if (frameTimes.current.length >= 30 && frameTimes.current.length % 30 === 0) {
      const avg = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
      if (avg > 20 && currentTier.current > 1) {
        currentTier.current = (currentTier.current - 1) as QualityTier;
        setTier(currentTier.current);
        stableFrames.current = 0;
      } else if (avg < 14 && currentTier.current < baseTier.current) {
        stableFrames.current++;
        if (stableFrames.current >= 2) {
          currentTier.current = (currentTier.current + 1) as QualityTier;
          setTier(currentTier.current);
          stableFrames.current = 0;
        }
      } else {
        stableFrames.current = 0;
      }
    }
  });

  return (
    <QualityContext.Provider value={TIER_SETTINGS[tier]}>
      {children}
    </QualityContext.Provider>
  );
}
