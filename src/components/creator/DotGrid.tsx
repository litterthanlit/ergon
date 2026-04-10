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
      <style>{`g.cursor-pointer:hover circle:nth-child(2) { opacity: 0.15 !important; }`}</style>
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

        {/* Dots — invisible large hit target + visible small dot */}
        {points.map((point) => {
          const isSelected = selectedPoint === point.id;
          const isConnected = edges.some(
            (e) => e.from === point.id || e.to === point.id
          );

          return (
            <g key={point.id} onClick={() => selectPoint(point.id)} className="cursor-pointer">
              {/* Large invisible hit target */}
              <circle
                cx={point.worldX}
                cy={point.worldY}
                r={18}
                fill="transparent"
              />
              {/* Hover ring */}
              <circle
                cx={point.worldX}
                cy={point.worldY}
                r={10}
                fill="transparent"
                stroke={isSelected ? palette[0] : "#ffffff"}
                strokeWidth={1}
                opacity={0}
                className="transition-opacity duration-150"
                style={{ opacity: isSelected ? 0.3 : undefined }}
              />
              {/* Visible dot */}
              <circle
                cx={point.worldX}
                cy={point.worldY}
                r={isSelected ? 5 : isConnected ? 3.5 : 2}
                fill={
                  isSelected
                    ? palette[0]
                    : isConnected
                      ? "#ffffff"
                      : "#444444"
                }
                opacity={isSelected ? 1 : isConnected ? 0.9 : 0.4}
                className="transition-all duration-150"
                style={{ filter: isSelected ? `drop-shadow(0 0 8px ${palette[0]})` : undefined }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
