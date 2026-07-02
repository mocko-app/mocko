type MonacoStubProps = {
  value?: string;
  onChange?: (value: string | undefined, event: unknown) => void;
  options?: { readOnly?: boolean };
};

// Stands in for @monaco-editor/react in jsdom. Tests interact with it as
// "the code editor" textbox; Monaco behavior itself is out of scope.
export default function MonacoEditorStub({
  value,
  onChange,
  options,
}: MonacoStubProps) {
  return (
    <textarea
      aria-label="Code editor"
      value={value ?? ""}
      readOnly={options?.readOnly ?? false}
      onChange={(event) => onChange?.(event.target.value, undefined)}
    />
  );
}
