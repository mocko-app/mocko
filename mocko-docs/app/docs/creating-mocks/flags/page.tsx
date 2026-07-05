import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/docs/callout";
import {
  DocsCode,
  DocsCodeBlock,
  DocsEyebrow,
  DocsH2,
  DocsLead,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Flags",
  description:
    "Use Mocko flags to persist state across requests and simulate stateful API behavior.",
};

export default function FlagsPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>Flags</DocsTitle>
      <DocsLead>
        Flags are Mocko key-value state. Use them when a mock needs to remember
        something between requests.
      </DocsLead>

      <DocsH2>Set and read state</DocsH2>
      <DocsCodeBlock>{`mock "PUT /users/{id}" {
  body = <<-EOF
    {{= $nameKey (append 'users:' request.params.id ':name')}}
    {{setFlag $nameKey request.body.name}}
    { "saved": true }
  EOF
}

mock "GET /users/{id}" {
  body = <<-EOF
    {{= $nameKey (append 'users:' request.params.id ':name')}}
    {
      "id": {{request.params.id}},
      "name": "{{default (getFlag $nameKey) 'John Doe'}}"
    }
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Available helpers</DocsH2>
      <ul className="mb-4 space-y-1.5 text-[14px] leading-7 text-fg-2">
        <li>
          <DocsCode>setFlag &apos;key&apos; value [ttlMs]</DocsCode> writes a
          value.
        </li>
        <li>
          <DocsCode>getFlag &apos;key&apos;</DocsCode> reads a value.
        </li>
        <li>
          <DocsCode>hasFlag &apos;key&apos;</DocsCode> checks whether a value
          exists.
        </li>
        <li>
          <DocsCode>delFlag &apos;key&apos;</DocsCode> deletes a value.
        </li>
      </ul>

      <DocsH2>Flag keys in the UI</DocsH2>
      <DocsP>
        Keys with <DocsCode>:</DocsCode> separators appear as nested folders in
        the UI.
      </DocsP>
      <DocsCodeBlock>{`users:42:name
users:42:email`}</DocsCodeBlock>

      <Callout variant="info">
        In storeless mode, flags are in memory. Run Mocko with Redis when flags
        should persist across restarts or be shared by multiple replicas.
      </Callout>

      <DocsH2>Use variables for request-local work</DocsH2>
      <DocsP>
        Flags persist across requests. For temporary values during one render,
        use Bigodon variables such as{" "}
        <DocsCode>{"{{= $found false}}"}</DocsCode>.
      </DocsP>
      <DocsP>
        See{" "}
        <Link
          href="/docs/creating-mocks/recipes"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Stateful CRUD
        </Link>{" "}
        for a larger stateful example.
      </DocsP>
    </DocsPage>
  );
}
