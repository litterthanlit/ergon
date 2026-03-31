import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBridge, type Bridge } from "@/lib/bridge";

describe("createBridge", () => {
  let iframe: HTMLIFrameElement;
  let bridge: Bridge;
  let onSchema: ReturnType<typeof vi.fn>;
  let onReady: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    iframe = document.createElement("iframe");
    Object.defineProperty(iframe, "contentWindow", {
      value: { postMessage: vi.fn() },
      writable: true,
    });

    onSchema = vi.fn();
    onReady = vi.fn();
    onError = vi.fn();

    bridge = createBridge({ iframe, onSchema, onReady, onError });
  });

  it("sends load message to iframe", () => {
    const code = 'function draw() { background(0); }';
    const params = { count: 50 };
    bridge.load(code, params);
    expect(iframe.contentWindow!.postMessage).toHaveBeenCalledWith(
      { type: "ergon:load", code, params },
      "*"
    );
  });

  it("sends param update to iframe", () => {
    bridge.updateParams({ count: 75 });
    expect(iframe.contentWindow!.postMessage).toHaveBeenCalledWith(
      { type: "ergon:params", values: { count: 75 } },
      "*"
    );
  });

  it("handles schema message from iframe", () => {
    const schema = {
      count: { type: "number" as const, min: 0, max: 100, default: 50, step: 1, label: "Count" },
    };
    const event = new MessageEvent("message", {
      data: { type: "ergon:schema", schema },
      source: iframe.contentWindow,
    });
    window.dispatchEvent(event);
    expect(onSchema).toHaveBeenCalledWith(schema);
  });

  it("handles ready message from iframe", () => {
    const event = new MessageEvent("message", {
      data: { type: "ergon:ready" },
      source: iframe.contentWindow,
    });
    window.dispatchEvent(event);
    expect(onReady).toHaveBeenCalled();
  });

  it("handles error message from iframe", () => {
    const event = new MessageEvent("message", {
      data: { type: "ergon:error", message: "Syntax error" },
      source: iframe.contentWindow,
    });
    window.dispatchEvent(event);
    expect(onError).toHaveBeenCalledWith("Syntax error");
  });

  it("cleans up message listener on destroy", () => {
    const spy = vi.spyOn(window, "removeEventListener");
    bridge.destroy();
    expect(spy).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("ignores messages from other sources", () => {
    const event = new MessageEvent("message", {
      data: { type: "ergon:ready" },
      source: null,
    });
    window.dispatchEvent(event);
    expect(onReady).not.toHaveBeenCalled();
  });
});
