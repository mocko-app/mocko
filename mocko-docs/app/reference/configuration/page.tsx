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
  DocsTable,
  DocsTbody,
  DocsTd,
  DocsTh,
  DocsThead,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Configuration",
  description:
    "Every Mocko environment variable: server, proxying, management auth, Redis, the control panel, and the standalone Docker image.",
};

export default function ReferenceConfigurationPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Reference</DocsEyebrow>
      <DocsTitle>Configuration</DocsTitle>
      <DocsLead>
        The complete list of environment variables, grouped by component. The
        CLI manages most of this for you locally; these tables matter when
        running the <DocsLink href="/running/docker">Docker images</DocsLink>{" "}
        directly or tuning a deployment beyond what the{" "}
        <DocsLink href="/running/helm">Helm values</DocsLink> expose.
      </DocsLead>

      <DocsH2>Mock server (core)</DocsH2>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Variable</DocsTh>
            <DocsTh>Default</DocsTh>
            <DocsTh>Description</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>SERVER_HOST</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>0.0.0.0</DocsCode>
            </DocsTd>
            <DocsTd>Interface the mock server binds to.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>SERVER_PORT</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>8080</DocsCode>
            </DocsTd>
            <DocsTd>Port the mock server listens on.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>SERVER_ALLOW-CORS</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>true</DocsCode>
            </DocsTd>
            <DocsTd>
              Answer CORS preflights and add CORS headers to responses. Set to{" "}
              <DocsCode>false</DocsCode> to let OPTIONS requests reach your
              mocks or proxy instead.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>PROXY_BASE-URI</DocsCode>
            </DocsTd>
            <DocsTd>empty</DocsTd>
            <DocsTd>
              Backend to proxy unmatched requests to. Empty disables proxying
              (unmatched requests return 404). CLI flag: <DocsCode>-u</DocsCode>
              .
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>PROXY_TIMEOUT-MILLIS</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>30000</DocsCode>
            </DocsTd>
            <DocsTd>
              Max time to wait for a proxied response. CLI flag:{" "}
              <DocsCode>-t</DocsCode>.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>MANAGEMENT_AUTH_MODE</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>deploy</DocsCode>
            </DocsTd>
            <DocsTd>
              Which management routes require{" "}
              <DocsCode>Authorization: Bearer</DocsCode> auth; see below.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>DEPLOY_SECRET</DocsCode>
            </DocsTd>
            <DocsTd>unset</DocsTd>
            <DocsTd>
              The bearer token protected routes expect. Shared with the control
              panel and, in <DocsCode>all</DocsCode> mode, with the{" "}
              <DocsLink href="/sdk/auth">SDK</DocsLink>.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>DEPLOY_ENDPOINT_ENABLED</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>false</DocsCode>
            </DocsTd>
            <DocsTd>
              Enables the internal endpoint the control panel uses to apply
              changes to core. Set to <DocsCode>true</DocsCode> whenever a
              control panel is deployed against this core.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>FLAGS_LIST-LIMIT</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>200</DocsCode>
            </DocsTd>
            <DocsTd>
              Maximum number of entries returned when listing flags before the
              listing truncates.
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>

      <DocsH2>MANAGEMENT_AUTH_MODE</DocsH2>
      <DocsP>
        Controls bearer-token protection on the management routes, using{" "}
        <DocsCode>DEPLOY_SECRET</DocsCode> as the token:
      </DocsP>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Mode</DocsTh>
            <DocsTh>Effect</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>none</DocsCode>
            </DocsTd>
            <DocsTd>Everything open. Throwaway local setups only.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>deploy</DocsCode>
            </DocsTd>
            <DocsTd>
              Internal management routes protected; flag endpoints open so tests
              and the SDK work without credentials. The default.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>all</DocsCode>
            </DocsTd>
            <DocsTd>
              Flag endpoints protected too; the SDK needs the{" "}
              <DocsCode>secret</DocsCode> option. For instances reachable beyond
              your team.
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>

      <DocsH2>Redis (core and control)</DocsH2>
      <DocsP>
        Both core and the control panel accept the same Redis variables and must
        point at the same instance. See{" "}
        <DocsLink href="/running/persistence">Persistence and Redis</DocsLink>{" "}
        for what Redis mode changes.
      </DocsP>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Variable</DocsTh>
            <DocsTh>Default</DocsTh>
            <DocsTh>Description</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>REDIS_ENABLED</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>false</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>false</DocsCode> is storeless mode;{" "}
              <DocsCode>true</DocsCode> enables Redis persistence.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>REDIS_URL</DocsCode>
            </DocsTd>
            <DocsTd>unset</DocsTd>
            <DocsTd>
              Full connection URL, e.g.{" "}
              <DocsCode>redis://:password@host:6379/0</DocsCode>. Takes
              precedence over the discrete settings below.{" "}
              <DocsCode>rediss://</DocsCode> enables TLS.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>REDIS_HOST</DocsCode> / <DocsCode>REDIS_PORT</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>127.0.0.1</DocsCode> / <DocsCode>6379</DocsCode>
            </DocsTd>
            <DocsTd>Discrete host and port.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>REDIS_PASSWORD</DocsCode> /{" "}
              <DocsCode>REDIS_DATABASE</DocsCode>
            </DocsTd>
            <DocsTd>
              unset / <DocsCode>0</DocsCode>
            </DocsTd>
            <DocsTd>Discrete credentials and database index.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>REDIS_PREFIX</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>mocko:</DocsCode>
            </DocsTd>
            <DocsTd>
              Key prefix for all Mocko keys. Change it when sharing a Redis
              between deployments or with other applications.
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>

      <DocsH2>Control panel</DocsH2>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Variable</DocsTh>
            <DocsTh>Default</DocsTh>
            <DocsTh>Description</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>MOCKO_CORE_URL</DocsCode>
            </DocsTd>
            <DocsTd>empty</DocsTd>
            <DocsTd>
              URL where control reaches core, e.g.{" "}
              <DocsCode>http://mocko-core:8080</DocsCode>.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>MOCKO_DEPLOY_SECRET</DocsCode>
            </DocsTd>
            <DocsTd>empty</DocsTd>
            <DocsTd>
              Must match core&apos;s <DocsCode>DEPLOY_SECRET</DocsCode>.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>PORT</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>6625</DocsCode>
            </DocsTd>
            <DocsTd>Port the control panel listens on.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>FLAGS_LIST_LIMIT</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>200</DocsCode>
            </DocsTd>
            <DocsTd>
              Flag listing truncation in the panel; keep it in sync with
              core&apos;s value.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>MOCKO_V1_MIGRATION_ENABLED</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>false</DocsCode>
            </DocsTd>
            <DocsTd>
              Reveals the v1 migration operations on the Management page. See{" "}
              <DocsLink href="/reference/v1-migration">
                Migrating from v1
              </DocsLink>
              .
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>

      <DocsH2>Standalone image</DocsH2>
      <DocsP>
        The <DocsLink href="/running/docker">standalone image</DocsLink> adds
        two convenience variables mapped to CLI flags, and passes every core
        variable above straight through:
      </DocsP>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Variable</DocsTh>
            <DocsTh>Default</DocsTh>
            <DocsTh>Description</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>MOCKO_URL</DocsCode>
            </DocsTd>
            <DocsTd>empty</DocsTd>
            <DocsTd>
              Proxy target for unmatched requests (<DocsCode>-u</DocsCode>).
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>MOCKO_TIMEOUT</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>30000</DocsCode>
            </DocsTd>
            <DocsTd>
              Proxy timeout in milliseconds (<DocsCode>-t</DocsCode>).
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>
      <Callout variant="info">
        Variable names containing a dash, like{" "}
        <DocsCode>PROXY_TIMEOUT-MILLIS</DocsCode> and{" "}
        <DocsCode>FLAGS_LIST-LIMIT</DocsCode>, are spelled exactly as shown.
        Container runtimes accept dashes in environment variable names even
        though most shells do not; in compose files and Kubernetes manifests
        they work as-is.
      </Callout>
    </DocsPage>
  );
}
