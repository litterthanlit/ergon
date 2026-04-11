"use client";

import { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCreatorStore } from "@/lib/creator-store";

// ---------------------------------------------------------------------------
// Procedural texture generators (canvas 2D -> CanvasTexture)
// ---------------------------------------------------------------------------

type TextureGenerator = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: string[],
  seed: number,
) => void;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const generateSimplexNoise: TextureGenerator = (ctx, w, h, palette, seed) => {
  const rand = seededRandom(seed);
  const imageData = ctx.createImageData(w, h);
  const c1 = new THREE.Color(palette[0] ?? "#00ffa3");
  const c2 = new THREE.Color(palette[1] ?? "#0088ff");

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const fx = x / w;
      const fy = y / h;
      // Layered pseudo-noise via sin waves
      const n =
        Math.sin(fx * 12 + seed * 0.1) * Math.cos(fy * 10 + seed * 0.13) * 0.5 +
        Math.sin(fx * 25 + fy * 18 + seed * 0.07) * 0.3 +
        (rand() - 0.5) * 0.2;
      const t = n * 0.5 + 0.5;
      imageData.data[i] = Math.floor((c1.r * (1 - t) + c2.r * t) * 255);
      imageData.data[i + 1] = Math.floor((c1.g * (1 - t) + c2.g * t) * 255);
      imageData.data[i + 2] = Math.floor((c1.b * (1 - t) + c2.b * t) * 255);
      imageData.data[i + 3] = Math.floor(t * 180);
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

const generateGlitch: TextureGenerator = (ctx, w, h, palette, seed) => {
  const rand = seededRandom(seed + 1000);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 30; i++) {
    const color = palette[Math.floor(rand() * palette.length)] ?? "#ff2d6b";
    ctx.fillStyle = color;
    ctx.globalAlpha = rand() * 0.5 + 0.1;
    const bx = rand() * w;
    const by = rand() * h;
    const bw = rand() * w * 0.6 + 10;
    const bh = rand() * 8 + 2;
    ctx.fillRect(bx, by, bw, bh);
  }
  ctx.globalAlpha = 1;
};

