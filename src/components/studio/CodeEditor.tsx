"use client";

import { useRef, useEffect, useCallback } from "react";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, Decoration, type DecorationSet } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "12.5px",
    backgroundColor: "#0c0c0c",
  },
  ".cm-content": {
    fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
    caretColor: "#fff",
    padding: "16px 0",
    lineHeight: "1.7",
  },
  ".cm-gutters": {
    backgroundColor: "#0c0c0c",
    color: "#2a2a2a",
    border: "none",
    paddingLeft: "12px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "#444",
  },
  ".cm-activeLine": {
    backgroundColor: "#ffffff06",
  },
  ".cm-selectionBackground": {
    backgroundColor: "#ffffff12 !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "#ffffff18 !important",
  },
  ".cm-cursor": {
    borderLeftColor: "#fff",
    borderLeftWidth: "1.5px",
  },
  ".cm-matchingBracket": {
    backgroundColor: "#ffffff10",
    outline: "1px solid #ffffff25",
  },
  ".cm-line": {
    padding: "0 20px",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  ".cm-errorLine": {
    backgroundColor: "#c4362c12",
    borderLeft: "2px solid #c4362c",
  },
}, { dark: true });

const syntaxColors = EditorView.theme({
  ".cm-keyword": { color: "#c4362c" },
  ".cm-string": { color: "#7dae6b" },
  ".cm-number": { color: "#c89350" },
  ".cm-comment": { color: "#3a3a3a", fontStyle: "italic" },
  ".cm-variableName": { color: "#c8c8c8" },
  ".cm-propertyName": { color: "#c89350" },
  ".cm-operator": { color: "#6a6a6a" },
  ".cm-punctuation": { color: "#4a4a4a" },
  ".cm-typeName": { color: "#6a9fc8" },
  ".cm-function": { color: "#d4d4d4" },
  ".cm-bool": { color: "#c89350" },
}, { dark: true });

const setErrorLine = StateEffect.define<number | null>();

const errorLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setErrorLine)) {
        if (effect.value === null) return Decoration.none;
        const lineNum = Math.min(effect.value, tr.state.doc.lines);
        const line = tr.state.doc.line(lineNum);
        const deco = Decoration.line({ class: "cm-errorLine" }).range(line.from);
        return Decoration.set([deco]);
      }
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

type Props = {
  code: string;
  onChange: (code: string) => void;
  errorLine?: number | null;
};

export function CodeEditor({ code, onChange, errorLine }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const initialCodeRef = useRef(code);
  const isExternalUpdate = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const createEditor = useCallback(() => {
    if (!containerRef.current) return;
    viewRef.current?.destroy();

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isExternalUpdate.current) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: initialCodeRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        autocompletion(),
        highlightSelectionMatches(),
        javascript(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          ...searchKeymap,
        ]),
        editorTheme,
        syntaxColors,
        updateListener,
        EditorView.lineWrapping,
        errorLineField,
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });
  }, []);

  useEffect(() => {
    createEditor();
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [createEditor]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentContent = view.state.doc.toString();
    if (currentContent !== code) {
      isExternalUpdate.current = true;
      view.dispatch({
        changes: { from: 0, to: currentContent.length, insert: code },
      });
      isExternalUpdate.current = false;
    }
  }, [code]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setErrorLine.of(errorLine ?? null) });
  }, [errorLine]);

  return (
    <div
      ref={containerRef}
      data-testid="code-editor"
      className="h-full w-full overflow-hidden"
    />
  );
}
