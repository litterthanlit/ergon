"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useCreatorStore } from "@/lib/creator-store";

// ---------------------------------------------------------------------------
// Shared modulated values map (read by layer components)
// ---------------------------------------------------------------------------

export const modulatedValues: Map<string, number> = new Map();

// ---------------------------------------------------------------------------
// Simple 1D noise function (smoothed pseudo-random)
// ---------------------------------------------------------------------------

function smoothNoise(t: number): number {
  const floor = Math.floor(t);
  const frac = t - floor;
  const smooth = frac * frac * (3 - 2 * frac); // Smoothstep
  const a = Math.sin(floor * 127.1) * 43758.5453;
  const b = Math.sin((floor + 1) * 127.1) * 43758.5453;
  return (a - Math.floor(a)) * (1 - smooth) + (b - Math.floor(b)) * smooth;
}

// ---------------------------------------------------------------------------
// Oscillator preset functions
// ---------------------------------------------------------------------------

function breathe(t: number, speed: number): number {
  return Math.sin(t * speed * Math.PI * 2) * 0.5 + 0.5;
}

function pulse(t: number, speed: number): number {
  const sine = Math.sin(t * speed * Math.PI * 2);
  const s = sine > 0 ? 1 : 0;
  // Mix sharp pulse with smooth sine for slight rounding
  return s * 0.8 + (sine * 0.5 + 0.5) * 0.2;
}

function random(t: number, speed: number): number {
  return smoothNoise(t * speed);
}

// ---------------------------------------------------------------------------
// ModulationEngine component
// ---------------------------------------------------------------------------

export function ModulationEngine() {
  const elapsedRef = useRef(0);

  useFrame((state, delta) => {
    // Accumulate elapsed time
    elapsedRef.current += delta;

    // Read store state
    const storeState = useCreatorStore.getState();
    const { modulations, tempo } = storeState;

    // Clear the map
    modulatedValues.clear();

    // Compute oscillator values for each active modulation
    for (const mod of modulations) {
      if (mod.preset === "none") continue;

      const scaledTime = elapsedRef.current * tempo;
      let oscillation = 0;

      if (mod.preset === "breathe") {
        oscillation = breathe(scaledTime, mod.speed);
      } else if (mod.preset === "pulse") {
        oscillation = pulse(scaledTime, mod.speed);
      } else if (mod.preset === "random") {
        oscillation = random(scaledTime, mod.speed);
      }

      // Write result to map: oscillation * amplitude, keyed by target
      const modulatedValue = oscillation * mod.amplitude;
      modulatedValues.set(mod.target, modulatedValue);
    }
  });

  // This component doesn't render anything
  return null;
}
