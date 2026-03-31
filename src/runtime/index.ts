import { createParamManager } from "./params";
import { evaluateCode } from "./executor";
import type {
  ParentMessage,
  ParamSchema,
  ParamValues,
  SchemaMessage,
  ReadyMessage,
  ErrorMessage,
} from "@/lib/types";

let p5Instance: unknown = null;
let transparentMode = false;
const paramManager = createParamManager(handleSchema);

(window as unknown as Record<string, unknown>).ergon = {
  params: (schema: ParamSchema): ParamValues => {
    return paramManager.register(schema);
  },
  palette: ["#1a1a1a", "#e8b931", "#c4362c", "#2a5faa", "#f5f5f0"],
  tempo: 1.0,
};

function handleSchema(schema: ParamSchema): void {
  const msg: SchemaMessage = { type: "ergon:schema", schema };
  window.parent.postMessage(msg, "*");
}

function sendReady(): void {
  const msg: ReadyMessage = { type: "ergon:ready" };
  window.parent.postMessage(msg, "*");
}

function sendError(message: string): void {
  const msg: ErrorMessage = { type: "ergon:error", message };
  window.parent.postMessage(msg, "*");
}

function handleLoad(code: string, initialParams: ParamValues): void {
  if (p5Instance && typeof (p5Instance as { remove: () => void }).remove === "function") {
    (p5Instance as { remove: () => void }).remove();
    p5Instance = null;
  }

  delete (window as unknown as Record<string, unknown>).setup;
  delete (window as unknown as Record<string, unknown>).draw;

  const error = evaluateCode(code);
  if (error) {
    sendError(error.message);
    return;
  }

  if (initialParams && Object.keys(initialParams).length > 0) {
    paramManager.update(initialParams);
  }

  const p5Constructor = (window as unknown as Record<string, unknown>).p5;
  if (typeof p5Constructor === "function") {
    p5Instance = new (p5Constructor as new () => unknown)();
  }

  // Cap frame rate at 30fps to reduce CPU usage (still smooth for generative art)
  const w = window as unknown as Record<string, unknown>;
  if (typeof w.frameRate === "function") {
    setTimeout(() => {
      (w.frameRate as (fps: number) => void)(30);
    }, 50);
  }

  // Re-apply transparent mode after p5 initializes (it resets globals)
  if (transparentMode) {
    setTimeout(() => handleTransparent(true), 50);
  }

  sendReady();
}

function handleParams(values: ParamValues): void {
  paramManager.update(values);
}

function handleTransparent(enabled: boolean): void {
  transparentMode = enabled;
  const w = window as unknown as Record<string, (...args: unknown[]) => void>;

  if (enabled) {
    // Store original background function
    if (w.background && !(w as Record<string, unknown>).__originalBackground) {
      (w as Record<string, unknown>).__originalBackground = w.background;
    }
    // Replace background() with clear()
    w.background = function() {
      if (typeof w.clear === "function") {
        w.clear();
      }
    };
  } else {
    // Restore original background
    const orig = (w as Record<string, unknown>).__originalBackground;
    if (typeof orig === "function") {
      w.background = orig as (...args: unknown[]) => void;
      delete (w as Record<string, unknown>).__originalBackground;
    }
  }

  // Force redraw so noLoop() sketches re-render with updated background behavior
  if (enabled) {
    const win = window as unknown as Record<string, unknown>;
    if (typeof win.redraw === "function") {
      (win.redraw as () => void)();
    }
  }
}

function handleDrivers(palette: string[], tempo: number): void {
  const w = window as unknown as Record<string, unknown>;
  const ergon = w.ergon as Record<string, unknown>;
  ergon.palette = palette;
  ergon.tempo = tempo;
  // Trigger redraw for noLoop sketches
  if (typeof w.redraw === "function") {
    (w.redraw as () => void)();
  }
}

function handleSeed(seed: number): void {
  const w = window as unknown as Record<string, unknown>;
  if (typeof w.randomSeed === "function") {
    (w.randomSeed as (s: number) => void)(seed);
  }
  if (typeof w.noiseSeed === "function") {
    (w.noiseSeed as (s: number) => void)(seed);
  }
  if (typeof w.redraw === "function") {
    (w.redraw as () => void)();
  }
}

function handleExport(scale: number): void {
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    sendError("No canvas found for export");
    return;
  }
  const dataUrl = canvas.toDataURL("image/png");
  const msg = {
    type: "ergon:export-data" as const,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
  window.parent.postMessage(msg, "*");
}

window.addEventListener("message", (event: MessageEvent<ParentMessage>) => {
  const msg = event.data;
  if (!msg || typeof msg.type !== "string") return;

  switch (msg.type) {
    case "ergon:load":
      handleLoad(msg.code, msg.params);
      break;
    case "ergon:params":
      handleParams(msg.values);
      break;
    case "ergon:export":
      handleExport(msg.scale);
      break;
    case "ergon:seed":
      handleSeed(msg.seed);
      break;
    case "ergon:transparent":
      handleTransparent(msg.enabled);
      break;
    case "ergon:drivers":
      handleDrivers(msg.palette, msg.tempo);
      break;
  }
});

window.parent.postMessage({ type: "ergon:runtime-ready" }, "*");

function checkHashParams(): void {
  const hash = window.location.hash.slice(1);
  if (!hash) return;

  const searchParams = new URLSearchParams(hash);
  const code = searchParams.get("code");
  const paramValues = searchParams.get("params");

  if (code) {
    const decoded = decodeURIComponent(code);
    const values = paramValues ? JSON.parse(decodeURIComponent(paramValues)) : {};
    setTimeout(() => {
      handleLoad(decoded, values);
    }, 200);
  }
}

checkHashParams();
