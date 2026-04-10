"use client";

import { useEffect, useRef, useState } from "react";
import { useCreatorStore } from "@/lib/creator-store";

export function DotGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const points = useCreatorStore((s) => s.points);
  const edges = useCreatorStore((s) => s.edges);
  const selectedPoint = useCreatorStore((s) => s.selectedPoint);
  const palette = useCreatorStore((s) => s.palette);
  const selectPoint = useCreatorStore((s) => s.selectPoint);
  const initGrid = useCreatorStore((s) => s.initGrid);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      initGrid(16, 10, width, height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [initGrid]);

  const getPoint = (id: string) => points.find((p) => p.id === id);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10">
      <svg width={dimensions.width} height={dimensions.height} className="absolute inset-0">
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = getPoint(edge.from);
          const to = getPoint(edge.to);
          if (!from || !to) return null;
          const colorIdx = i % palette.length;
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.worldX}
              y1={from.worldY}
              x2={to.worldX}
              y2={to.worldY}
              stroke={palette[colorIdx]}
              strokeWidth={2}
              strokeOpacity={0.8}
            />
          );
        })}

        {/* Connection line from selected to cursor would go here */}

        {/* Dots */}
        {points.map((point) => {
          const isSelected = selectedPoint === point.id;
          const isConnected = edges.some(
            (e) => e.from === point.id || e.to === point.id
          );

          return (
            <circle
              key={point.id}
              cx={point.worldX}
              cy={point.worldY}
              r={isSelected ? 6 : isConnected ? 4 : 2.5}
              fill={
                isSelected
                  ? palette[0]
                  : isConnected
                    ? "#ffffff"
                    : "#333333"
              }
              opacity={isSelected ? 1 : isConnected ? 0.9 : 0.3}
              className="cursor-pointer transition-all duration-150"
              onClick={() => selectPoint(point.id)}
              style={{ filter: isSelected ? `drop-shadow(0 0 8px ${palette[0]})` : undefined }}
            >
              <title>{point.id}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
