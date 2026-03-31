import type { ParamValues } from "./types";

export type History = {
  current: () => ParamValues;
  push: (values: ParamValues) => void;
  undo: () => ParamValues | null;
  redo: () => ParamValues | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reset: (values: ParamValues) => void;
};

export function createHistory(initial: ParamValues, maxSize = 50): History {
  let entries: ParamValues[] = [initial];
  let pointer = 0;

  return {
    current() {
      return entries[pointer];
    },

    push(values: ParamValues) {
      entries = entries.slice(0, pointer + 1);
      entries.push(values);
      if (entries.length > maxSize) {
        entries = entries.slice(entries.length - maxSize);
      }
      pointer = entries.length - 1;
    },

    undo() {
      if (pointer <= 0) return null;
      pointer--;
      return entries[pointer];
    },

    redo() {
      if (pointer >= entries.length - 1) return null;
      pointer++;
      return entries[pointer];
    },

    canUndo() {
      return pointer > 0;
    },

    canRedo() {
      return pointer < entries.length - 1;
    },

    reset(values: ParamValues) {
      entries = [values];
      pointer = 0;
    },
  };
}
