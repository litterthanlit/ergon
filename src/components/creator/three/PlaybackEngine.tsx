"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCreatorStore, type SerializedState, type Layers, type PostFX } from "@/lib/creator-store";

// Easing functions
function applyEasing(p: number, easing: string): number {
  switch (easing) {
    case "ease-in": return p * p;
    case "ease-out": return 1 - (1 - p) * (1 - p);
    case "ease-in-out": return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    default: return p; // linear
  }
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  ca.lerp(cb, t);
  return "#" + ca.getHexString();
}

function lerpState(from: SerializedState, to: SerializedState, t: number): Partial<{
  nodes: SerializedState["nodes"];
  edges: SerializedState["edges"];
  layers: Layers;
  breathe: number;
  pulseSpeed: number;
  tempo: number;
  seed: number;
  palette: string[];
  postFX: PostFX;
}> {
  // Lerp numeric globals
  const breathe = lerpNum(from.breathe, to.breathe, t);
  const pulseSpeed = lerpNum(from.pulseSpeed, to.pulseSpeed, t);
  const tempo = lerpNum(from.tempo, to.tempo, t);
  const seed = t < 0.5 ? from.seed : to.seed;

  // Lerp palette
  const paletteLen = Math.max(from.palette.length, to.palette.length);
  const palette: string[] = [];
  for (let i = 0; i < paletteLen; i++) {
    const fc = from.palette[i] ?? from.palette[0] ?? "#000000";
    const tc = to.palette[i] ?? to.palette[0] ?? "#000000";
    palette.push(lerpColor(fc, tc, t));
  }

  // Lerp layers
  const layers = JSON.parse(JSON.stringify(from.layers)) as Layers;
  const layerKeys = Object.keys(layers) as (keyof Layers)[];
  for (const key of layerKeys) {
    const fromLayer = from.layers[key];
    const toLayer = to.layers[key];

    // If target enables a layer that source doesn't, fade in
    if (toLayer.enabled && !fromLayer.enabled) {
      layers[key].enabled = true;
      layers[key].intensity = lerpNum(0, toLayer.intensity, t);
    } else if (!toLayer.enabled && fromLayer.enabled) {
      // Fade out, disable when done
      layers[key].intensity = lerpNum(fromLayer.intensity, 0, t);
      if (t >= 1) layers[key].enabled = false;
    } else {
      layers[key].enabled = toLayer.enabled;
      layers[key].intensity = lerpNum(fromLayer.intensity, toLayer.intensity, t);
    }

    // Lerp params
    const allParamKeys = new Set([...Object.keys(fromLayer.params), ...Object.keys(toLayer.params)]);
    for (const pk of allParamKeys) {
      layers[key].params[pk] = lerpNum(fromLayer.params[pk] ?? 0, toLayer.params[pk] ?? 0, t);
    }
  }

  // PostFX: snap at 0.5
  const postFX = t < 0.5 ? { ...from.postFX } : { ...to.postFX };

  // Nodes: lerp positions by index, snap extras at 0.5
  const maxNodes = Math.max(from.nodes.length, to.nodes.length);
  const nodes = [];
  for (let i = 0; i < maxNodes; i++) {
    const fn = from.nodes[i];
    const tn = to.nodes[i];
    if (fn && tn) {
      nodes.push({
        ...fn,
        position: [
          lerpNum(fn.position[0], tn.position[0], t),
          lerpNum(fn.position[1], tn.position[1], t),
          lerpNum(fn.position[2], tn.position[2], t),
        ] as [number, number, number],
        scale: lerpNum(fn.scale, tn.scale, t),
      });
    } else if (t < 0.5 && fn) {
      nodes.push(fn);
    } else if (t >= 0.5 && tn) {
      nodes.push(tn);
    }
  }

  // Edges: snap at 0.5
  const edges = t < 0.5 ? from.edges : to.edges;

  return { nodes, edges, layers, breathe, pulseSpeed, tempo, seed, palette, postFX };
}

// Ref for click trigger forwarding from SceneInteraction
export const playbackClickRef = { fired: false };

export function PlaybackEngine() {
  const elapsedRef = useRef(0);
  void elapsedRef; // used implicitly via store state

  useFrame((_state, delta) => {
    const store = useCreatorStore.getState();
    if (!store.isPlaying) return;

    const { playbackState, connections, snapshots, activeSnapshotId } = store;

    if (playbackState.phase === "idle" || playbackState.phase === "playing") {
      // Accumulate time in current scene
      const elapsed = playbackState.elapsedInScene + delta * 1000;
      store.setPlaybackState({ elapsedInScene: elapsed });

      // Evaluate outgoing connections
      const outgoing = connections.filter((c) => c.from === activeSnapshotId);
      if (outgoing.length === 0) return; // Loop current scene

      for (const conn of outgoing) {
        let triggered = false;

        if (conn.trigger.type === "time" && elapsed >= conn.trigger.delay) {
          triggered = true;
        } else if (conn.trigger.type === "click" && playbackClickRef.fired) {
          triggered = true;
          playbackClickRef.fired = false;
        }

        if (triggered) {
          store.setPlaybackState({
            phase: "crossfading",
            fromSnapshotId: activeSnapshotId,
            toSnapshotId: conn.to,
            triggeredConnectionId: conn.id,
            progress: 0,
          });
          return;
        }
      }
    }

    if (playbackState.phase === "crossfading") {
      const conn = connections.find((c) => c.id === playbackState.triggeredConnectionId);
      if (!conn) return;

      const duration = conn.transition.duration;
      const newProgress = Math.min(1, playbackState.progress + (delta * 1000) / duration);
      const easedProgress = applyEasing(newProgress, conn.transition.easing);

      const fromSnap = snapshots.find((s) => s.id === playbackState.fromSnapshotId);
      const toSnap = snapshots.find((s) => s.id === playbackState.toSnapshotId);
      if (!fromSnap || !toSnap) return;

      const interpolated = lerpState(fromSnap.state, toSnap.state, easedProgress);
      useCreatorStore.setState(interpolated);

      if (newProgress >= 1) {
        // Crossfade complete — move to target
        store.setPlaybackState({
          phase: "playing",
          fromSnapshotId: null,
          toSnapshotId: null,
          progress: 0,
          triggeredConnectionId: null,
          elapsedInScene: 0,
        });
        useCreatorStore.setState({ activeSnapshotId: playbackState.toSnapshotId });
      } else {
        store.setPlaybackState({ progress: newProgress });
      }
    }
  });

  return null;
}
