import type { ParamValues } from "./types";
import type {
  TextureOperatorDefinition,
  TextureRenderPass,
  TextureRendererBackend,
  TextureRenderPlan,
  TextureRuntimeStats,
} from "./texture-patch";
import { countPersistentBuffers } from "./texture-patch";

type TextureRuntimeCapabilities = {
  webgpu: boolean;
  webgl2: boolean;
  preferredBackend: TextureRendererBackend;
  fallbackReason: string | null;
};

type TextureRuntime = {
  setPatch: (plan: TextureRenderPlan) => void;
  setParams: (nodeId: string, params: ParamValues) => void;
  setViewerNode: (nodeId: string) => void;
  renderFrame: (time: number) => TextureRuntimeStats;
  exportPng: (scale?: number) => string;
  /** Blit a cooked node FBO to a small data URL for graph thumbs. Returns null if the node has not cooked yet. */
  exportNodePreview: (nodeId: string, size?: number) => string | null;
  getCapabilities: () => TextureRuntimeCapabilities;
  destroy: () => void;
};

type RenderTarget = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
};

const vertexShader = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const shaderPrelude = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uInput0;
uniform sampler2D uInput1;
uniform sampler2D uFeedback;
uniform float uScale;
uniform float uSpeed;
uniform float uContrast;
uniform float uSeed;
uniform float uCells;
uniform float uJitter;
uniform float uEdge;
uniform float uSize;
uniform float uFeather;
uniform float uTranslateX;
uniform float uTranslateY;
uniform float uRotate;
uniform float uRadius;
uniform float uGain;
uniform float uStrength;
uniform float uBrightness;
uniform float uGamma;
uniform float uSaturation;
uniform float uIntensity;
uniform float uOpacity;
uniform float uDecay;
uniform float uAmount;
uniform float uDriftX;
uniform float uDriftY;
uniform float uMode;
uniform float uFlow;
uniform float uDepth;
uniform float uRefraction;
uniform float uBloom;
uniform float uThreshold;
uniform float uSoftness;
uniform float uAberration;
uniform float uVignette;
uniform float uGrain;
uniform float uExposure;
uniform float uTemperature;
uniform float uMix;
uniform float uDiffusion;
uniform float uSharpness;
uniform float uBlurDir;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = mat2(1.62, 1.18, -1.18, 1.62) * p;
    a *= 0.52;
  }
  return v;
}

vec2 curlField(vec2 p) {
  float e = 0.075;
  float n1 = fbm(p + vec2(0.0, e));
  float n2 = fbm(p - vec2(0.0, e));
  float n3 = fbm(p + vec2(e, 0.0));
  float n4 = fbm(p - vec2(e, 0.0));
  return normalize(vec2(n1 - n2, -(n3 - n4)) + vec2(0.0001));
}

vec3 adjustSaturation(vec3 color, float sat) {
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(vec3(luma), color, sat);
}

vec2 rotateUv(vec2 uv, float angle) {
  vec2 p = uv - 0.5;
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c) * p + 0.5;
}

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 gradePalette(float value) {
  vec3 lowMid = mix(uColorA, uColorB, smoothstep(0.0, 0.62, value));
  return mix(lowMid, uColorC, smoothstep(0.45, 1.0, value));
}

float grainAt(vec2 uv, float time) {
  return hash(uv * uResolution.xy + vec2(time * 71.13, time * 19.91)) - 0.5;
}

vec3 softThreshold(vec3 color, float threshold, float knee) {
  vec3 soft = color - threshold + knee;
  soft = max(soft, vec3(0.0));
  soft = (soft * soft) / (4.0 * knee + 0.0001);
  return max(color - threshold, soft);
}
`;

const fragmentShaders: Record<string, string> = {
  copy: `${shaderPrelude}
void main() {
  outColor = texture(uInput0, vUv);
}`,
  noise: `${shaderPrelude}
void main() {
  vec2 p = vUv * uScale + vec2(uSeed * 1.37, uTime * uSpeed);
  float n = fbm(p + 0.35 * vec2(sin(uTime * 0.31), cos(uTime * 0.27)));
  n = pow(clamp(n * uContrast, 0.0, 1.0), 1.15);
  vec3 col = mix(vec3(0.02, 0.025, 0.04), vec3(n), n);
  outColor = vec4(col, 1.0);
}`,
  curlNoise: `${shaderPrelude}
