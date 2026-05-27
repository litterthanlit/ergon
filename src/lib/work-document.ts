import type { TexturePatch } from "./texture-patch";
import type { ParamSchema, ParamValues } from "./types";

export type WorkEngine = "texture-patch" | "p5-sketch";

export type AssetRef = {
  url: string;
  bucket?: string;
  path?: string;
  width?: number;
  height?: number;
  mimeType?: string;
};

export type SeedConfig = {
  seed?: number;
  [key: string]: unknown;
};

export type ExposedControl = {
  id: string;
  label: string;
  kind: "slider" | "color" | "toggle" | "xy" | "choice";
  target: Array<{ nodeId: string; param: string; map?: string }>;
  defaultValue: unknown;
  min?: number;
  max?: number;
};

export type TexturePatchWorkDocument = {
  engine: "texture-patch";
  version: 1;
  patch: TexturePatch;
  exposedControls: ExposedControl[];
  seeds: SeedConfig;
  thumbnail?: AssetRef;
};

export type P5SketchWorkDocument = {
  engine: "p5-sketch";
  version: 1;
  code: string;
  templateId: string | null;
  params: Record<string, unknown> | null;
  paramsSchema?: ParamSchema | null;
  thumbnail?: AssetRef;
};

export type WorkDocument = TexturePatchWorkDocument | P5SketchWorkDocument;

export type WorkDocumentRow = {
  code?: string | null;
  template_id?: string | null;
  params?: Record<string, unknown> | null;
  engine?: WorkEngine | string | null;
  document_version?: number | null;
  document?: unknown;
  thumbnail_url?: string | null;
};

export type WorkLegacyFields = {
  code: string;
  templateId: string | null;
  params: Record<string, unknown> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTexturePatch(value: unknown): value is TexturePatch {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.nodes) &&
    Array.isArray(value.edges) &&
    Array.isArray(value.resolution)
  );
}

function asParams(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function thumbnailFromUrl(url: string | null | undefined): AssetRef | undefined {
  return url ? { url } : undefined;
}

function normalizeStoredDocument(document: unknown, thumbnailUrl?: string | null): WorkDocument | null {
  const parsed = typeof document === "string" ? safeJsonParse(document) : document;
  if (!isRecord(parsed)) return null;

  if (parsed.engine === "texture-patch" && parsed.version === 1 && isTexturePatch(parsed.patch)) {
    return {
      engine: "texture-patch",
      version: 1,
      patch: parsed.patch,
      exposedControls: Array.isArray(parsed.exposedControls) ? (parsed.exposedControls as ExposedControl[]) : [],
      seeds: isRecord(parsed.seeds) ? parsed.seeds : {},
      thumbnail: isRecord(parsed.thumbnail) ? (parsed.thumbnail as AssetRef) : thumbnailFromUrl(thumbnailUrl),
    };
  }

  if (parsed.engine === "p5-sketch" && parsed.version === 1) {
    return {
      engine: "p5-sketch",
      version: 1,
      code: typeof parsed.code === "string" ? parsed.code : "",
      templateId: typeof parsed.templateId === "string" ? parsed.templateId : null,
      params: asParams(parsed.params),
      paramsSchema: isRecord(parsed.paramsSchema) ? (parsed.paramsSchema as ParamSchema) : null,
      thumbnail: isRecord(parsed.thumbnail) ? (parsed.thumbnail as AssetRef) : thumbnailFromUrl(thumbnailUrl),
    };
  }

  return null;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function legacyTexturePatch(row: WorkDocumentRow): TexturePatch | null {
  if (isTexturePatch(row.params?.patch)) return row.params.patch;
  const parsed = typeof row.code === "string" ? safeJsonParse(row.code) : null;
  return isTexturePatch(parsed) ? parsed : null;
}

export function parseWorkDocument(row: WorkDocumentRow): WorkDocument {
  const stored = normalizeStoredDocument(row.document, row.thumbnail_url);
  if (stored) return stored;

  if (row.engine === "texture-patch" || row.template_id === "texture-patch") {
    const patch = legacyTexturePatch(row);
    if (patch) {
      return {
        engine: "texture-patch",
        version: 1,
        patch,
        exposedControls: [],
        seeds: {},
        thumbnail: thumbnailFromUrl(row.thumbnail_url),
      };
    }
  }

  return {
    engine: "p5-sketch",
    version: 1,
    code: row.code ?? "",
    templateId: row.template_id ?? null,
    params: row.params ?? null,
    thumbnail: thumbnailFromUrl(row.thumbnail_url),
  };
}

export function legacyFieldsFromWorkDocument(document: WorkDocument): WorkLegacyFields {
  if (document.engine === "texture-patch") {
    return {
      code: JSON.stringify(document.patch),
      templateId: "texture-patch",
      params: {
        patch: document.patch,
        exposedControls: document.exposedControls,
        seeds: document.seeds,
      },
    };
  }

  return {
    code: document.code,
    templateId: document.templateId,
    params: document.params as ParamValues | null,
  };
}
