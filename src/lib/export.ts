export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportFilename(templateName: string, format: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  return `ergon-${templateName.toLowerCase()}-${timestamp}.${format}`;
}
