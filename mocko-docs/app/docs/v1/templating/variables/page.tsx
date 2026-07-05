import type { Metadata } from "next";
import Link from "next/link";
import { LegacyBanner } from "@/components/docs/legacy-banner";
import {
  DocsCode,
  DocsCodeBlock,
  DocsH2,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = { title: "Variables (v1)" };

export default function V1VariablesPage() {
  return (
    <DocsPage>
      <LegacyBanner v2href="/docs/reference/helpers" />
      <DocsTitle>Variables</DocsTitle>
      <DocsP>
        Variables let you store a value within a single request and reuse it
        later in the same template. Unlike{" "}
        <Link
          href="/docs/v1/templating/persistence"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Flags
        </Link>
        , variables are not persisted; they exist only for the duration of the
        current request.
      </DocsP>

      <DocsH2>set and get</DocsH2>
      <DocsP>
        Use <DocsCode>set</DocsCode> to store a value under a name, and{" "}
        <DocsCode>get</DocsCode> to retrieve it:
      </DocsP>
      <DocsCodeBlock>{`{{set 'id' (uuid)}}
{
  "id": "{{get 'id'}}",
  "link": "/users/{{get 'id'}}"
}`}</DocsCodeBlock>
      <DocsP>
        This computes the UUID once and reuses the same value in multiple
        places, so both <DocsCode>id</DocsCode> and <DocsCode>link</DocsCode>{" "}
        always reference the same generated ID.
      </DocsP>

      <DocsH2>Common use case with flags</DocsH2>
      <DocsP>
        Variables are most useful when combined with flag helpers. Generate a
        UUID for a new resource, persist the resource data in flags, and return
        the ID in the response:
      </DocsP>
      <DocsCodeBlock>{`mock "POST /items" {
  headers {
    Content-Type = "application/json"
  }
  body = <<EOF
    {{set 'id' (uuid)}}
    {{setFlag (append 'items:' (get 'id') ':name') request.body.name}}
    {
      "id": "{{get 'id'}}"
    }
  EOF
}`}</DocsCodeBlock>
    </DocsPage>
  );
}
