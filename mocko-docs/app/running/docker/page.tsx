import type { Metadata } from "next";
import { Callout } from "@/components/docs/callout";
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
  title: "Docker Images",
  description:
    "Mocko's container images: the all-in-one standalone image versus the split core and control images, and when to use each.",
};

export default function RunningDockerPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Running Mocko</DocsEyebrow>
      <DocsTitle>Docker Images</DocsTitle>
      <DocsLead>
        Mocko ships three images: an all-in-one standalone image, and a split
        pair with the mock server and the control panel as separate containers.
        This page explains what each contains and how to choose.
      </DocsLead>

      <DocsH2>The three images</DocsH2>
      <DocsUl>
        <li>
          <DocsCode>ghcr.io/mocko-app/standalone</DocsCode> wraps the CLI: mock
          server, control panel, and file watching in one container. Ports 8080
          (mocks) and 6625 (UI), mocks mounted at{" "}
          <DocsCode>/var/mocks</DocsCode>.
        </li>
        <li>
          <DocsCode>ghcr.io/mocko-app/core</DocsCode> is just the mock server,
          the component that receives your traffic. Port 8080.
        </li>
        <li>
          <DocsCode>ghcr.io/mocko-app/control</DocsCode> is just the control
          panel. Port 6625. It talks to core through a shared secret and stores
          its state in Redis.
        </li>
      </DocsUl>

      <DocsH2>When each fits</DocsH2>
      <DocsP>
        <strong className="text-foreground">Standalone</strong> is the right
        default for local work and simple single-container setups: nothing to
        wire, watch mode on, UI included. It is what the{" "}
        <DocsLink href="/running/compose">Docker Compose</DocsLink> page uses.
      </DocsP>
      <DocsP>
        <strong className="text-foreground">Core and control split</strong> is
        for shared deployments. The two components have different lives: core
        sits on the hot path of your test traffic and may need several replicas,
        while control serves a handful of developers and one replica is plenty.
        Splitting them lets you scale, restart, and secure each independently,
        and drop control entirely where nobody needs a UI.
      </DocsP>
      <Callout variant="tip">
        Deploying the split images to Kubernetes by hand means recreating the
        wiring below as manifests. The{" "}
        <DocsLink href="/running/helm">Helm chart</DocsLink> does exactly that,
        including the shared secret, probes, and an optional Redis, so prefer it
        on Kubernetes.
      </Callout>

      <DocsH2>Running the split pair</DocsH2>
      <DocsP>
        Core and control connect through two things: a Redis both can reach, and
        a shared deploy secret that lets control push changes to core. The
        essential wiring, shown as plain <DocsCode>docker run</DocsCode>{" "}
        commands:
      </DocsP>
      <DocsSnippet
        command="docker run -d --name mocko-core -p 8080:8080 -e REDIS_ENABLED=true -e REDIS_URL=redis://redis:6379 -e DEPLOY_ENDPOINT_ENABLED=true -e DEPLOY_SECRET=change-me ghcr.io/mocko-app/core:2"
        className="mb-4"
      />
      <DocsSnippet
        command="docker run -d --name mocko-control -p 6625:6625 -e MOCKO_CORE_URL=http://mocko-core:8080 -e MOCKO_DEPLOY_SECRET=change-me -e REDIS_ENABLED=true -e REDIS_URL=redis://redis:6379 ghcr.io/mocko-app/control:2"
        className="mb-4"
      />
      <DocsUl>
        <li>
          <DocsCode>DEPLOY_SECRET</DocsCode> on core and{" "}
          <DocsCode>MOCKO_DEPLOY_SECRET</DocsCode> on control must match; it
          authenticates control&apos;s internal calls to core.
        </li>
        <li>
          <DocsCode>DEPLOY_ENDPOINT_ENABLED=true</DocsCode> opens the internal
          endpoint control uses to apply changes. Leave it unset on a core that
          runs without control.
        </li>
        <li>
          Both point at the same Redis. The split setup effectively requires
          Redis: it is where deployed mocks, hosts, and flags live, and how
          multiple core replicas stay consistent.
        </li>
      </DocsUl>
      <DocsP>
        Core reads the same{" "}
        <DocsLink href="/reference/configuration">
          environment variables
        </DocsLink>{" "}
        in any setup, so proxying (<DocsCode>PROXY_BASE-URI</DocsCode>),
        timeouts, and auth are configured identically here and in the standalone
        image.
      </DocsP>

      <DocsH2>File mocks in images</DocsH2>
      <DocsP>
        Core loads <DocsCode>.hcl</DocsCode> files from{" "}
        <DocsCode>/var/mocks</DocsCode>. You can mount them, but for shared
        environments baking them in wins: the image becomes a versioned,
        rollback-able artifact of your team&apos;s mock behavior.
      </DocsP>
      <DocsCodeBlock>{`FROM ghcr.io/mocko-app/core:2
COPY mocks/ /var/mocks/`}</DocsCodeBlock>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          Health checks: core answers on{" "}
          <DocsCode>GET /__mocko__/health</DocsCode>, control on{" "}
          <DocsCode>GET /api/health</DocsCode>. Point container or orchestrator
          probes there.
        </li>
        <li>
          On shared instances, consider{" "}
          <DocsCode>MANAGEMENT_AUTH_MODE</DocsCode> to require a bearer token on
          management routes; see the{" "}
          <DocsLink href="/reference/configuration">
            configuration reference
          </DocsLink>
          .
        </li>
        <li>
          The <DocsCode>2</DocsCode> tag on all three images always points at
          the latest Mocko v2 release, with no breaking changes within v2. Use
          the same tag across core and control.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        On Kubernetes, skip the manual wiring. Continue to{" "}
        <DocsLink href="/running/helm">Kubernetes with Helm</DocsLink>.
      </DocsP>
    </DocsPage>
  );
}
