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

export const metadata: Metadata = {
  title: "Request Logs",
  description:
    "Watch every request that reaches your Mocko Cloud project, including its headers and body, to confirm clients are calling what you expect.",
};

export default function CloudLogsPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Mocko Cloud</DocsEyebrow>
      <DocsTitle>Request Logs</DocsTitle>
      <DocsLead>
        The <DocsCode>Logs</DocsCode> view shows the requests that reach your
        project as they happen. When a client is not getting the response you
        expected, this is where you find out what it actually sent.
      </DocsLead>

      <DocsH2>What you see</DocsH2>
      <DocsP>
        Each entry is one request that arrived at your public host. Opening it
        shows the details you need to tell an intended call from a malformed
        one:
      </DocsP>
      <DocsUl>
        <li>The method and path that was requested.</li>
        <li>The request headers, including the ones the client set for you.</li>
        <li>
          The request body, so you can confirm the payload is what you expect.
        </li>
      </DocsUl>
      <DocsP>
        Logs stream in live, so you can leave the view open, trigger the call
        from your app or a <DocsCode>curl</DocsCode>, and watch it appear.
      </DocsP>

      <DocsH2>Why it helps</DocsH2>
      <DocsP>
        Most integration confusion comes down to a mismatch between what a
        client thinks it is sending and what it sends. Logs remove the guessing:
      </DocsP>
      <DocsUl>
        <li>
          Confirm a request is even reaching Mocko, rather than being blocked
          before it leaves the client.
        </li>
        <li>
          Check that a header or query parameter your{" "}
          <DocsLink href="/creating-mocks/matching">matching</DocsLink> depends
          on is actually present.
        </li>
        <li>
          Inspect the exact body a form or SDK produces before you write a mock
          to answer it.
        </li>
      </DocsUl>
      <Callout variant="tip">
        Logs cover both mocked and proxied traffic, and requests that arrive
        through a <DocsLink href="/cloud/tunnels">Local Tunnel</DocsLink> show
        up here too. It is one place to see everything hitting your host.
      </Callout>
    </DocsPage>
  );
}
