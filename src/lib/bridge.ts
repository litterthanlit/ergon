import type { ParamSchema, ParamValues, ParentMessage, ChildMessage } from "./types";

export type BridgeCallbacks = {
  iframe: HTMLIFrameElement;
  onSchema: (schema: ParamSchema) => void;
  onReady: () => void;
  onError: (message: string) => void;
  onExportData?: (dataUrl: string, width: number, height: number) => void;
};

export type Bridge = {
  load: (code: string, params: ParamValues) => void;
  updateParams: (values: ParamValues) => void;
  destroy: () => void;
  requestExport: (scale?: number) => void;
};

export function createBridge(callbacks: BridgeCallbacks): Bridge {
  const { iframe, onSchema, onReady, onError, onExportData } = callbacks;

  function sendToIframe(msg: ParentMessage): void {
    iframe.contentWindow?.postMessage(msg, "*");
  }

  function handleMessage(event: MessageEvent): void {
    if (event.source !== iframe.contentWindow) return;
    const msg = event.data as ChildMessage;
    if (!msg || typeof msg.type !== "string") return;

    switch (msg.type) {
      case "ergon:schema":
        onSchema(msg.schema);
        break;
      case "ergon:ready":
        onReady();
        break;
      case "ergon:error":
        onError(msg.message);
        break;
      case "ergon:export-data":
        onExportData?.(msg.dataUrl, msg.width, msg.height);
        break;
    }
  }

  window.addEventListener("message", handleMessage);

  return {
    load(code: string, params: ParamValues) {
      sendToIframe({ type: "ergon:load", code, params });
    },
    updateParams(values: ParamValues) {
      sendToIframe({ type: "ergon:params", values });
    },
    destroy() {
      window.removeEventListener("message", handleMessage);
    },
    requestExport(scale = 1) {
      sendToIframe({ type: "ergon:export", format: "png", scale });
    },
  };
}
