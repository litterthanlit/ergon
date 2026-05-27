import type { TextureCommandId, TexturePatch, TextureRecipeId } from "./texture-patch";
import type { ParamValue } from "./types";

export type TexturePatchCommandType =
  | "node:add"
  | "node:delete"
  | "node:duplicate"
  | "node:position"
  | "node:bypass"
  | "node:lock"
  | "param:update"
  | "edge:connect"
  | "edge:disconnect"
  | "recipe:load"
  | "recipe:command"
  | "renderer:set"
  | "quality:set"
  | "layout:auto";

export type TexturePatchCommandRecord = {
  type: TexturePatchCommandType;
  label: string;
  nodeId?: string;
  edgeId?: string;
  recipeId?: TextureRecipeId;
  commandId?: TextureCommandId;
  paramKey?: string;
  from?: ParamValue;
  to?: ParamValue;
};

export type TexturePatchHistoryEntry = {
  patch: TexturePatch;
  command: TexturePatchCommandRecord;
  revision: number;
};

export type TexturePatchHistory = {
  undoStack: TexturePatchHistoryEntry[];
  redoStack: TexturePatchHistoryEntry[];
  revision: number;
  savedRevision: number;
  dirty: boolean;
  lastCommand: TexturePatchCommandRecord | null;
};

export type TexturePatchHistorySnapshot = {
  patch: TexturePatch;
  history: TexturePatchHistory;
};

const defaultMaxHistory = 80;

export function createTexturePatchHistory(): TexturePatchHistory {
  return {
    undoStack: [],
    redoStack: [],
    revision: 0,
    savedRevision: 0,
    dirty: false,
    lastCommand: null,
  };
}

function withDirty(history: TexturePatchHistory): TexturePatchHistory {
  return {
    ...history,
    dirty: history.revision !== history.savedRevision,
  };
}

export function commitTexturePatchCommand(
  snapshot: TexturePatchHistorySnapshot,
  nextPatch: TexturePatch,
  command: TexturePatchCommandRecord,
  maxHistory = defaultMaxHistory
): TexturePatchHistorySnapshot {
  const nextRevision = snapshot.history.revision + 1;
  const undoStack = [
    ...snapshot.history.undoStack,
    {
      patch: snapshot.patch,
      command,
      revision: snapshot.history.revision,
    },
  ].slice(-maxHistory);

  return {
    patch: nextPatch,
    history: withDirty({
      ...snapshot.history,
      undoStack,
      redoStack: [],
      revision: nextRevision,
      lastCommand: command,
    }),
  };
}

export function undoTexturePatchCommand(snapshot: TexturePatchHistorySnapshot): TexturePatchHistorySnapshot {
  const entry = snapshot.history.undoStack.at(-1);
  if (!entry) return snapshot;

  return {
    patch: entry.patch,
    history: withDirty({
      ...snapshot.history,
      undoStack: snapshot.history.undoStack.slice(0, -1),
      redoStack: [
        ...snapshot.history.redoStack,
        {
          patch: snapshot.patch,
          command: entry.command,
          revision: snapshot.history.revision,
        },
      ],
      revision: entry.revision,
      lastCommand: entry.command,
    }),
  };
}

export function redoTexturePatchCommand(snapshot: TexturePatchHistorySnapshot): TexturePatchHistorySnapshot {
  const entry = snapshot.history.redoStack.at(-1);
  if (!entry) return snapshot;

  return {
    patch: entry.patch,
    history: withDirty({
      ...snapshot.history,
      undoStack: [
        ...snapshot.history.undoStack,
        {
          patch: snapshot.patch,
          command: entry.command,
          revision: snapshot.history.revision,
        },
      ],
      redoStack: snapshot.history.redoStack.slice(0, -1),
      revision: entry.revision,
      lastCommand: entry.command,
    }),
  };
}

export function markTexturePatchSaved(snapshot: TexturePatchHistorySnapshot): TexturePatchHistorySnapshot {
  return {
    patch: snapshot.patch,
    history: {
      ...snapshot.history,
      savedRevision: snapshot.history.revision,
      dirty: false,
    },
  };
}
