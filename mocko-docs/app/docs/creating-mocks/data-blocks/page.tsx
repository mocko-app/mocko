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
  title: "Data Blocks",
  description:
    "Use Mocko data blocks to share fixture data across file mocks and render list/detail responses.",
};

export default function DataBlocksPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>Data Blocks</DocsTitle>
      <DocsLead>
        Data blocks define shared fixture data that any file mock can read from
        its response template.
      </DocsLead>

      <DocsH2>Flat values</DocsH2>
      <DocsCodeBlock>{`data "settings" {
  version = "v2"
}

mock "GET /info" {
  body = "{ \\"version\\": \\"{{data.settings.version}}\\" }"
}`}</DocsCodeBlock>

      <DocsH2>Repeated blocks are arrays</DocsH2>
      <DocsCodeBlock>{`data "products" {
  product { id = 1 name = "Widget" }
  product { id = 2 name = "Gadget" }
}

mock "GET /products" {
  body = <<-EOF
    [
      {{#forEach data.products.product}}
        { "id": {{item.id}}, "name": "{{item.name}}" }{{^isLast}},{{/isLast}}
      {{/forEach}}
    ]
  EOF
}`}</DocsCodeBlock>

      <Callout variant="warning">
        Named sub-blocks are arrays even when there is only one. Use{" "}
        <DocsCode>forEach</DocsCode>, <DocsCode>itemAt</DocsCode>, or{" "}
        <DocsCode>pick</DocsCode> instead of treating them like a single object.
      </Callout>

      <DocsH2>Merged across files</DocsH2>
      <DocsP>
        Data blocks from all loaded mock files are merged, so shared fixtures
        can live beside route files or in a dedicated folder.
      </DocsP>
      <DocsP>
        See{" "}
        <Link
          href="/docs/creating-mocks/recipes"
          className="underline underline-offset-4 hover:text-foreground"
        >
          List and Detail From Data
        </Link>{" "}
        for a complete list/detail example.
      </DocsP>
    </DocsPage>
  );
}
