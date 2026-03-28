"use strict";
(() => {
  // src/runtime/params.ts
  function createParamManager(onSchema) {
    let currentSchema = null;
    let currentValues = {};
    let proxy = {};
    function register(schema) {
      currentSchema = schema;
      currentValues = {};
      for (const key in schema) {
        currentValues[key] = schema[key].default;
      }
      proxy = new Proxy(currentValues, {
        get(target, prop) {
          return target[prop];
        },
        set() {
          return false;
        }
      });
      onSchema(schema);
      return proxy;
    }
    function update(values) {
      if (!currentSchema) return;
      for (const key in values) {
        if (key in currentSchema) {
          currentValues[key] = values[key];
        }
      }
    }
    function getValues() {
      return { ...currentValues };
    }
    function getSchema() {
      return currentSchema;
    }
    return { register, update, getValues, getSchema };
  }

  // src/runtime/executor.ts
  function wrapSketchCode(code) {
    return code;
  }
  function evaluateCode(code) {
    try {
      const script = document.createElement("script");
      script.textContent = wrapSketchCode(code);
      document.head.appendChild(script);
      document.head.removeChild(script);
      return null;
    } catch (err) {
      return err instanceof Error ? err : new Error(String(err));
    }
  }

  // src/runtime/index.ts
  var p5Instance = null;
  var paramManager = createParamManager(handleSchema);
  window.ergon = {
    params: (schema) => {
      return paramManager.register(schema);
    }
  };
  function handleSchema(schema) {
    const msg = { type: "ergon:schema", schema };
    window.parent.postMessage(msg, "*");
  }
  function sendReady() {
    const msg = { type: "ergon:ready" };
    window.parent.postMessage(msg, "*");
  }
  function sendError(message) {
    const msg = { type: "ergon:error", message };
    window.parent.postMessage(msg, "*");
  }
  function handleLoad(code, initialParams) {
    if (p5Instance && typeof p5Instance.remove === "function") {
      p5Instance.remove();
      p5Instance = null;
    }
    delete window.setup;
    delete window.draw;
    const error = evaluateCode(code);
    if (error) {
      sendError(error.message);
      return;
    }
    if (initialParams && Object.keys(initialParams).length > 0) {
      paramManager.update(initialParams);
    }
    const p5Constructor = window.p5;
    if (typeof p5Constructor === "function") {
      p5Instance = new p5Constructor();
    }
    sendReady();
  }
  function handleParams(values) {
    paramManager.update(values);
  }
  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || typeof msg.type !== "string") return;
    switch (msg.type) {
      case "ergon:load":
        handleLoad(msg.code, msg.params);
        break;
      case "ergon:params":
        handleParams(msg.values);
        break;
    }
  });
  window.parent.postMessage({ type: "ergon:runtime-ready" }, "*");
})();
