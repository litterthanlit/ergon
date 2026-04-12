"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCreatorStore } from "@/lib/creator-store";

const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

export function SceneInteraction() {
  const { camera, gl } = useThree();

  // Stable refs so event handlers always see current values without re-registering
  const cameraRef = useRef(camera);
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  const raycaster = useRef(new THREE.Raycaster());
  const dragging = useRef<{ nodeId: string; offset: THREE.Vector3 } | null>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;

    function getPointerNDC(clientX: number, clientY: number): THREE.Vector2 {
      const rect = el.getBoundingClientRect();
      return new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
    }

    function hitGroundPlane(ndc: THREE.Vector2): THREE.Vector3 | null {
      raycaster.current.setFromCamera(ndc, cameraRef.current);
      const hit = new THREE.Vector3();
      const result = raycaster.current.ray.intersectPlane(GROUND_PLANE, hit);
      return result;
    }

    function findClosestNode(worldPos: THREE.Vector3): { id: string; distance: number } | null {
      const nodes = useCreatorStore.getState().nodes;
      let closest: { id: string; distance: number } | null = null;
      for (const node of nodes) {
        const d = new THREE.Vector3(...node.position).distanceTo(worldPos);
        if (d < 40 * node.scale && (!closest || d < closest.distance)) {
          closest = { id: node.id, distance: d };
        }
      }
      return closest;
    }

    function onPointerDown(e: PointerEvent) {
      if (e.altKey) return; // Alt reserved for orbit camera

      const ndc = getPointerNDC(e.clientX, e.clientY);
      const worldPos = hitGroundPlane(ndc);
      if (!worldPos) return;

      pointerDownPos.current = { x: e.clientX, y: e.clientY };

      const hit = findClosestNode(worldPos);

      if (e.button === 2) {
        // Right-click — delete node
        if (hit) {
          e.preventDefault();
          useCreatorStore.getState().removeNode(hit.id);
        }
        return;
      }

      if (hit) {
        // Start drag — compute offset so node doesn't jump to cursor
        const node = useCreatorStore.getState().nodes.find((n) => n.id === hit.id);
        if (node) {
          const nodeWorldPos = new THREE.Vector3(...node.position);
          dragging.current = {
            nodeId: hit.id,
            offset: nodeWorldPos.sub(worldPos),
          };
          useCreatorStore.getState().selectNode(hit.id);
        }
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging.current) return;

      const ndc = getPointerNDC(e.clientX, e.clientY);
      const worldPos = hitGroundPlane(ndc);
      if (!worldPos) return;

      const newPos = worldPos.add(dragging.current.offset);
      useCreatorStore.getState().updateNode(dragging.current.nodeId, {
        position: [newPos.x, newPos.y, newPos.z],
      });
    }

    function onPointerUp(e: PointerEvent) {
      const wasClick =
        pointerDownPos.current !== null &&
        Math.abs(e.clientX - pointerDownPos.current.x) < 5 &&
        Math.abs(e.clientY - pointerDownPos.current.y) < 5;

      if (wasClick && !dragging.current && e.button === 0 && !e.altKey) {
        // Click on empty space — place new node
        const ndc = getPointerNDC(e.clientX, e.clientY);
        const worldPos = hitGroundPlane(ndc);
        if (worldPos) {
          const hit = findClosestNode(worldPos);
          if (!hit) {
            useCreatorStore.getState().addNode([worldPos.x, worldPos.y, worldPos.z]);
          }
        }
      }

      dragging.current = null;
      pointerDownPos.current = null;
    }

    function onWheel(e: WheelEvent) {
      const ndc = getPointerNDC(e.clientX, e.clientY);
      const worldPos = hitGroundPlane(ndc);
      if (!worldPos) return;

      const hit = findClosestNode(worldPos);
      if (!hit) return;

      e.preventDefault();
      e.stopPropagation();

      const node = useCreatorStore.getState().nodes.find((n) => n.id === hit.id);
      if (node) {
        const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.2, Math.min(5, node.scale * scaleDelta));
        useCreatorStore.getState().updateNode(hit.id, { scale: newScale });
      }
    }

    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("contextmenu", onContextMenu);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("contextmenu", onContextMenu);
    };
  }, [gl]);

  return null;
}
