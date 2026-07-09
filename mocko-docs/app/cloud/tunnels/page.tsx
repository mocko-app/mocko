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
} from "@/components/docs/content";
import { DocsSnippet } from "@/components/docs/snippet";

export const metadata: Metadata = {
  title: "Local Tunnels",
  description:
    "Expose a service running on your own machine through your Mocko Cloud host, with your mocks layered on top of it.",
};

export default function CloudTunnelsPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Mocko Cloud</DocsEyebrow>
      <DocsTitle>Local Tunnels</DocsTitle>
      <DocsLead>
        A Local Tunnel connects a port on your machine to your Cloud project.
        Requests to your public host reach the service you are running locally,
        and your mocks still apply on top. It is a way to put a real,
        in-progress backend behind the same URL your team already uses.
      </DocsLead>

      <Callout variant="info">Local Tunnels are currently in beta.</Callout>

      <DocsH2>Why tunnel instead of proxy</DocsH2>
      <DocsP>
        A project&apos;s <DocsLink href="/cloud/projects">proxy URL</DocsLink>{" "}
        reaches a backend that is already accessible on the internet. A tunnel
        is for the backend that is not: a service on{" "}
        <DocsCode>localhost</DocsCode> behind your firewall or NAT. The tunnel
        opens a secure connection outward from your machine, so the Cloud can
        forward requests to it without you exposing a port.
      </DocsP>
      <DocsP>
        Because your mocks sit in front of the tunnel, you can override
        individual endpoints of a local service without touching its code, and
        watch every request that flows through in{" "}
        <DocsLink href="/cloud/logs">Request Logs</DocsLink>.
      </DocsP>

      <DocsH2>Install the tunnel client</DocsH2>
      <DocsP>
        The tunnel runs as a small command-line client, installed globally from
        npm:
      </DocsP>
      <DocsSnippet command="npm install -g @mocko/tunnel" className="mb-4" />
      <DocsP>
        It exposes two equivalent commands, <DocsCode>mocko-tunnel</DocsCode>{" "}
        and the shorter <DocsCode>mlt</DocsCode>.
      </DocsP>

      <DocsH2>Get your tunnel token</DocsH2>
      <DocsP>
        A token authorizes the client to connect to your project. Open the{" "}
        <DocsCode>Tunnels</DocsCode> view in the control panel, enable Local
        Tunnel for the project, and copy the generated token. The token belongs
        to the project, so anyone with it can tunnel into that host: treat it
        like a secret.
      </DocsP>

      <DocsH2>Open the tunnel</DocsH2>
      <DocsP>
        Point the client at the local port you want to expose. If your service
        runs on port <DocsCode>8080</DocsCode>:
      </DocsP>
      <DocsSnippet command="mocko-tunnel 8080" className="mb-4" />
      <DocsP>
        The client prompts for the token the first time. You can also pass it
        directly, which is handy in scripts:
      </DocsP>
      <DocsSnippet
        command="mocko-tunnel 8080 --token <your-tunnel-token>"
        className="mb-4"
      />
      <DocsP>
        While the tunnel is open, requests to your public host that no mock
        handles are delivered to your local service on port{" "}
        <DocsCode>8080</DocsCode>. Stop the client and the tunnel closes.
      </DocsP>

      <Callout variant="tip">
        A tunnel and a proxy URL both handle the requests your mocks do not.
        Reach for the tunnel when the backend only exists on your machine, and
        for the <DocsLink href="/cloud/projects">proxy URL</DocsLink> when it is
        already reachable on the network.
      </Callout>
    </DocsPage>
  );
}
