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
    <div className="h-screen w-screen bg-neutral-950 flex">
      {/* Canvas — fills available space */}
      <div className="flex-1 relative">
        <Canvas />

        {/* Error overlay */}
        {status === "error" && error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-950/90 text-red-200 text-xs p-3 rounded-lg font-mono">
            {error}
          </div>
        )}
      </div>

      {/* Parameter Panel — right sidebar */}
      <div className="w-72 bg-neutral-900 border-l border-neutral-800 p-5 flex flex-col overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            {template.name}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {template.description}
          </p>
        </div>

        <ParameterPanel
          schema={schema}
          values={values}
          onChange={setParamValue}
        />

        {/* Status indicator */}
        <div className="mt-auto pt-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                status === "ready"
                  ? "bg-green-500"
                  : status === "error"
                    ? "bg-red-500"
                    : "bg-yellow-500 animate-pulse"
              }`}
            />
            <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
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
