import type { Metadata } from "next";
import {
  DocsCode,
  DocsCodeBlock,
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
  title: "Docker Compose",
  description:
    "Run Mocko in Docker Compose next to your services: the standalone image, mounted mock files, Redis persistence, and host aliasing.",
};

export default function RunningComposePage() {
  return (
    <DocsPage>
      <DocsEyebrow>Running Mocko</DocsEyebrow>
      <DocsTitle>Docker Compose</DocsTitle>
      <DocsLead>
        If your local stack already lives in a compose file, Mocko slots in as
        one more service. This page sets up the standalone image with mounted
        mock files, adds Redis persistence, and points your app at it.
      </DocsLead>

      <DocsH2>A minimal setup</DocsH2>
      <DocsCodeBlock>{`services:
  mocko:
    image: ghcr.io/mocko-app/standalone:2
    ports:
      - "8080:8080"   # mock server
      - "6625:6625"   # control panel
    volumes:
      - ./mocks:/var/mocks`}</DocsCodeBlock>
      <DocsSnippet command="docker compose up mocko" className="mb-4" />
      <DocsP>
        The image runs the CLI in watch mode against{" "}
        <DocsCode>/var/mocks</DocsCode>, so anything you learned in{" "}
        <DocsLink href="/creating-mocks/file-mocks">File Mocks</DocsLink>{" "}
        applies as-is: edit a file in <DocsCode>./mocks</DocsCode> on your
        machine and the container reloads it.
      </DocsP>

      <DocsH2>Proxying to a backend service</DocsH2>
      <DocsP>
        The image exposes the proxy settings as environment variables.{" "}
        <DocsCode>MOCKO_URL</DocsCode> is the proxy target for unmatched
        requests (the CLI&apos;s <DocsCode>-u</DocsCode>), and{" "}
        <DocsCode>MOCKO_TIMEOUT</DocsCode> is the proxy timeout in milliseconds
        (<DocsCode>-t</DocsCode>, default 30000). Compose service names resolve
        inside the network, so the target is usually another service:
      </DocsP>
      <DocsCodeBlock>{`services:
  api:
    build: ./api

  mocko:
    image: ghcr.io/mocko-app/standalone:2
    ports:
      - "8080:8080"
      - "6625:6625"
    environment:
      MOCKO_URL: http://api:3000
    volumes:
      - ./mocks:/var/mocks`}</DocsCodeBlock>
      <DocsP>
        Point your frontend at <DocsCode>http://localhost:8080</DocsCode>{" "}
        instead of the API and you get the selective-mocking setup from{" "}
        <DocsLink href="/recipes/mock-one-edge-case">
          Mock One Edge Case
        </DocsLink>{" "}
        for the whole team, with the mocks folder committed next to the compose
        file.
      </DocsP>

      <DocsH2>Adding Redis persistence</DocsH2>
      <DocsP>
        Add a Redis service and the <DocsCode>REDIS_*</DocsCode> variables, and
        UI-created mocks, hosts, and flags survive{" "}
        <DocsCode>docker compose down</DocsCode>:
      </DocsP>
      <DocsCodeBlock>{`services:
  redis:
    image: redis:6-alpine
    volumes:
      - ./data/redis:/data

  mocko:
    image: ghcr.io/mocko-app/standalone:2
    ports:
      - "8080:8080"
      - "6625:6625"
    environment:
      REDIS_ENABLED: "true"
      REDIS_URL: redis://redis:6379
    volumes:
      - ./mocks:/var/mocks
    depends_on:
      - redis`}</DocsCodeBlock>
      <DocsP>
        When and why to do this is covered on{" "}
        <DocsLink href="/running/persistence">Persistence and Redis</DocsLink>;
        the short version is that storeless is great until you want shared or
        durable state.
      </DocsP>

      <DocsH2>Standing in for several services</DocsH2>
      <DocsP>
        To use{" "}
        <DocsLink href="/recipes/microservices-by-host">
          host-based routing
        </DocsLink>{" "}
        in compose, give the Mocko container the hostnames your app already
        calls, using network aliases:
      </DocsP>
      <DocsCodeBlock>{`services:
  mocko:
    image: ghcr.io/mocko-app/standalone:2
    networks:
      default:
        aliases:
          - billing.local
          - catalog.local
    volumes:
      - ./mocks:/var/mocks`}</DocsCodeBlock>
      <DocsP>
        Your app resolves <DocsCode>billing.local</DocsCode> to the Mocko
        container, the <DocsCode>Host</DocsCode> header arrives as{" "}
        <DocsCode>billing.local</DocsCode>, and the host blocks in your mock
        files take it from there.
      </DocsP>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          The <DocsCode>2</DocsCode> tag always points at the latest Mocko v2
          release, and v2 releases never break compatibility, so it is safe to
          stay on it.
        </li>
        <li>
          The container runs as a non-root user (uid 10001). If the mounted
          mocks folder is not readable by that user, the container logs load
          errors instead of serving your files.
        </li>
        <li>
          All{" "}
          <DocsLink href="/reference/configuration">
            core environment variables
          </DocsLink>{" "}
          pass through to the standalone image, so anything configurable on a
          deployed core can be set here too.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        The standalone image is one of two container options. Continue to{" "}
        <DocsLink href="/running/docker">Docker Images</DocsLink> for the split
        core and control images and when to prefer them.
      </DocsP>
    </DocsPage>
  );
}
