import { describe, expect, it, vi } from "vitest";
import { compileTexturePatch, textureRecipes } from "@/lib/texture-patch";
import { createTextureRuntime } from "@/lib/texture-runtime";

function installWebGl2Stub() {
  const texture = {} as WebGLTexture;
  const framebuffer = {} as WebGLFramebuffer;
  const program = {} as WebGLProgram;
  const shader = {} as WebGLShader;
  const buffer = {} as WebGLBuffer;
  const locations = new Map<string, WebGLUniformLocation>();

  const gl = {
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    COLOR_ATTACHMENT0: 0x8ce0,
    FRAMEBUFFER: 0x8d40,
    TEXTURE_2D: 0x0de1,
    TEXTURE0: 0x84c0,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    FLOAT: 0x1406,
    CLAMP_TO_EDGE: 0x812f,
    LINEAR: 0x2601,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    TRIANGLE_STRIP: 0x0005,
    DEPTH_TEST: 0x0b71,
    COLOR_BUFFER_BIT: 0x4000,
    createShader: vi.fn(() => shader),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ""),
    createProgram: vi.fn(() => program),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ""),
    deleteShader: vi.fn(),
    deleteProgram: vi.fn(),
    createBuffer: vi.fn(() => buffer),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    createTexture: vi.fn(() => texture),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
    createFramebuffer: vi.fn(() => framebuffer),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    deleteTexture: vi.fn(),
    deleteFramebuffer: vi.fn(),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getUniformLocation: vi.fn((_: WebGLProgram, name: string) => {
      if (!locations.has(name)) locations.set(name, { name } as unknown as WebGLUniformLocation);
      return locations.get(name)!;
    }),
    uniform1f: vi.fn(),
    uniform1i: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    activeTexture: vi.fn(),
    viewport: vi.fn(),
    drawArrays: vi.fn(),
    disable: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    readPixels: vi.fn((_x: number, _y: number, width: number, height: number, _format: number, _type: number, pixels: Uint8Array) => {
      for (let i = 0; i < width * height * 4; i += 4) {
        pixels[i] = 40;
        pixels[i + 1] = 120;
        pixels[i + 2] = 200;
        pixels[i + 3] = 255;
      }
    }),
  } as unknown as WebGL2RenderingContext;

  return gl;
}

describe("texture runtime previews", () => {
  it("exportNodePreview returns null for unknown nodes and a data URL after cook", () => {
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "clientWidth", { value: 320 });
    Object.defineProperty(canvas, "clientHeight", { value: 180 });
    canvas.getContext = vi.fn(() => installWebGl2Stub()) as unknown as typeof canvas.getContext;

    const runtime = createTextureRuntime(canvas);
    expect(runtime.exportNodePreview("missing")).toBeNull();

    const plan = compileTexturePatch(textureRecipes[0].create());
    runtime.setPatch(plan);
    runtime.renderFrame(0);

    const preview = runtime.exportNodePreview("curl-1", 64);
    expect(preview).toMatch(/^data:image\/bmp;base64,/);
    expect(preview!.length).toBeGreaterThan(100);

    runtime.destroy();
  });
});
