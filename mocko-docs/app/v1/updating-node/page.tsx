import type { Metadata } from "next";
import { LegacyBanner } from "@/components/docs/legacy-banner";
import {
  DocsCode,
  DocsCodeBlock,
  DocsH2,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = { title: "Updating Node.js (v1)" };

export default function V1UpdatingNodePage() {
  return (
    <DocsPage>
      <LegacyBanner />
      <DocsTitle>Updating Node.js</DocsTitle>
      <DocsP>
        Mocko requires Node.js 14 or newer. You can update it using the{" "}
        <DocsCode>n</DocsCode> utility.
      </DocsP>

      <DocsH2>Install n</DocsH2>
      <DocsP>
        Install <DocsCode>n</DocsCode> globally with npm. On Linux or Mac you
        may need <DocsCode>sudo</DocsCode>:
      </DocsP>
      <DocsCodeBlock language="bash">sudo npm i -g n</DocsCodeBlock>

      <DocsH2>Update Node</DocsH2>
      <DocsP>
        Use <DocsCode>n</DocsCode> to install the stable release. On Linux or
        Mac you may need <DocsCode>sudo</DocsCode> again:
      </DocsP>
      <DocsCodeBlock language="bash">sudo n stable</DocsCodeBlock>
      <DocsP>Now you are ready to mock.</DocsP>
    </DocsPage>
  );
}
