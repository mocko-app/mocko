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
  title: "UI Mocks",
  description:
    "Create and edit Mocko mocks in the control panel with labels, delays, headers, host scoping, and Redis persistence.",
};

export default function UiMocksPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>UI Mocks</DocsTitle>
      <DocsLead>
        The Mocko UI is the fastest way to create a mock while exploring an API
        shape or testing a scenario locally.
      </DocsLead>

      <DocsH2>Start the control panel</DocsH2>
      <DocsCodeBlock>mocko --ui mocks</DocsCodeBlock>
      <DocsP>
        Mocko serves mocks on <DocsCode>http://localhost:8080</DocsCode> and
        opens the UI on <DocsCode>http://localhost:6625</DocsCode>.
      </DocsP>

      <DocsH2>Create a mock</DocsH2>
      <DocsP>
        Use <strong className="text-foreground">New mock</strong>, choose a
        method, enter a path, pick a content type, and write the response body.
        Advanced options let you add headers, a delay, labels, and a host.
      </DocsP>
      <div className="mb-4 flex items-center justify-center rounded-lg border border-dashed border-border bg-card/40 px-5 py-10 text-[13px] text-muted-foreground">
        Screenshot placeholder: Mocko UI mock form
      </div>

      <DocsH2>Temporary and read-only mocks</DocsH2>
      <DocsP>
        In storeless mode, UI-created mocks are temporary and reset when Mocko
        stops. File mocks appear in the UI as read-only so you can inspect them
        without accidentally changing committed behavior.
      </DocsP>
      <Callout variant="info">
        Run Mocko with Redis when UI-created mocks, hosts, flags, and failure
        information should persist across restarts.
      </Callout>

      <DocsH2>When to use file mocks</DocsH2>
      <DocsP>
        When a mock becomes part of a workflow, move it to a mock file so it can
        be reviewed, versioned, and run consistently in CI or by the rest of the
        team.
      </DocsP>
      <DocsP>
        See{" "}
        <Link
          href="/creating-mocks/file-mocks"
          className="underline underline-offset-4 hover:text-foreground"
        >
          File Mocks
        </Link>{" "}
        for the recommended long-term workflow.
      </DocsP>
    </DocsPage>
  );
}
