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
} from "@/components/docs/content";
import { DocsSnippet } from "@/components/docs/snippet";

export const metadata: Metadata = {
  title: "Projects and URLs",
  description:
    "How Mocko Cloud projects map to public HTTPS hosts, and how per-project proxying lets real and mocked endpoints work together.",
};

export default function CloudProjectsPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Mocko Cloud</DocsEyebrow>
      <DocsTitle>Projects and URLs</DocsTitle>
      <DocsLead>
        A project is the unit you work in on Mocko Cloud. It owns a public host,
        its own mocks and flags, its own request logs, and its own members.
        Understanding the project is understanding the platform.
      </DocsLead>

      <DocsH2>One project, one host</DocsH2>
      <DocsP>
        Each project answers on a single HTTPS host derived from its slug:
      </DocsP>
      <DocsSnippet
        command="https://<slug>.free.mockoapp.net"
        className="mb-4"
      />
      <DocsP>
        Every request to that host is routed to that project and only that
        project. There is no path prefix to remember and no shared namespace: a{" "}
        <DocsCode>GET /users</DocsCode> against your host hits your{" "}
        <DocsCode>/users</DocsCode> mock. Because the host is a real HTTPS
        address, you point a client at it exactly as you would point at the
        upstream service you are standing in for.
      </DocsP>
      <Callout variant="info">
        The slug is chosen when the project is created and can be changed later
        from the project settings. Changing it changes the public host, so
        update any clients that were using the old address.
      </Callout>

      <DocsH2>Switching between projects</DocsH2>
      <DocsP>
        You can own several projects at once, for example one per service or one
        per environment. The control panel always acts on the currently selected
        project, and the project switcher changes which one that is. Mocks,
        flags, and logs are all scoped to the selection, so switching projects
        gives you a clean, unrelated workspace.
      </DocsP>

      <DocsH2>Proxying to a real backend</DocsH2>
      <DocsP>
        A project does not have to mock everything. Each one has an optional
        proxy URL: when a request arrives that no mock matches, Mocko forwards
        it to that address and returns the real response. Leave it blank and
        unmatched requests simply return a not-found response.
      </DocsP>
      <DocsP>
        This is what makes a project a selective layer rather than an all or
        nothing replacement. You mock the endpoints that are unfinished or hard
        to reproduce, and let everything else fall through to the genuine
        service:
      </DocsP>
      <DocsUl>
        <li>
          Mock <DocsCode>POST /checkout</DocsCode> to force a specific failure,
          while real <DocsCode>GET /products</DocsCode> requests reach your
          staging API.
        </li>
        <li>
          Stand your Cloud host in front of a partner API and override only the
          one endpoint that is not ready yet.
        </li>
      </DocsUl>
      <Callout variant="tip">
        Matching and fall-through behave the same as they do everywhere in
        Mocko. If you want the full picture of how a request is resolved before
        it reaches the proxy, read{" "}
        <DocsLink href="/creating-mocks/matching">How Matching Works</DocsLink>{" "}
        and{" "}
        <DocsLink href="/creating-mocks/proxying-and-hosts">
          Proxying and Hosts
        </DocsLink>
        .
      </Callout>

      <DocsH2>Next</DocsH2>
      <DocsP>
        Once traffic is flowing to a project, watch it live in{" "}
        <DocsLink href="/cloud/logs">Request Logs</DocsLink>, or invite the rest
        of your team from <DocsLink href="/cloud/team">Team Members</DocsLink>.
      </DocsP>
    </DocsPage>
  );
}
