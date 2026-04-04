"use client";

import { useState } from "react";
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

type BodyLanguage = "json" | "hbs" | "plaintext" | "xml" | "html";

const LANGUAGE_LABELS: Record<BodyLanguage, string> = {
  json: "JSON",
  hbs: "Bigodon",
  plaintext: "Plain text",
  xml: "XML",
  html: "HTML",
};

const MONACO_LANGUAGE: Record<BodyLanguage, string> = {
  json: "json",
  hbs: "handlebars",
  plaintext: "plaintext",
  xml: "xml",
  html: "html",
};

const EDITOR_OPTIONS: EditorProps["options"] = {
  accessibilitySupport: "on",
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
};

export function BodyEditor({
  value,
  onChange,
  readOnly = false,
}: BodyEditorProps) {
  const [language, setLanguage] = useState<BodyLanguage>("json");

  return (
    <div className="flex flex-col gap-1">
      {/*
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Body language"
      >
        {(Object.keys(LANGUAGE_LABELS) as BodyLanguage[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            aria-pressed={lang === language}
            className="px-2 py-0.5 rounded text-xs transition-colors hover:bg-muted aria-pressed:bg-primary/20 aria-pressed:text-primary text-muted-foreground"
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>
      */}
      <div className="h-48 rounded-lg overflow-hidden border border-border">
        <MonacoEditor
          height="100%"
          language={MONACO_LANGUAGE[language]}
          theme="vs-dark"
          value={value}
          onChange={(v) => onChange(v ?? "")}
          options={{ ...EDITOR_OPTIONS, readOnly }}
        />
      </div>
    </div>
  );
}
