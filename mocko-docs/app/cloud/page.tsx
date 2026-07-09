import type { Metadata } from "next";
import { Callout } from "@/components/docs/callout";
import {
  DocsEyebrow,
  DocsH2,
  DocsLead,
  DocsLink,
  DocsP,
  DocsPage,
  DocsTable,
  DocsTbody,
  DocsTd,
  DocsTh,
  DocsThead,
  DocsTitle,
  DocsUl,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Mocko Cloud",
  description:
    "Mocko Cloud is the hosted version of Mocko: a public HTTPS mock server your team can reach without running or deploying anything.",
};

export default function CloudOverviewPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Mocko Cloud</DocsEyebrow>
      <DocsTitle>Overview</DocsTitle>
      <DocsLead>
        Mocko Cloud is the hosted version of Mocko. Instead of running the CLI
        or deploying to your own cluster, you sign in at{" "}
        <DocsLink href="https://app.mocko.dev">app.mocko.dev</DocsLink> and get
        a public HTTPS mock server that your whole team can reach. The mocks,
        templating, and flags all behave the way they do everywhere else. What
        changes is where Mocko runs and what it adds around it.
      </DocsLead>

      <DocsH2>The same core, hosted for you</DocsH2>
      <DocsP>
        A mock in the Cloud is the same kind of mock you would write locally.
        You match on method and path, render the body with the same{" "}
        <DocsLink href="/creating-mocks/templating">templating</DocsLink>{" "}
        language, and drive stateful flows with the same{" "}
        <DocsLink href="/creating-mocks/flags">flags</DocsLink>. If you already
        know how to build mocks in the open source control panel, you already
        know how to build them in the Cloud. Those pages are the reference for
        the mock itself; this section covers only what the hosted platform adds
        on top.
      </DocsP>

      <DocsH2>What the Cloud adds</DocsH2>
      <DocsUl>
        <li>
          <span className="text-foreground">A public URL out of the box.</span>{" "}
          Every project gets its own HTTPS address, so a mock is reachable from
          a teammate&apos;s laptop, a CI job, or a partner&apos;s environment
          with no tunnels or port forwarding to set up.
        </li>
        <li>
          <span className="text-foreground">Nothing to run or maintain.</span>{" "}
          There is no CLI to keep open and no image to deploy. You sign in with
          GitHub and start creating mocks.
        </li>
        <li>
          <span className="text-foreground">Team projects.</span> Invite
          teammates to a project so the same set of mocks is shared, not copied
          between machines.
        </li>
        <li>
          <span className="text-foreground">Request logs.</span> See every
          request that reaches your project, including its headers and body, to
          confirm a client is calling what you expect.
        </li>
        <li>
          <span className="text-foreground">Local Tunnels.</span> Expose a
          service running on your own machine through your Cloud host, with your
          mocks layered on top of it.
        </li>
      </DocsUl>

      <DocsH2>Cloud or open source</DocsH2>
      <DocsP>
        The two are not competing versions of the same thing. They share a core
        and then lean in different directions. Open source is built to run
        inside your own environment; the Cloud is built to remove the running
        entirely.
      </DocsP>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Reach for the Cloud when</DocsTh>
            <DocsTh>Reach for open source when</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              You want a shareable mock URL without standing up any
              infrastructure.
            </DocsTd>
            <DocsTd>
              Mocks must live in your repository as code and be reviewed like
              any other change.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              A whole team should collaborate on one set of mocks from the
              browser.
            </DocsTd>
            <DocsTd>
              Mocko has to run inside your own network, CI, or Kubernetes
              cluster.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              You are demoing, prototyping, or unblocking frontend work quickly.
            </DocsTd>
            <DocsTd>
              You want to drive mocks from tests with the{" "}
              <DocsLink href="/sdk/getting-started">SDK</DocsLink> or manage
              them in bulk as HCL files.
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>
      <Callout variant="tip">
        You do not have to pick one forever. A common path is to prototype in
        the Cloud, then move the mocks that stick into{" "}
        <DocsLink href="/creating-mocks/file-mocks">HCL files</DocsLink> so they
        live with your project.
      </Callout>

      <DocsH2>Next</DocsH2>
      <DocsP>
        Sign in and create your first public mock in{" "}
        <DocsLink href="/cloud/getting-started">Getting Started</DocsLink>. It
        takes about the same time as reading this page. If you would rather run
        Mocko yourself, start with the{" "}
        <DocsLink href="/running/cli">CLI</DocsLink> instead.
      </DocsP>
    </DocsPage>
  );
}
