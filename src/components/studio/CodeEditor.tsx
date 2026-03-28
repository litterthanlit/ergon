"use client";

import { useRef, useEffect, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";

const darkTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    backgroundColor: "#0a0a0a",
  },
  ".cm-content": {
    fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace",
    caretColor: "#fff",
    padding: "16px 0",
  },
  ".cm-gutters": {
    backgroundColor: "#0a0a0a",
    color: "#333",
    border: "none",
    paddingLeft: "8px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "#555",
  },
  ".cm-activeLine": {
    backgroundColor: "#ffffff08",
  },
  ".cm-selectionBackground": {
    backgroundColor: "#ffffff15 !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "#ffffff20 !important",
  },
  ".cm-cursor": {
    borderLeftColor: "#fff",
  },
  ".cm-matchingBracket": {
    backgroundColor: "#ffffff15",
    outline: "1px solid #ffffff30",
  },
  ".cm-line": {
    padding: "0 16px",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
}, { dark: true });

const syntaxColors = EditorView.theme({
  ".cm-keyword": { color: "#c4362c" },
  ".cm-string": { color: "#98c379" },
  ".cm-number": { color: "#d19a66" },
  ".cm-comment": { color: "#555" },
  ".cm-variableName": { color: "#e5e5e5" },
  ".cm-propertyName": { color: "#e5c07b" },
  ".cm-operator": { color: "#888" },
  ".cm-punctuation": { color: "#666" },
  ".cm-typeName": { color: "#61afef" },
  ".cm-function": { color: "#61afef" },
  ".cm-bool": { color: "#d19a66" },
}, { dark: true });

type Props = {
  code: string;
  onChange: (code: string) => void;
};

export function CodeEditor({ code, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isExternalUpdate = useRef(false);

  const createEditor = useCallback(() => {
    if (!containerRef.current) return;
    viewRef.current?.destroy();

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isExternalUpdate.current) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: code,
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
        darkTheme,
        syntaxColors,
        updateListener,
        EditorView.lineWrapping,
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

  return (
    <div
      ref={containerRef}
      data-testid="code-editor"
      className="h-full w-full overflow-hidden"
    />
  );
}
