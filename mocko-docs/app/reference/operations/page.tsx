import type { Metadata } from "next";
import { Callout } from "@/components/docs/callout";
import {
  DocsCode,
  DocsEyebrow,
  DocsH2,
  DocsLead,
  DocsLink,
  DocsP,
  DocsPage,
  DocsTitle,
  DocsUl,
  ScreenshotPlaceholder,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Operations",
  description:
    "Mocko's management operations for flag hygiene at scale: purging stale flags and purging flags matching a prefix, substring, or regex.",
};

export default function ReferenceOperationsPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Reference</DocsEyebrow>
      <DocsTitle>Operations</DocsTitle>
      <DocsLead>
        Long-lived Mocko instances accumulate flags: leftover test state,
        finished scenarios, keys nobody remembers. Operations are supervised
        bulk clean-ups on the control panel&apos;s Management page, built for
        instances with hundreds of thousands of flags.
      </DocsLead>

      <DocsH2>How operations run</DocsH2>
      <DocsP>
        Every operation is a two-phase, tracked background job, so nothing is
        deleted blind:
      </DocsP>
      <DocsUl>
        <li>
          <strong className="text-foreground">Scan</strong>: the operation
          counts what it would affect and reports back, for example &quot;418
          flags match&quot;.
        </li>
        <li>
          <strong className="text-foreground">Execute</strong>: only after you
          confirm the preview does it modify anything, with progress reported as
          it runs.
        </li>
      </DocsUl>
      <DocsP>
        Finished runs stay in the history on the same page, with their
        parameters and final counts.
      </DocsP>
      <ScreenshotPlaceholder label="Management page with operation history" />
      <Callout variant="warning">
        Operations work directly on the Redis store, so they require{" "}
        <DocsLink href="/running/persistence">Redis mode</DocsLink>. On a
        storeless instance the Management page reports that operations are not
        available (there is also nothing to clean: storeless state resets on
        restart).
      </Callout>

      <DocsH2>Stale flags</DocsH2>
      <DocsP>
        Purges flags that have not been written for longer than a threshold, in
        seconds. This is the periodic hygiene operation: flags your mocks and
        tests still touch survive, abandoned ones go.
      </DocsP>
      <DocsUl>
        <li>
          Threshold in seconds, minimum 1. For &quot;not touched in 30
          days&quot;, that is <DocsCode>2592000</DocsCode>.
        </li>
        <li>
          The scan reports how many flags were checked and how many are stale
          before you commit to the purge.
        </li>
      </DocsUl>

      <DocsH2>Matching flags</DocsH2>
      <DocsP>
        Purges flags whose keys match a pattern, in one of three modes:
      </DocsP>
      <DocsUl>
        <li>
          <DocsCode>PREFIX</DocsCode>: keys starting with the pattern, e.g.{" "}
          <DocsCode>users:</DocsCode> removes the whole users folder.
        </li>
        <li>
          <DocsCode>CONTAINS</DocsCode>: keys containing the pattern anywhere.
        </li>
        <li>
          <DocsCode>REGEX</DocsCode>: keys matching a regular expression,
          validated before the scan starts.
        </li>
      </DocsUl>
      <DocsP>
        Typical uses: clearing one scenario&apos;s namespace after a test
        campaign, or removing keys from a retired mock without touching the
        rest.
      </DocsP>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          Scans and purges run in the background on the control panel; you can
          leave the page and the run continues, with status visible when you
          return.
        </li>
        <li>
          Deletions are permanent. The scan preview is the safety net, so read
          the counts before executing, especially with{" "}
          <DocsCode>CONTAINS</DocsCode>.
        </li>
        <li>
          Two more operation types exist for upgrading from Mocko v1; they are
          gated behind their own setting and documented in{" "}
          <DocsLink href="/reference/v1-migration">Migrating from v1</DocsLink>.
        </li>
      </DocsUl>
    </DocsPage>
  );
}