void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * uScale + vec2(uSeed * 0.37, -uSeed * 0.23);
  vec2 flow = curlField(p + uTime * uSpeed * vec2(0.32, -0.22));
  float field = fbm(p + flow * uFlow + vec2(sin(uTime * 0.17), cos(uTime * 0.13)) * 0.35);
  float ridges = pow(1.0 - abs(field * 2.0 - 1.0), 1.35);
  float strands = smoothstep(0.42, 0.98, ridges * uContrast);
  float body = smoothstep(0.18, 0.92, field);
  vec3 palette = gradePalette(strands);
  vec3 color = mix(uColorA * 0.55, palette, strands * 0.78);
  color += uColorB * pow(strands, 3.2) * 0.2;
  color += uColorC * pow(strands, 6.0) * 0.18;
  color *= 0.34 + body * 0.72;
  outColor = vec4(clamp(color, 0.0, 1.12), 1.0);
}`,
  reactionDiffusion: `${shaderPrelude}
void main() {
  vec2 uv = vUv;
  vec2 p = uv * uScale + vec2(uSeed * 0.13, uTime * uSpeed);
  vec2 flow = curlField(p) * (0.006 + uFlow * 0.008);
  vec3 fresh = texture(uInput0, uv + flow).rgb;
  vec3 memory = texture(uFeedback, uv - flow * 0.7).rgb;
  float activator = fbm(p + memory.rg * 2.0);
  float inhibitor = fbm(p * 1.7 - memory.gb * 1.5 + 2.3);
  float cells = smoothstep(0.18, 0.82, activator - inhibitor * 0.42 + luma(fresh) * 0.38);
  vec3 reacted = mix(memory * (0.965 - uDiffusion * 0.08), gradePalette(cells), uDiffusion);
  reacted = pow(max(reacted, vec3(0.0)), vec3(1.0 / max(0.08, uSharpness)));
  outColor = vec4(clamp(reacted, 0.0, 1.3), 1.0);
}`,
  gradient: `${shaderPrelude}
void main() {
  vec2 dir = vec2(cos(uRotate), sin(uRotate));
  float t = dot(vUv - 0.5, dir) * uScale + 0.5;
  t = smoothstep(0.0, 1.0, pow(clamp(t, 0.0, 1.0), max(0.05, uGamma)));
  outColor = vec4(mix(uColorA, uColorB, t), 1.0);
}`,
  voronoi: `${shaderPrelude}
void main() {
  vec2 p = vUv * max(1.0, uCells);
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float minDist = 10.0;
  float secondDist = 10.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 r = vec2(hash(ip + offset), hash(ip + offset + 11.3));
      r = 0.5 + uJitter * (r - 0.5);
      r += 0.18 * vec2(sin(uTime * uSpeed + r.x * 6.28), cos(uTime * uSpeed + r.y * 6.28));
      float d = length(offset + r - fp);
      if (d < minDist) {
        secondDist = minDist;
        minDist = d;
      } else if (d < secondDist) {
        secondDist = d;
      }
    }
  }
  float cell = smoothstep(0.0, 0.9, minDist);
  float line = 1.0 - smoothstep(0.0, max(0.01, uEdge), secondDist - minDist);
  outColor = vec4(vec3(cell + line), 1.0);
}`,
  shape: `${shaderPrelude}
void main() {
  vec2 p = vUv - 0.5;
  float d = length(p);
  float circle = 1.0 - smoothstep(uSize, uSize + uFeather, d);
  float box = 1.0 - smoothstep(uSize, uSize + uFeather, max(abs(p.x), abs(p.y)));
  float ring = smoothstep(uSize - uFeather, uSize, d) * (1.0 - smoothstep(uSize, uSize + uFeather, d));
  float mask = mix(circle, box, step(0.5, uMode));
  mask = mix(mask, ring, step(1.5, uMode));
  outColor = vec4(uColorA * mask, mask);
}`,
  transform: `${shaderPrelude}
void main() {
  vec2 uv = rotateUv(vUv, uRotate);
  uv = (uv - 0.5) / max(0.001, uScale) + 0.5 - vec2(uTranslateX, uTranslateY);
  outColor = texture(uInput0, uv);
}`,
  blur: `${shaderPrelude}
