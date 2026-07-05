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
import { DocsSnippet } from "@/components/docs/snippet";

export const metadata: Metadata = {
  title: "UI Mocks",
  description:
    "Create and edit Mocko mocks in the control panel: the mock form, labels and filtering, how UI mocks relate to file mocks, and persistence.",
};

export default function UiMocksPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>UI Mocks</DocsTitle>
      <DocsLead>
        The control panel is the fastest way to create a mock while exploring an
        API shape, reproducing a bug, or trying an edge case. This page covers
        the mock form, how mocks created in the UI relate to file mocks, and
        what happens to them when Mocko restarts.
      </DocsLead>

      <DocsH2>Open the control panel</DocsH2>
      <DocsP>The UI is enabled by default when you start Mocko:</DocsP>
      <DocsSnippet command="mocko mocks" className="mb-4" />
      <DocsP>
        Mocks are served on <DocsCode>http://localhost:8080</DocsCode> and the
        panel opens on <DocsCode>http://localhost:6625</DocsCode>. The folder
        argument is optional; without it Mocko starts with no file mocks loaded,
        which is fine for UI-only sessions. Use <DocsCode>--no-ui</DocsCode> to
        disable the panel or <DocsCode>-P</DocsCode> to move it to another port.
      </DocsP>

      <DocsH2>Create a mock</DocsH2>
      <DocsP>
        Click <strong className="text-foreground">New mock</strong>, choose a
        method, and enter a path. Paths use the same syntax as file mocks, so{" "}
        <DocsCode>{"/users/{id}"}</DocsCode> declares a path parameter you can
        use in the body. Pick a content type, write the response body, and save.
        The mock starts responding immediately.
      </DocsP>
      <ScreenshotPlaceholder label="Mocko UI mock form" />
      <DocsP>
        The body is a template with the same power as file mock bodies:
        everything on the{" "}
        <DocsLink href="/creating-mocks/templating">Templating</DocsLink> page
        works identically here. Under advanced options you can also set a status
        code, response headers, a delay, labels, and a host.
      </DocsP>
      <Callout variant="info">
        Saving an existing mock applies the change to live traffic right away.
        There is no separate deploy step: the panel edits the running instance.
      </Callout>

      <DocsH2>Working with many mocks</DocsH2>
      <DocsP>
        The mock list supports search and label filters, and the filters stay
        applied while you navigate into a mock and back. From the list you can
        also enable, disable, duplicate, and delete mocks. Duplicating is the
        quickest way to create a variation of an existing response, such as an
        error case for a route you already mock.
      </DocsP>
      <ScreenshotPlaceholder label="Mock list with search and label filters" />
      <DocsP>
        If a mock&apos;s template fails to render for a request, the panel shows
        the failure on the mock, so you do not need to tail the server logs to
        notice a broken template.
      </DocsP>

      <DocsH2>UI mocks and file mocks together</DocsH2>
      <DocsP>
        Mocks created in the panel are called deployed mocks, as opposed to file
        mocks loaded from <DocsCode>.hcl</DocsCode> files. Both kinds appear in
        the list, but file mocks are read-only in the UI: their source of truth
        is the file, and editing them there would be lost on the next reload. To
        change a file mock from the panel, duplicate it and edit the copy.
      </DocsP>
      <DocsP>
        When a deployed mock and a file mock declare the same method and path,
        the deployed mock wins. This makes the UI a temporary override layer on
        top of your committed mocks, which is exactly what you want when
        reproducing a scenario locally. The full precedence rules are on{" "}
        <DocsLink href="/creating-mocks/matching">How Matching Works</DocsLink>.
      </DocsP>

      <DocsH2>Persistence</DocsH2>
      <DocsP>
        By default Mocko runs storeless: deployed mocks live in memory and
        disappear when the process stops. That keeps local sessions disposable.
        When Mocko runs with Redis, deployed mocks, hosts, and flags survive
        restarts, which is how shared instances are usually deployed.
      </DocsP>
      <Callout variant="warning">
        If a mock should outlive your session, move it into a mock file so it is
        versioned and reviewed, or run with Redis if your team manages mocks
        through the UI on a shared instance. See{" "}
        <DocsLink href="/running/persistence">Persistence and Redis</DocsLink>.
      </Callout>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          In storeless mode, deployed mocks are marked as temporary in the list,
          as a reminder that they reset on restart.
        </li>
        <li>
          The panel annotates routing overlaps: a mock that can never be reached
          because another one takes precedence is flagged, so conflicts between
          UI and file mocks are visible instead of silent. The rules behind
          those annotations are explained on{" "}
          <DocsLink href="/creating-mocks/matching">
            How Matching Works
          </DocsLink>
          .
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        Mock bodies so far have been mostly static. Continue to{" "}
        <DocsLink href="/creating-mocks/templating">Templating</DocsLink> to
        make responses react to the request.
      </DocsP>
    </DocsPage>
  );
}
