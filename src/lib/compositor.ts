import type { BlendMode } from "./layers";

/** Map our blend mode names to canvas globalCompositeOperation values */
const blendModeMap: Record<BlendMode, GlobalCompositeOperation> = {
  normal: "source-over",
  multiply: "multiply",
  screen: "screen",
  overlay: "overlay",
  darken: "darken",
  lighten: "lighten",
  "color-dodge": "color-dodge",
  "color-burn": "color-burn",
  difference: "difference",
  exclusion: "exclusion",
  hue: "hue",
  saturation: "saturation",
  luminosity: "luminosity",
};

export type CompositeLayer = {
  canvas: HTMLCanvasElement;
  opacity: number;
  blendMode: BlendMode;
  visible: boolean;
};

/**
 * Composites multiple canvas layers into a single canvas.
 * Returns a dataURL of the composited result.
 */
export function compositeLayersToDataUrl(
  layers: CompositeLayer[],
  width: number,
  height: number,
): string {
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d");
  if (!ctx) throw new Error("Could not create 2d context");

  // Clear to transparent
  ctx.clearRect(0, 0, width, height);

  for (const layer of layers) {
    if (!layer.visible || layer.opacity <= 0) continue;

    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = blendModeMap[layer.blendMode] || "source-over";
    ctx.drawImage(layer.canvas, 0, 0, width, height);
    ctx.restore();
  }

  return offscreen.toDataURL("image/png");
}
