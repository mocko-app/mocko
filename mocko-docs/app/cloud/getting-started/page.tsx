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
  title: "Getting Started with Mocko Cloud",
  description:
    "Sign in with GitHub, create a project, and publish your first mock on a public HTTPS URL in a few minutes.",
};

export default function CloudGettingStartedPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Mocko Cloud</DocsEyebrow>
      <DocsTitle>Getting Started</DocsTitle>
      <DocsLead>
        By the end of this page you will have a public HTTPS URL that returns a
        mock response you defined, reachable from anywhere. There is nothing to
        install.
      </DocsLead>

      <DocsH2>1. Sign in</DocsH2>
      <DocsP>
        Open <DocsLink href="https://app.mocko.dev">app.mocko.dev</DocsLink> and
        sign in with GitHub. GitHub is the only account you need, and it is also
        how teammates are identified when you invite them later.
      </DocsP>

      <DocsH2>2. Create a project</DocsH2>
      <DocsP>
        A project is one isolated mock server with its own address. When you
        create one you choose a slug, and that slug becomes your public host:
      </DocsP>
      <DocsSnippet
        command="https://<your-slug>.free.mockoapp.net"
        className="mb-4"
      />
      <DocsP>
        The slug must be at least four characters, and the app checks
        availability as you type. Pick something recognizable such as your team
        or service name, because this is the URL your clients will point at.
      </DocsP>
      <Callout variant="info">
        Everything you build lives inside the selected project. If you work on
        several unrelated things, give each one its own project so their mocks,
        flags, and logs stay separate.
      </Callout>

      <DocsH2>3. Create a mock</DocsH2>
      <DocsP>
        In the <DocsCode>Mocks</DocsCode> view, add a mock the same way you
        would in the open source control panel: choose a method, set a path such
        as <DocsCode>/hello</DocsCode>, and write a response body. A plain
        greeting is enough for a first test.
      </DocsP>
      <DocsP>
        The full mechanics of matching, response bodies, headers, and dynamic
        templates are covered in{" "}
        <DocsLink href="/creating-mocks/file-mocks">Creating Mocks</DocsLink>{" "}
        and apply here unchanged.
      </DocsP>

      <DocsH2>4. Call your public URL</DocsH2>
      <DocsP>
        Your mock is live the moment you save it. Call it from any machine, with
        no tunnel or local server involved:
      </DocsP>
      <DocsSnippet
        command="curl https://<your-slug>.free.mockoapp.net/hello"
        output="Hello from Mocko!"
        className="mb-4"
      />
      <DocsP>
        Send that URL to a teammate and they will get the same response. That
        shareability is the whole point of running in the Cloud.
      </DocsP>

      <DocsH2>Where to go next</DocsH2>
      <DocsP>
        You now have a working public mock. From here you can shape how the
        project behaves and who can reach it:
      </DocsP>
      <DocsP>
        Learn how hosts and proxying work in{" "}
        <DocsLink href="/cloud/projects">Projects and URLs</DocsLink>, watch
        real traffic in <DocsLink href="/cloud/logs">Request Logs</DocsLink>,
        bring in the rest of your team from{" "}
        <DocsLink href="/cloud/team">Team Members</DocsLink>, or put your Cloud
        host in front of a service on your own machine with{" "}
        <DocsLink href="/cloud/tunnels">Local Tunnels</DocsLink>.
      </DocsP>
    </DocsPage>
  );
}
