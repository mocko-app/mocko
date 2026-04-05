"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import type { EditorProps } from "@monaco-editor/react";
import type { ParsingError } from "@/lib/types/error-dtos";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted/30 rounded-lg border border-border text-muted-foreground text-sm">
      Loading editor…
    </div>
  ),
});

const EDITOR_OPTIONS: EditorProps["options"] = {
  accessibilitySupport: "on",
  automaticLayout: true,
  detectIndentation: false,
  insertSpaces: true,
  tabSize: 2,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 13,
  lineNumbers: "on",
  renderLineHighlight: "none",
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical: "auto",
    horizontal: "auto",
    alwaysConsumeMouseWheel: false,
  },
  wordWrap: "on",
  padding: { top: 8, bottom: 8 },
};

type BodyEditorProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  language?: string;
  parsingError?: ParsingError | null;
};

type FlagEditorProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function BodyEditor({
  value,
  onChange,
  readOnly = false,
  language = "json",
  parsingError = null,
}: BodyEditorProps) {
  const resolvedLanguage = value.includes("{{") ? "handlebars" : language;
  const editorRef = useRef<
    Parameters<NonNullable<EditorProps["onMount"]>>[0] | null
  >(null);
  const monacoRef = useRef<
    Parameters<NonNullable<EditorProps["onMount"]>>[1] | null
  >(null);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model) {
      return;
    }

    const markers =
      parsingError?.line && parsingError?.column
        ? [
            {
              startLineNumber: parsingError.line,
              startColumn: parsingError.column,
              endLineNumber: parsingError.line,
              endColumn: parsingError.column + 1,
              message: parsingError.message,
              severity: monaco.MarkerSeverity.Error,
            },
          ]
        : [];

    monaco.editor.setModelMarkers(model, "mocko-control-template", markers);
  }, [parsingError, value]);

  return (
    <div className="h-48 w-full min-w-0 overflow-hidden rounded-lg border border-border">
      <MonacoEditor
        height="100%"
        width="100%"
        language={resolvedLanguage}
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;
        }}
        options={{ ...EDITOR_OPTIONS, readOnly }}
      />
    </div>
  );
}

export function FlagEditor({
  value,
  onChange,
  readOnly = false,
}: FlagEditorProps) {
  return (
    <div className="h-96 w-full min-w-0 overflow-hidden rounded-lg border border-border">
      <MonacoEditor
        height="100%"
        width="100%"
        language="json"
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={{ ...EDITOR_OPTIONS, readOnly }}
      />
    </div>
  );
}
