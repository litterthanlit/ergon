export function extractParamsCall(code: string): boolean {
  return /ergon\.params\s*\(/.test(code);
}

export function wrapSketchCode(code: string): string {
  return code;
}

export function evaluateCode(code: string): Error | null {
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
