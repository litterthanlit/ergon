"use client";

import { useRef, useCallback } from "react";

type Props = {
  onResize: (deltaY: number) => void;
};

export function ResizeHandle({ onResize }: Props) {
  const startY = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      startY.current = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!e.buttons) return;
      const delta = startY.current - e.clientY;
      startY.current = e.clientY;
      onResize(delta);
    },
    [onResize]
  );

  const onPointerUp = useCallback(() => {
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  return (
    <div
      data-testid="resize-handle"
      className="h-2 bg-neutral-900 border-t border-neutral-800 cursor-row-resize flex items-center justify-center hover:bg-neutral-800 transition-colors shrink-0"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="w-8 h-0.5 bg-neutral-700 rounded-full" />
    </div>
  );
}
