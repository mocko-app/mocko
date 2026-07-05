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

export const metadata: Metadata = { title: "Helpers (v1)" };

export default function V1HelpersPage() {
  return (
    <DocsPage>
      <LegacyBanner v2href="/docs/reference/helpers" />
      <DocsTitle>Mocko Helpers</DocsTitle>
      <DocsP>
        In addition to{" "}
        <a
          href="https://github.com/helpers/handlebars-helpers"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          handlebars-helpers
        </a>
        , Mocko provides helpers that can modify your response directly.
      </DocsP>

      <DocsH2>setStatus</DocsH2>
      <DocsP>Sets the response status dynamically or conditionally.</DocsP>
      <DocsCodeBlock>{`{{#is request.params.id '1'}}
  { "id": 1, "name": "George" }
{{else is request.params.id '2'}}
  { "id": 2, "name": "Alice" }
{{else}}
  {{setStatus 404}}
  { "error": "Not found error", "message": "Cat not found" }
{{/is}}`}</DocsCodeBlock>

      <DocsH2>setHeader</DocsH2>
      <DocsP>Sets response headers dynamically or conditionally.</DocsP>
      <DocsCodeBlock>{`{{#gt (toInt request.params.id) 10}}
  {{setStatus 303}}
  {{setHeader 'Location' (append '/purchases/' request.params.id)}}
{{else}}
  {
    "id": {{request.params.id}},
    "progress": {{random 0 100}}
  }
{{/gt}}`}</DocsCodeBlock>

      <DocsH2>proxy</DocsH2>
      <DocsP>
        Proxies the request to the real API behind Mocko. Configure the proxy
        URL with <DocsCode>PROXY_BASE-URI</DocsCode> in the env config, or with
        the <DocsCode>--url</DocsCode> / <DocsCode>-u</DocsCode> CLI flag.
      </DocsP>
      <DocsCodeBlock>{`{{#is request.query.userId 1}}
  []
{{else}}
  {{proxy}}
{{/is}}`}</DocsCodeBlock>
      <DocsP>You can also override the proxy URI for a specific mock:</DocsP>
      <DocsCodeBlock>{`{{#is request.params.id '1'}}
  {{proxy 'http://localhost:8082'}}
{{else}}
  {{proxy 'http://localhost:8081'}}
{{/is}}`}</DocsCodeBlock>

      <DocsH2>append</DocsH2>
      <DocsP>Concatenates parameters into a string.</DocsP>
      <DocsCodeBlock>{`{{append 'users:' request.params.id ':name'}}`}</DocsCodeBlock>

      <DocsH2>uuid</DocsH2>
      <DocsP>Generates a UUID v4. No parameters required.</DocsP>

      <DocsH2>substring</DocsH2>
      <DocsP>
        Returns a substring. Same API as{" "}
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substring"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          JavaScript&apos;s substring
        </a>
        .
      </DocsP>
      <DocsCodeBlock>{`{{substring 'Lorem ipsum' 0 4}}
{{! Produces 'Lore' }}`}</DocsCodeBlock>

      <DocsH2>setFlag, getFlag, delFlag, hasFlag</DocsH2>
      <DocsP>
        See{" "}
        <Link
          href="/docs/v1/templating/persistence"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Persistence
        </Link>{" "}
        for documentation.
      </DocsP>

      <DocsH2>get, set</DocsH2>
      <DocsP>
        See{" "}
        <Link
          href="/docs/v1/templating/variables"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Variables
        </Link>{" "}
        for documentation.
      </DocsP>
    </DocsPage>
  );
}