void main() {
  vec2 texel = 1.0 / uResolution;
  vec2 radius = texel * uRadius;
  vec4 c = texture(uInput0, vUv) * 0.2;
  c += texture(uInput0, vUv + vec2(radius.x, 0.0)) * 0.12;
  c += texture(uInput0, vUv - vec2(radius.x, 0.0)) * 0.12;
  c += texture(uInput0, vUv + vec2(0.0, radius.y)) * 0.12;
  c += texture(uInput0, vUv - vec2(0.0, radius.y)) * 0.12;
  c += texture(uInput0, vUv + radius) * 0.08;
  c += texture(uInput0, vUv - radius) * 0.08;
  c += texture(uInput0, vUv + vec2(radius.x, -radius.y)) * 0.08;
  c += texture(uInput0, vUv + vec2(-radius.x, radius.y)) * 0.08;
  outColor = vec4(c.rgb * uGain, c.a);
}`,
  displace: `${shaderPrelude}
void main() {
  vec4 mapTex = texture(uInput1, vUv);
  float procedural = fbm(vUv * uScale + uTime * uSpeed);
  vec2 offset = (mapTex.rg + procedural - 1.0) * uStrength;
  outColor = texture(uInput0, vUv + offset);
}`,
  fluidAdvection: `${shaderPrelude}
void main() {
  vec2 uv = vUv;
  vec2 p = uv * uScale + vec2(uTime * uSpeed, -uTime * uSpeed * 0.72);
  vec2 flowA = curlField(p) * uStrength * (0.55 + uFlow);
  vec2 flowB = curlField(p * 1.37 + 2.1) * uStrength * (0.32 + uFlow * 0.55);
  vec2 flow = flowA + flowB * 0.55;
  vec3 base = texture(uInput0, uv).rgb;
  vec3 a = texture(uInput0, uv + flow).rgb;
  vec3 b = texture(uInput0, uv + flow * 0.42 + vec2(0.003, -0.002)).rgb;
  vec3 c = texture(uInput0, uv + flowB * 1.15 + vec2(-0.002, 0.004)).rgb;
  float filament = pow(fbm(p + flow * 8.0), 2.05);
  float ribbon = pow(1.0 - abs(fbm(p * 2.2 + flow * 4.0) * 2.0 - 1.0), 2.4);
  vec3 advected = mix(mix(a, b, 0.48), c, 0.28);
  advected += (uColorB * 0.5 + uColorC * 0.35) * filament * 0.085;
  advected += uColorC * ribbon * 0.06;
  vec3 color = mix(base, advected, uMix);
  color = mix(color, color * color * (1.0 + filament * 0.35), 0.18);
  outColor = vec4(clamp(color, 0.0, 1.35), 1.0);
}`,
  raymarchGlass: `${shaderPrelude}
