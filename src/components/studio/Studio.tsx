"use client";

import { Canvas } from "./Canvas";
import { ParameterPanel } from "./ParameterPanel";
import { useStudioStore } from "@/lib/store";

export function Studio() {
  const schema = useStudioStore((s) => s.schema);
  const values = useStudioStore((s) => s.values);
  const status = useStudioStore((s) => s.status);
  const error = useStudioStore((s) => s.error);
  const template = useStudioStore((s) => s.template);
  const setParamValue = useStudioStore((s) => s.setParamValue);

  return (
    <div className="h-screen w-screen bg-black flex">
      {/* Canvas — fills available space */}
      <div className="flex-1 relative">
        <Canvas />

        {/* Error overlay */}
        {status === "error" && error && (
          <div className="absolute bottom-4 left-4 right-80 bg-red-950/90 text-red-200 text-[11px] px-4 py-3 rounded font-mono backdrop-blur-sm">
            {error}
          </div>
        )}
      </div>

      {/* Parameter Panel — right sidebar */}
      <div className="w-72 bg-neutral-950 border-l border-neutral-900 flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-neutral-900">
          <h2 className="text-[11px] font-semibold text-white uppercase tracking-[0.15em]">
            {template.name}
          </h2>
          <p className="text-[10px] text-neutral-600 mt-1.5 leading-relaxed">
            {template.description}
          </p>
        </div>

        {/* Controls */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ParameterPanel
            schema={schema}
            values={values}
            onChange={setParamValue}
          />
        </div>

        {/* Footer — status */}
        <div className="px-5 py-3 border-t border-neutral-900">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                status === "ready"
                  ? "bg-emerald-500"
                  : status === "error"
                    ? "bg-red-500"
                    : "bg-amber-500 animate-pulse"
              }`}
            />
            <span className="text-[9px] text-neutral-600 uppercase tracking-[0.15em] font-medium">
              {status === "ready"
                ? "Running"
                : status === "error"
                  ? "Error"
                  : "Loading"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
