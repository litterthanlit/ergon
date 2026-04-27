"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";

export function CameraRig() {
  const { camera: sceneCamera, gl } = useThree();
  const orbitRef = useRef<OrbitControlsType>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const [orbitEnabled, setOrbitEnabled] = useState(false);
  const mouse = useRef({ x: 0, y: 0 });
  const smoothOffset = useRef({ x: 0, y: 0 });
  const basePosition = useRef(new THREE.Vector3(0, 0, 500));

  useEffect(() => {
    cameraRef.current = sceneCamera;
  }, [sceneCamera]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setOrbitEnabled(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setOrbitEnabled(false);
    };
    const handleDblClick = () => {
      const camera = cameraRef.current;
      if (!camera) return;
      camera.position.copy(basePosition.current);
      camera.lookAt(0, 0, 0);
      if (orbitRef.current) {
        orbitRef.current.target.set(0, 0, 0);
        orbitRef.current.update();
      }
    };

    const dom = gl.domElement;
    dom.addEventListener("mousemove", handleMouseMove);
    dom.addEventListener("dblclick", handleDblClick);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      dom.removeEventListener("mousemove", handleMouseMove);
      dom.removeEventListener("dblclick", handleDblClick);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gl]);

  useFrame(() => {
    if (orbitEnabled) return;
    const camera = cameraRef.current;
    if (!camera) return;
    const maxOffset = 15;
    const targetX = mouse.current.x * maxOffset;
    const targetY = mouse.current.y * maxOffset;
    smoothOffset.current.x += (targetX - smoothOffset.current.x) * 0.08;
    smoothOffset.current.y += (targetY - smoothOffset.current.y) * 0.08;
    camera.position.set(
      basePosition.current.x + smoothOffset.current.x,
      basePosition.current.y + smoothOffset.current.y,
      basePosition.current.z,
    );
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 500]}
        fov={60}
        near={0.1}
        far={2000}
      />
      {orbitEnabled && (
        <OrbitControls
          ref={orbitRef}
          enableZoom
          enablePan
          enableRotate
          makeDefault
        />
      )}
    </>
  );
}
