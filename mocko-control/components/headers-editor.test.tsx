import { useState } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeadersEditor } from "@/components/headers-editor";
import { renderWithProviders } from "@/test/render";

type Header = { key: string; value: string };

function Harness({
  initial = [],
  lockedHeaders,
}: {
  initial?: Header[];
  lockedHeaders?: Header[];
}) {
  const [headers, setHeaders] = useState<Header[]>(initial);
  return (
    <HeadersEditor
      headers={headers}
      onChange={setHeaders}
      lockedHeaders={lockedHeaders}
    />
  );
}

describe("HeadersEditor", () => {
  it("warns when two header names collide case-insensitively", () => {
    renderWithProviders(
      <Harness
        initial={[
          { key: "X-Token", value: "a" },
          { key: "x-token", value: "b" },
        ]}
      />,
    );

    expect(screen.getAllByText("Duplicate header name.")).toHaveLength(2);
  });

  it("does not warn when header names are unique", () => {
    renderWithProviders(
      <Harness
        initial={[
          { key: "X-One", value: "a" },
          { key: "X-Two", value: "b" },
        ]}
      />,
    );

    expect(
      screen.queryByText("Duplicate header name."),
    ).not.toBeInTheDocument();
  });

  it("ignores empty rows when detecting duplicates", () => {
    renderWithProviders(
      <Harness
        initial={[
          { key: "", value: "" },
          { key: "", value: "" },
        ]}
      />,
    );

    expect(
      screen.queryByText("Duplicate header name."),
    ).not.toBeInTheDocument();
  });

  it("warns when a header name contains invalid characters", () => {
    renderWithProviders(
      <Harness initial={[{ key: "Bad Header", value: "a" }]} />,
    );

    expect(
      screen.getByText(/Header names may only contain/),
    ).toBeInTheDocument();
  });

  it("accepts valid RFC token characters", () => {
    renderWithProviders(
      <Harness initial={[{ key: "X-Custom_Header.1", value: "a" }]} />,
    );

    expect(
      screen.queryByText(/Header names may only contain/),
    ).not.toBeInTheDocument();
  });

  it("shows the content-type conflict instead of a duplicate warning", () => {
    renderWithProviders(
      <Harness
        initial={[{ key: "Content-Type", value: "text/plain" }]}
        lockedHeaders={[{ key: "Content-Type", value: "application/json" }]}
      />,
    );

    expect(
      screen.getByText(
        "Content-Type is already set by the selected body format.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Duplicate header name."),
    ).not.toBeInTheDocument();
  });
});
