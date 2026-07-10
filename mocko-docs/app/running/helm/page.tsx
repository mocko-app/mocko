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
  title: "Kubernetes with Helm",
  description:
    "Deploy Mocko to Kubernetes with the official Helm chart: core, control panel, Redis persistence, file mocks from ConfigMaps, and key values.",
};

export default function RunningHelmPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Running Mocko</DocsEyebrow>
      <DocsTitle>Kubernetes with Helm</DocsTitle>
      <DocsLead>
        The Helm chart is the recommended way to run Mocko in a cluster. One
        install gives you the mock server, the control panel, a Redis with a
        persistent volume, and all the wiring between them. This is the setup
        for staging environments where a whole team points their services at
        Mocko.
      </DocsLead>

      <DocsH2>Install</DocsH2>
      <DocsP>
        The chart lives in the{" "}
        <DocsLink
          href="https://github.com/mocko-app/mocko"
          target="_blank"
          rel="noreferrer"
        >
          mocko-app/mocko
        </DocsLink>{" "}
        repository under <DocsCode>helm-charts/mocko</DocsCode>:
      </DocsP>
      <DocsSnippet
        command="git clone https://github.com/mocko-app/mocko.git"
        className="mb-4"
      />
      <DocsSnippet
        command="helm install mocko ./mocko/helm-charts/mocko"
        className="mb-4"
      />
      <DocsP>
        The defaults are a working team setup: one core replica, the control
        panel, and an internal single-replica Redis backed by a 1Gi
        PersistentVolumeClaim. The release notes print the port-forward
        commands; for a quick look without an ingress:
      </DocsP>
      <DocsSnippet
        command="kubectl port-forward svc/mocko-control 6625:6625"
        className="mb-4"
      />

      <DocsH2>The values that matter</DocsH2>
      <DocsP>
        A values file for a typical staging install, with the settings you are
        most likely to touch:
      </DocsP>
      <DocsCodeBlock language="yaml">{`core:
  replicas: 2
  # Proxy unmatched requests to the real backend (empty disables proxying).
  proxyUrl: "http://my-api.staging.svc.cluster.local"
  timeoutMillis: 30000

control:
  enabled: true

persistence:
  redis:
    enabled: true
    internal:
      enabled: true
      storage: 1Gi`}</DocsCodeBlock>
      <DocsUl>
        <li>
          <DocsCode>core.replicas</DocsCode>: scale the mock server for heavier
          test traffic. Replicas share state through Redis, so anything above 1
          needs persistence enabled.
        </li>
        <li>
          <DocsCode>core.proxyUrl</DocsCode>: the cluster-internal equivalent of
          the CLI&apos;s <DocsCode>-u</DocsCode> flag.
        </li>
        <li>
          <DocsCode>control.enabled: false</DocsCode> drops the UI entirely for
          file-mocks-only deployments.
        </li>
      </DocsUl>

      <DocsH2>Shipping file mocks</DocsH2>
      <DocsP>Committed mock files reach the cluster in two ways:</DocsP>
      <DocsUl>
        <li>
          Drop <DocsCode>.hcl</DocsCode> files into the chart&apos;s{" "}
          <DocsCode>mocks/</DocsCode> folder before installing (
          <DocsCode>core.fileMocks.chartFolder.enabled</DocsCode>, on by
          default), or
        </li>
        <li>
          Point <DocsCode>core.fileMocks.existingConfigMap</DocsCode> at a
          ConfigMap you manage yourself, which fits GitOps flows where the mocks
          live in another repo. Both sources can be active at once.
        </li>
      </DocsUl>
      <Callout variant="tip">
        For large or fast-moving mock sets, skip ConfigMaps and bake the files
        into a custom image (<DocsCode>FROM ghcr.io/mocko-app/core:2</DocsCode>,
        then <DocsCode>COPY mocks/ /var/mocks/</DocsCode>) as shown on{" "}
        <DocsLink href="/running/docker">Docker Images</DocsLink>, and set{" "}
        <DocsCode>core.image.repository</DocsCode> to your image.
      </Callout>

      <DocsH2>Using your own Redis</DocsH2>
      <DocsP>
        Disable the internal Redis and point the chart at an existing instance.
        Credentials can come from a Secret instead of values:
      </DocsP>
      <DocsCodeBlock language="yaml">{`persistence:
  redis:
    enabled: true
    internal:
      enabled: false
    # url: "rediss://:password@my-redis:6379/0"
    existingSecret:
      name: "my-redis-secret"
      urlKey: "redis-url"
    # Namespace Mocko's keys when sharing the Redis with other services:
    prefix: "mocko:"`}</DocsCodeBlock>
      <DocsP>
        Both <DocsCode>redis://</DocsCode> and TLS{" "}
        <DocsCode>rediss://</DocsCode> URLs are supported, and{" "}
        <DocsCode>prefix</DocsCode> keeps keys isolated when the Redis is
        shared, including between two Mocko releases.
      </DocsP>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          The chart generates the deploy secret connecting control to core and
          reuses it across upgrades; you never handle it manually.
        </li>
        <li>
          Liveness and readiness probes are preconfigured against{" "}
          <DocsCode>/__mocko__/health</DocsCode> (core) and{" "}
          <DocsCode>/api/health</DocsCode> (control).
        </li>
        <li>
          Resource requests and limits ship commented out in{" "}
          <DocsCode>values.yaml</DocsCode> with sane starting points; set them
          before giving a whole team access.
        </li>
        <li>
          <DocsCode>control.publicUrl</DocsCode> (default empty) sets the base
          URL the panel&apos;s <DocsCode>Copy as curl</DocsCode> commands point
          at. Left empty, they use the in-cluster core service, which only works
          for curls run from inside the cluster; set it to your ingress URL so
          the commands run anywhere.
        </li>
        <li>
          <DocsCode>control.v1Migration.enabled</DocsCode> reveals the v1
          migration operations in the management page. Leave it off unless you
          are actively migrating; see{" "}
          <DocsLink href="/reference/v1-migration">Migrating from v1</DocsLink>.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        Redis kept coming up on this page for a reason. Continue to{" "}
        <DocsLink href="/running/persistence">Persistence and Redis</DocsLink>{" "}
        for exactly what it stores and when you need it.
      </DocsP>
    </DocsPage>
  );
}