void main() {
  vec2 uv = vUv;
  vec2 p = uv * uScale + uTime * 0.035;
  float h = fbm(p);
  float hx = fbm(p + vec2(0.022, 0.0));
  float hy = fbm(p + vec2(0.0, 0.022));
  vec2 normal = normalize(vec2(h - hx, h - hy) + vec2(0.0001));
  vec3 n3 = normalize(vec3(normal * (0.55 + uDepth), 1.0));
  float fresnel = pow(1.0 - clamp(dot(n3, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.35);
  float rim = pow(fresnel, 0.72);
  vec2 refrOff = normal * uRefraction * (0.55 + uDepth * 0.85);
  vec3 refracted = texture(uInput0, uv + refrOff).rgb;
  vec3 refractedDeep = texture(uInput0, uv + refrOff * 1.55).rgb;
  float causticMask = smoothstep(0.38, 0.92, h) * smoothstep(0.95, 0.55, h);
  vec3 caustic = gradePalette(causticMask) * rim * uStrength;
  float highlight = pow(max(0.0, 1.0 - length(normal) * 2.2), 8.0) * uStrength;
  vec3 color = mix(texture(uInput0, uv).rgb, mix(refracted, refractedDeep, 0.35), 0.78);
  color += caustic * (0.22 + uSoftness * 0.1);
  color += vec3(0.92, 0.96, 1.0) * highlight * 0.55;
  color += rim * uColorC * 0.08;
  outColor = vec4(clamp(color, 0.0, 1.65), 1.0);
}`,
  levels: `${shaderPrelude}
void main() {
  vec4 c = texture(uInput0, vUv);
  vec3 color = c.rgb + uBrightness;
  color = (color - 0.5) * uContrast + 0.5;
  color = pow(max(color, vec3(0.0)), vec3(1.0 / max(0.001, uGamma)));
  color = adjustSaturation(color, uSaturation);
  outColor = vec4(clamp(color, 0.0, 1.0), c.a);
}`,
  colorize: `${shaderPrelude}
void main() {
  vec4 src = texture(uInput0, vUv);
  float value = luma(src.rgb);
  vec3 color = gradePalette(value);
  outColor = vec4(color * uIntensity, max(src.a, 1.0));
}`,
  bloomExtract: `${shaderPrelude}
void main() {
  vec3 base = texture(uInput0, vUv).rgb;
  float knee = max(0.001, uSoftness * 0.22);
  vec3 soft = softThreshold(base, uThreshold, knee);
  outColor = vec4(soft, 1.0);
}`,
  bloomBlur: `${shaderPrelude}
void main() {
  vec2 texel = 1.0 / uResolution;
  vec2 dir = mix(vec2(1.0, 0.0), vec2(0.0, 1.0), uBlurDir) * texel * max(0.5, uRadius);
  vec3 c = texture(uInput0, vUv).rgb * 0.227027;
  c += texture(uInput0, vUv + dir * 1.384615).rgb * 0.316216;
  c += texture(uInput0, vUv - dir * 1.384615).rgb * 0.316216;
  c += texture(uInput0, vUv + dir * 3.230769).rgb * 0.07027;
  c += texture(uInput0, vUv - dir * 3.230769).rgb * 0.07027;
  outColor = vec4(c, 1.0);
}`,
  bloomComposite: `${shaderPrelude}
void main() {
  vec3 base = texture(uInput0, vUv).rgb;
  vec3 glow = texture(uInput1, vUv).rgb;
  vec3 color = base + glow * uStrength * (0.85 + uSoftness * 0.2);
  outColor = vec4(clamp(color, 0.0, 1.85), 1.0);
}`,
  /** Fallback single-pass bloom if multipass path is unavailable. */
  bloom: `${shaderPrelude}
void main() {
  vec2 texel = 1.0 / uResolution;
  vec2 radius = texel * uRadius;
  vec3 base = texture(uInput0, vUv).rgb;
  vec3 glow = softThreshold(base, uThreshold, max(0.001, uSoftness * 0.22));
  glow += softThreshold(texture(uInput0, vUv + vec2(radius.x, 0.0)).rgb, uThreshold, 0.05) * 0.62;
  glow += softThreshold(texture(uInput0, vUv - vec2(radius.x, 0.0)).rgb, uThreshold, 0.05) * 0.62;
  glow += softThreshold(texture(uInput0, vUv + vec2(0.0, radius.y)).rgb, uThreshold, 0.05) * 0.62;
  glow += softThreshold(texture(uInput0, vUv - vec2(0.0, radius.y)).rgb, uThreshold, 0.05) * 0.62;
  glow *= 0.38 + uSoftness * 0.2;
  vec3 color = base + glow * uStrength;
  outColor = vec4(clamp(color, 0.0, 1.8), 1.0);
}`,
  chromaticAberration: `${shaderPrelude}
void main() {
  vec2 uv = vUv;
  vec2 fromCenter = uv - 0.5;
  float edge = pow(length(fromCenter) * 1.45, max(0.1, uSoftness));
  vec2 shift = normalize(fromCenter + vec2(0.0001)) * uAberration * edge;
  vec3 base = texture(uInput0, uv).rgb;
  vec3 separated = vec3(
    texture(uInput0, uv + shift).r,
    texture(uInput0, uv).g,
    texture(uInput0, uv - shift).b
  );
  outColor = vec4(mix(base, separated, uMix), 1.0);
}`,
  filmGrain: `${shaderPrelude}
void main() {
  vec2 uv = vUv;
  vec3 color = texture(uInput0, uv).rgb;
  float vig = smoothstep(0.92, 0.18, length(uv - 0.5));
  color *= mix(1.0 - uVignette * 0.42, 1.0, vig);
  color += grainAt(uv, uTime) * uGrain;
  outColor = vec4(clamp(color * uIntensity, 0.0, 1.0), 1.0);
}`,
  colorGrade: `${shaderPrelude}
void main() {
  vec3 src = texture(uInput0, vUv).rgb;
  vec3 color = src * exp2(uExposure);
  color = (color - 0.5) * uContrast + 0.5;
  color.r += uTemperature * 0.055;
  color.b -= uTemperature * 0.045;
  color = adjustSaturation(color, uSaturation);
  vec3 palette = gradePalette(luma(color));
  color = mix(color, palette, uIntensity * 0.82);
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`,
  composite: `${shaderPrelude}
void main() {
  vec4 base = texture(uInput0, vUv);
  vec4 over = texture(uInput1, vUv);
  vec3 add = base.rgb + over.rgb;
  vec3 screen = 1.0 - (1.0 - base.rgb) * (1.0 - over.rgb);
  vec3 multiply = base.rgb * over.rgb;
  vec3 overMode = mix(base.rgb, over.rgb, over.a);
  vec3 blended = overMode;
  if (uMode > 0.5 && uMode < 1.5) blended = add;
  if (uMode >= 1.5 && uMode < 2.5) blended = screen;
  if (uMode >= 2.5) blended = multiply;
  outColor = vec4(mix(base.rgb, blended, uOpacity), max(base.a, over.a));
}`,
  feedback: `${shaderPrelude}
void main() {
  vec4 fresh = texture(uInput0, vUv);
  vec4 memory = texture(uFeedback, vUv - vec2(uDriftX, uDriftY));
  vec3 color = mix(fresh.rgb, memory.rgb * uDecay + fresh.rgb * uAmount, uAmount);
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`,
};

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compile failed");
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, fragmentSource: string) {
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create WebGL program");
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexShader));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Program link failed");
  }
  return program;
}

function createTarget(gl: WebGL2RenderingContext, width: number, height: number): RenderTarget {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) throw new Error("Could not allocate framebuffer");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texture, framebuffer, width, height };
}

/** Encode RGBA pixels as a BMP data URL so previews work without Canvas2D (e.g. happy-dom tests). */
function rgbaToBmpDataUrl(pixels: Uint8Array, width: number, height: number): string {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  bytes[0] = 0x42;
  bytes[1] = 0x4d;
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelDataSize, true);

  for (let y = 0; y < height; y++) {
    // WebGL readPixels and BMP are both bottom-up — copy rows without flipping.
    const srcRow = y * width * 4;
    const dstRow = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const src = srcRow + x * 4;
      const dst = dstRow + x * 3;
      bytes[dst] = pixels[src + 2] ?? 0;
      bytes[dst + 1] = pixels[src + 1] ?? 0;
      bytes[dst + 2] = pixels[src] ?? 0;
    }
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return `data:image/bmp;base64,${btoa(binary)}`;
}

function hexToRgb(value: unknown): [number, number, number] {
  if (typeof value !== "string") return [1, 1, 1];
  const match = value.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return [1, 1, 1];
  return [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255];
}

function modeValue(value: unknown, options: string[]) {
  const index = options.findIndex((option) => option === value);
  return index < 0 ? 0 : index;
}

function numeric(values: ParamValues, key: string, fallback: number) {
  const value = values[key];
  return typeof value === "number" ? value : fallback;
}

function setUniform1f(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, value: number) {
  const location = gl.getUniformLocation(program, name);
  if (location) gl.uniform1f(location, value);
}

function setUniform1i(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, value: number) {
  const location = gl.getUniformLocation(program, name);
  if (location) gl.uniform1i(location, value);
}

function setUniform2f(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, x: number, y: number) {
  const location = gl.getUniformLocation(program, name);
  if (location) gl.uniform2f(location, x, y);
}

function setUniform3f(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, x: number, y: number, z: number) {
  const location = gl.getUniformLocation(program, name);
  if (location) gl.uniform3f(location, x, y, z);
}

export function detectTextureRuntimeCapabilities(canvas?: HTMLCanvasElement): TextureRuntimeCapabilities {
  const webgpu = typeof navigator !== "undefined" && "gpu" in navigator;
  let webgl2 = false;
  if (canvas) {
    try {
      webgl2 = Boolean(canvas.getContext("webgl2"));
    } catch {
      webgl2 = false;
    }
  } else {
    webgl2 = typeof WebGL2RenderingContext !== "undefined";
  }
  return {
    webgpu,
    webgl2,
    preferredBackend: webgpu ? "webgpu" : "webgl2",
    fallbackReason: webgpu ? null : "WebGPU is not exposed by this browser; using WebGL2 compatibility rendering.",
  };
}

export function createTextureRuntime(
  canvas: HTMLCanvasElement,
  operators: TextureOperatorDefinition[] = []
): TextureRuntime {
  void operators;
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: true, preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL2 is not supported in this browser.");

  const detectedCapabilities = detectTextureRuntimeCapabilities();
  const capabilities: TextureRuntimeCapabilities = { ...detectedCapabilities, webgl2: true };
  const actualBackend: TextureRendererBackend = "webgl2";
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const programs = new Map<string, WebGLProgram>();
  const targets = new Map<string, RenderTarget>();
  const persistentTargets = new Map<string, [RenderTarget, RenderTarget]>();
  const persistentIndex = new Map<string, number>();
  let plan: TextureRenderPlan | null = null;
  let viewerNodeId = "";
  let requestedBackend: TextureRendererBackend = "webgpu";
  let frame = 0;
  let lastTime = performance.now();
  let fps = 60;
  const nodeStats: TextureRuntimeStats["nodeStats"] = {};

  const getProgramByKey = (key: string) => {
    const shaderKey = fragmentShaders[key] ? key : "copy";
    const existing = programs.get(shaderKey);
    if (existing) return existing;
    const program = createProgram(gl, fragmentShaders[shaderKey]);
    programs.set(shaderKey, program);
    return program;
  };

  const getProgram = (pass: TextureRenderPass | "copy") => {
    if (pass === "copy") return getProgramByKey("copy");
    const shader = pass.shaderModules.webgl2 ?? pass.shader;
    return getProgramByKey(fragmentShaders[shader] ? shader : "copy");
  };

  const ensureSize = (width: number, height: number) => {
    const maxDpr = plan?.quality === "final" ? 2 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const targetWidth = Math.max(2, Math.floor(width * dpr));
    const targetHeight = Math.max(2, Math.floor(height * dpr));
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      targets.clear();
      persistentTargets.clear();
    }
  };

  const targetFor = (nodeId: string) => {
    const existing = targets.get(nodeId);
    if (existing && existing.width === canvas.width && existing.height === canvas.height) return existing;
    const target = createTarget(gl, canvas.width, canvas.height);
    targets.set(nodeId, target);
    return target;
  };

  const persistentFor = (nodeId: string) => {
    const existing = persistentTargets.get(nodeId);
    if (existing) return existing;
    const pair: [RenderTarget, RenderTarget] = [
      createTarget(gl, canvas.width, canvas.height),
      createTarget(gl, canvas.width, canvas.height),
    ];
    persistentTargets.set(nodeId, pair);
    persistentIndex.set(nodeId, 0);
    return pair;
  };

  const bindTexture = (slot: number, texture: WebGLTexture | null) => {
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  };

  const outputTextureFor = (nodeId: string | undefined) => {
    if (!nodeId) return null;
    const target = targets.get(nodeId);
    if (target) return target.texture;
    const pair = persistentTargets.get(nodeId);
    if (!pair) return null;
    const writeIndex = persistentIndex.get(nodeId) ?? 0;
    return pair[writeIndex === 0 ? 1 : 0].texture;
  };

  const drawFullscreen = (
    program: WebGLProgram,
    output: RenderTarget | null,
    bindings: { input0?: WebGLTexture | null; input1?: WebGLTexture | null; feedback?: WebGLTexture | null },
    time: number,
    params: ParamValues,
    extras?: { blurDir?: number }
  ) => {
    if (output) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer);
      gl.viewport(0, 0, output.width, output.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    bindTexture(0, bindings.input0 ?? null);
    bindTexture(1, bindings.input1 ?? bindings.input0 ?? null);
    bindTexture(2, bindings.feedback ?? bindings.input0 ?? null);

    setUniform1i(gl, program, "uInput0", 0);
    setUniform1i(gl, program, "uInput1", 1);
    setUniform1i(gl, program, "uFeedback", 2);
    setUniform2f(gl, program, "uResolution", output?.width ?? canvas.width, output?.height ?? canvas.height);
    setUniform1f(gl, program, "uTime", time);

    const [aR, aG, aB] = hexToRgb(params.colorA);
    const [bR, bG, bB] = hexToRgb(params.colorB);
    const [cR, cG, cB] = hexToRgb(params.colorC);
    setUniform3f(gl, program, "uColorA", aR, aG, aB);
    setUniform3f(gl, program, "uColorB", bR, bG, bB);
    setUniform3f(gl, program, "uColorC", cR, cG, cB);
    setUniform1f(gl, program, "uScale", numeric(params, "scale", 1));
    setUniform1f(gl, program, "uSpeed", numeric(params, "speed", 0));
    setUniform1f(gl, program, "uContrast", numeric(params, "contrast", 1));
    setUniform1f(gl, program, "uSeed", numeric(params, "seed", 0));
    setUniform1f(gl, program, "uCells", numeric(params, "cells", 8));
    setUniform1f(gl, program, "uJitter", numeric(params, "jitter", 0.5));
    setUniform1f(gl, program, "uEdge", numeric(params, "edge", 0.3));
    setUniform1f(gl, program, "uSize", numeric(params, "size", 0.5));
    setUniform1f(gl, program, "uFeather", numeric(params, "feather", 0.1));
    setUniform1f(gl, program, "uTranslateX", numeric(params, "translateX", 0));
    setUniform1f(gl, program, "uTranslateY", numeric(params, "translateY", 0));
    setUniform1f(gl, program, "uRotate", numeric(params, "rotate", numeric(params, "angle", 0)));
    setUniform1f(gl, program, "uRadius", numeric(params, "radius", 0));
    setUniform1f(gl, program, "uGain", numeric(params, "gain", 1));
    setUniform1f(gl, program, "uStrength", numeric(params, "strength", 0));
    setUniform1f(gl, program, "uBrightness", numeric(params, "brightness", 0));
    setUniform1f(gl, program, "uGamma", numeric(params, "gamma", numeric(params, "softness", 1)));
    setUniform1f(gl, program, "uSaturation", numeric(params, "saturation", 1));
    setUniform1f(gl, program, "uIntensity", numeric(params, "intensity", 1));
    setUniform1f(gl, program, "uOpacity", numeric(params, "opacity", 1));
    setUniform1f(gl, program, "uDecay", numeric(params, "decay", 0.9));
    setUniform1f(gl, program, "uAmount", numeric(params, "amount", 0.5));
    setUniform1f(gl, program, "uDriftX", numeric(params, "driftX", 0));
    setUniform1f(gl, program, "uDriftY", numeric(params, "driftY", 0));
    setUniform1f(gl, program, "uFlow", numeric(params, "flow", 0));
    setUniform1f(gl, program, "uDepth", numeric(params, "depth", 1));
    setUniform1f(gl, program, "uRefraction", numeric(params, "refraction", 0.02));
    setUniform1f(gl, program, "uBloom", numeric(params, "bloom", numeric(params, "strength", 0)));
    setUniform1f(gl, program, "uThreshold", numeric(params, "threshold", 0.35));
    setUniform1f(gl, program, "uSoftness", numeric(params, "softness", 1));
    setUniform1f(gl, program, "uAberration", numeric(params, "aberration", 0));
    setUniform1f(gl, program, "uVignette", numeric(params, "vignette", 0));
    setUniform1f(gl, program, "uGrain", numeric(params, "grain", 0));
    setUniform1f(gl, program, "uExposure", numeric(params, "exposure", 0));
    setUniform1f(gl, program, "uTemperature", numeric(params, "temperature", 0));
    setUniform1f(gl, program, "uMix", numeric(params, "mix", 1));
    setUniform1f(gl, program, "uDiffusion", numeric(params, "diffusion", 0.35));
    setUniform1f(gl, program, "uSharpness", numeric(params, "sharpness", 1));
    setUniform1f(gl, program, "uBlurDir", extras?.blurDir ?? 0);
    const mode = typeof params.shape === "string"
      ? modeValue(params.shape, ["Circle", "Box", "Ring"])
      : modeValue(params.mode, ["Over", "Add", "Screen", "Multiply"]);
    setUniform1f(gl, program, "uMode", mode);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const renderBloomPass = (pass: TextureRenderPass, time: number) => {
    const start = performance.now();
    const input0 = outputTextureFor(pass.inputNodeIds[0]);
    const extract = targetFor(`${pass.nodeId}__bloomExtract`);
    const blurH = targetFor(`${pass.nodeId}__bloomBlurH`);
    const blurV = targetFor(`${pass.nodeId}__bloomBlurV`);
    const output = targetFor(pass.nodeId);
    const params = pass.params;

    drawFullscreen(getProgramByKey("bloomExtract"), extract, { input0 }, time, params);
    drawFullscreen(getProgramByKey("bloomBlur"), blurH, { input0: extract.texture }, time, params, { blurDir: 0 });
    drawFullscreen(getProgramByKey("bloomBlur"), blurV, { input0: blurH.texture }, time, params, { blurDir: 1 });
    drawFullscreen(
      getProgramByKey("bloomComposite"),
      output,
      { input0, input1: blurV.texture },
      time,
      params
    );

    nodeStats[pass.nodeId] = { cookMs: performance.now() - start, resolution: [canvas.width, canvas.height] };
  };

  const renderPass = (pass: TextureRenderPass, time: number) => {
    const start = performance.now();
    const shaderKey = pass.shaderModules.webgl2 ?? pass.shader;
    if (!pass.bypass && shaderKey === "bloom") {
      renderBloomPass(pass, time);
      return;
    }

    const program = pass.bypass ? getProgram("copy") : getProgram(pass);
    const output = pass.usesFeedback ? persistentFor(pass.nodeId)[persistentIndex.get(pass.nodeId) ?? 0] : targetFor(pass.nodeId);
    const input0 = outputTextureFor(pass.inputNodeIds[0]);
    const input1 = outputTextureFor(pass.inputNodeIds[1]) ?? input0;
    const pair = pass.usesFeedback ? persistentFor(pass.nodeId) : null;
    const previous = pair ? pair[(persistentIndex.get(pass.nodeId) ?? 0) === 0 ? 1 : 0].texture : input0;

    drawFullscreen(program, output, { input0, input1, feedback: previous }, time, pass.params);

    if (pass.usesFeedback) persistentIndex.set(pass.nodeId, (persistentIndex.get(pass.nodeId) ?? 0) === 0 ? 1 : 0);
    nodeStats[pass.nodeId] = { cookMs: performance.now() - start, resolution: [canvas.width, canvas.height] };
  };

  const drawToScreen = (nodeId: string, time: number) => {
    const program = getProgram("copy");
    const texture = outputTextureFor(nodeId);
    drawFullscreen(program, null, { input0: texture }, time, {});
  };

  let previewReadTarget: RenderTarget | null = null;

  const ensurePreviewReadTarget = (size: number) => {
    if (previewReadTarget && previewReadTarget.width === size && previewReadTarget.height === size) {
      return previewReadTarget;
    }
    if (previewReadTarget) {
      gl.deleteTexture(previewReadTarget.texture);
      gl.deleteFramebuffer(previewReadTarget.framebuffer);
    }
    previewReadTarget = createTarget(gl, size, size);
    return previewReadTarget;
  };

  return {
    setPatch(nextPlan) {
      plan = nextPlan;
      viewerNodeId = nextPlan.viewerNodeId;
      requestedBackend = nextPlan.rendererBackend;
    },
    setParams(nodeId, params) {
      if (!plan) return;
      plan = {
        ...plan,
        passes: plan.passes.map((pass) => (pass.nodeId === nodeId ? { ...pass, params } : pass)),
      };
    },
    setViewerNode(nodeId) {
      viewerNodeId = nodeId;
    },
    renderFrame(time) {
      const start = performance.now();
      ensureSize(canvas.clientWidth || 1600, canvas.clientHeight || 900);
      gl.disable(gl.DEPTH_TEST);
      gl.clearColor(0.006, 0.008, 0.014, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (plan) {
        for (const pass of plan.passes) renderPass(pass, time);
        drawToScreen(viewerNodeId || plan.outputNodeId, time);
      }

      frame++;
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) fps = fps * 0.92 + (1000 / dt) * 0.08;
      lastTime = now;
      return {
        frame,
        fps,
        cookMs: now - start,
        backend: actualBackend,
        requestedBackend,
        quality: plan?.quality ?? "preview",
        persistentBuffers: plan ? countPersistentBuffers(plan) : 0,
        nodeStats,
      };
    },
    exportPng(scale = 1) {
      if (scale === 1) return canvas.toDataURL("image/png");
      const out = document.createElement("canvas");
      out.width = Math.round(canvas.width * scale);
      out.height = Math.round(canvas.height * scale);
      const ctx = out.getContext("2d");
      if (!ctx) return canvas.toDataURL("image/png");
      ctx.drawImage(canvas, 0, 0, out.width, out.height);
      return out.toDataURL("image/png");
    },
    exportNodePreview(nodeId, size = 96) {
      const texture = outputTextureFor(nodeId);
      if (!texture) return null;
      const clamped = Math.max(32, Math.min(160, Math.floor(size)));
      const target = ensurePreviewReadTarget(clamped);
      drawFullscreen(getProgram("copy"), target, { input0: texture }, 0, {});
      const pixels = new Uint8Array(clamped * clamped * 4);
      gl.readPixels(0, 0, clamped, clamped, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return rgbaToBmpDataUrl(pixels, clamped, clamped);
    },
    getCapabilities() {
      return capabilities;
    },
    destroy() {
      programs.forEach((program) => gl.deleteProgram(program));
      targets.forEach((target) => {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      });
      persistentTargets.forEach((pair) =>
        pair.forEach((target) => {
          gl.deleteTexture(target.texture);
          gl.deleteFramebuffer(target.framebuffer);
        })
      );
      if (previewReadTarget) {
        gl.deleteTexture(previewReadTarget.texture);
        gl.deleteFramebuffer(previewReadTarget.framebuffer);
        previewReadTarget = null;
      }
    },
  };
}

export type { TextureRuntime, TextureRuntimeCapabilities };
