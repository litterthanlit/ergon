import type { Template } from "./registry";
import type { ParamSchema } from "@/lib/types";

export const wavesSchema: ParamSchema = {
  layers: { type: "number", min: 2, max: 12, default: 5, step: 1, label: "Layers" },
  amplitude: { type: "number", min: 10, max: 120, default: 40, step: 5, label: "Amplitude" },
  speed: { type: "number", min: 0.2, max: 4.0, default: 1.0, step: 0.1, label: "Speed" },
  waveform: { type: "select", options: ["Sine", "Square", "Sawtooth", "Noise"], default: "Sine", label: "Waveform" },
  palette: { type: "select", options: ["Ocean", "Lava", "Void", "Prism", "Dusk"], default: "Ocean", label: "Palette" },
};

export const wavesCode = `
const palettes = {
  Ocean:  ['#03045e', '#023e8a', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
  Lava:   ['#03071e', '#370617', '#6a040f', '#d00000', '#f48c06', '#ffba08'],
  Void:   ['#10002b', '#240046', '#3c096c', '#7b2d8b', '#c77dff', '#e0aaff'],
  Prism:  ['#ff006e', '#fb5607', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0'],
  Dusk:   ['#2d1b69', '#11998e', '#38ef7d', '#fc4a1a', '#f7b733', '#c94b4b'],
};

const params = ergon.params({
  layers:    { type: 'number', min: 2, max: 12, default: 5, step: 1, label: 'Layers' },
  amplitude: { type: 'number', min: 10, max: 120, default: 40, step: 5, label: 'Amplitude' },
  speed:     { type: 'number', min: 0.2, max: 4.0, default: 1.0, step: 0.1, label: 'Speed' },
  waveform:  { type: 'select', options: ['Sine', 'Square', 'Sawtooth', 'Noise'], default: 'Sine', label: 'Waveform' },
  palette:   { type: 'select', options: ['Ocean', 'Lava', 'Void', 'Prism', 'Dusk'], default: 'Ocean', label: 'Palette' },
});

let t = 0;

function waveY(x, layer, time) {
  const freq = 0.004 + layer * 0.002;
  const phase = time * params.speed + layer * 0.7;
  const raw = x * freq + phase;
  if (params.waveform === 'Sine') return sin(raw);
  if (params.waveform === 'Square') return raw % TWO_PI < PI ? 1 : -1;
  if (params.waveform === 'Sawtooth') return (raw % TWO_PI) / PI - 1;
  return noise(x * freq * 0.5, time * 0.3 + layer * 0.4) * 2 - 1;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);
}

function draw() {
  background(10, 10, 20, 40);
  t += 0.016;
  const colors = palettes[params.palette] || palettes.Ocean;

  for (let layer = 0; layer < params.layers; layer++) {
    const yBase = map(layer, 0, params.layers - 1, height * 0.2, height * 0.8);
    const c = colors[layer % colors.length];
    stroke(c);
    strokeWeight(1.5);
    noFill();

    beginShape();
    for (let x = 0; x <= width; x += 3) {
      const y = yBase + waveY(x, layer, t) * params.amplitude;
      vertex(x, y);
    }
    endShape();
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
`;

export const waves: Template = {
  id: "waves",
  name: "Waves",
  description: "Overlapping waveforms create interference patterns that breathe and shift.",
  schema: wavesSchema,
  code: wavesCode,
};