const generateVoronoi: TextureGenerator = (ctx, w, h, palette, seed) => {
  const rand = seededRandom(seed + 2000);
  const numPoints = 12;
  const sites = Array.from({ length: numPoints }, () => ({
    x: rand() * w,
    y: rand() * h,
    color: palette[Math.floor(rand() * palette.length)] ?? "#cc44ff",
  }));

  const imageData = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let minDist = Infinity;
      let secondDist = Infinity;
      let closestColor = sites[0].color;
      for (const s of sites) {
        const d = Math.hypot(x - s.x, y - s.y);
        if (d < minDist) {
          secondDist = minDist;
          minDist = d;
          closestColor = s.color;
        } else if (d < secondDist) {
          secondDist = d;
        }
      }
      const edge = 1 - Math.min(1, (secondDist - minDist) / 12);
      const c = new THREE.Color(closestColor);
      const i = (y * w + x) * 4;
      imageData.data[i] = Math.floor(c.r * 255 * (1 - edge * 0.5));
      imageData.data[i + 1] = Math.floor(c.g * 255 * (1 - edge * 0.5));
      imageData.data[i + 2] = Math.floor(c.b * 255 * (1 - edge * 0.5));
      imageData.data[i + 3] = Math.floor(150 + edge * 60);
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

const generateColorField: TextureGenerator = (ctx, w, h, palette, seed) => {
  const rand = seededRandom(seed + 3000);
  const c1 = palette[Math.floor(rand() * palette.length)] ?? "#00ffa3";
  const c2 = palette[Math.floor(rand() * palette.length)] ?? "#0088ff";
  const angle = rand() * Math.PI;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const grad = ctx.createLinearGradient(
    w / 2 - cos * w,
    h / 2 - sin * h,
    w / 2 + cos * w,
    h / 2 + sin * h,
  );
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
};

const GENERATORS: TextureGenerator[] = [
  generateSimplexNoise,
  generateGlitch,
  generateVoronoi,
  generateColorField,
];

function createProceduralTexture(
  index: number,
  palette: string[],
  seed: number,
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gen = GENERATORS[index % GENERATORS.length];
  gen(ctx, size, size, palette, seed + index * 137);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// AutoPlane — a single auto-generated floating plane
// ---------------------------------------------------------------------------

function AutoPlane({
  texture,
  basePosition,
  planeSize,
  index,
}: {
  texture: THREE.CanvasTexture;
  basePosition: [number, number, number];
  planeSize: [number, number];
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    // Slow drift
    mesh.position.x = basePosition[0] + Math.sin(t * 0.15 + index * 2) * 8;
    mesh.position.y = basePosition[1] + Math.cos(t * 0.12 + index * 3) * 6;
    mesh.position.z = basePosition[2];
    // Gentle rotation
    mesh.rotation.x = Math.sin(t * 0.08 + index) * 0.1;
    mesh.rotation.y = Math.cos(t * 0.06 + index * 1.5) * 0.1;
  });

  return (
    <mesh ref={meshRef} position={basePosition}>
      <planeGeometry args={planeSize} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.45}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// UserPlane — a user-uploaded image plane
// ---------------------------------------------------------------------------

function UserPlane({
  url,
  position,
  rotation,
  scale,
}: {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load(url);
  }, [url]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    // Subtle float
    mesh.position.y = position[1] + Math.sin(t * 0.2) * 3;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={[scale * 40, scale * 40, 1]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// ImagePlanes — orchestrates auto-generated + user drag-drop planes
// ---------------------------------------------------------------------------

export function ImagePlanes() {
  const edges = useCreatorStore((s) => s.edges);
  const seed = useCreatorStore((s) => s.seed);
  const palette = useCreatorStore((s) => s.palette);
  const imagePlanes = useCreatorStore((s) => s.imagePlanes);
  const addImagePlane = useCreatorStore((s) => s.addImagePlane);
  const { gl, camera, viewport } = useThree();

  // Number of auto planes scales with edge count
  const autoPlaneCount = edges.length > 0 ? Math.min(2 + Math.floor(edges.length / 3), 4) : 0;

  // Generate procedural textures keyed on seed + palette + count
  const autoPlanes = useMemo(() => {
    if (autoPlaneCount === 0) return [];
    const rand = seededRandom(seed);
    return Array.from({ length: autoPlaneCount }, (_, i) => {
      const texture = createProceduralTexture(i, palette, seed);
      // Position off the mesh z-plane for parallax
      const zSign = i % 2 === 0 ? 1 : -1;
      const z = zSign * (30 + rand() * 50);
      const x = (rand() - 0.5) * 300;
      const y = (rand() - 0.5) * 180;
      const w = 40 + rand() * 60;
      const h = 30 + rand() * 50;
      return {
        key: `auto-${seed}-${i}`,
        texture,
        position: [x, y, z] as [number, number, number],
        size: [w, h] as [number, number],
      };
    });
  }, [autoPlaneCount, seed, palette]);

  // Drag-drop listener on the R3F canvas
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith("image/")) return;

      const url = URL.createObjectURL(file);

      // Map drop coordinates to 3D space
      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Unproject at z=0 plane
      const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
      vec.unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      const worldPos = camera.position.clone().add(dir.multiplyScalar(dist));

      addImagePlane(url, [worldPos.x, worldPos.y, 0]);
    },
    [gl.domElement, camera, addImagePlane],
  );

  useEffect(() => {
    const dom = gl.domElement;
    dom.addEventListener("dragover", handleDragOver);
    dom.addEventListener("drop", handleDrop);
    return () => {
      dom.removeEventListener("dragover", handleDragOver);
      dom.removeEventListener("drop", handleDrop);
    };
  }, [gl.domElement, handleDragOver, handleDrop]);

  return (
    <group>
      {/* Auto-generated planes */}
      {autoPlanes.map((plane) => (
        <AutoPlane
          key={plane.key}
          texture={plane.texture}
          basePosition={plane.position}
          planeSize={plane.size}
          index={autoPlanes.indexOf(plane)}
        />
      ))}

      {/* User-uploaded image planes */}
      {imagePlanes.map((plane) => (
        <UserPlane
          key={plane.id}
          url={plane.url}
          position={plane.position}
          rotation={plane.rotation}
          scale={plane.scale}
        />
      ))}
    </group>
  );
}
