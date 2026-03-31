import { describe, it, expect, vi } from "vitest";
import { wrapSketchCode, extractParamsCall } from "@/runtime/executor";

describe("extractParamsCall", () => {
  it("detects ergon.params() in code", () => {
    const code = `
const params = ergon.params({
  count: { type: 'number', min: 0, max: 100, default: 50, label: 'Count' }
});
function setup() {}
function draw() { background(params.count); }
`;
    expect(extractParamsCall(code)).toBe(true);
  });

  it("returns false when no ergon.params() call", () => {
    const code = `function setup() {} function draw() { background(0); }`;
    expect(extractParamsCall(code)).toBe(false);
  });
});

describe("wrapSketchCode", () => {
  it("wraps code in a function that receives ergon and p5 globals", () => {
    const code = `function setup() { createCanvas(400, 400); }`;
    const wrapped = wrapSketchCode(code);
    expect(wrapped).toContain(code);
    expect(typeof wrapped).toBe("string");
    expect(() => new Function("ergon", wrapped)).not.toThrow();
  });
});
