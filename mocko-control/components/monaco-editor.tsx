"use client";

import dynamic from "next/dynamic";
import type { EditorProps } from "@monaco-editor/react";

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
  scrollbar: { vertical: "auto", horizontal: "auto" },
  wordWrap: "on",
  padding: { top: 8, bottom: 8 },
};

type BodyEditorProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  language?: string;
};

export function BodyEditor({
  value,
  onChange,
  readOnly = false,
  language = "json",
}: BodyEditorProps) {
  return (
    <div className="h-48 w-full min-w-0 overflow-hidden rounded-lg border border-border">
      <MonacoEditor
        height="100%"
        width="100%"
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={{ ...EDITOR_OPTIONS, readOnly }}
      />
    </div>
  );
}
