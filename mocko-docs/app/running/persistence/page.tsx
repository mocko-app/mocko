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

export const metadata: Metadata = {
  title: "Persistence and Redis",
  description:
    "Mocko's two storage modes explained: storeless versus Redis, what survives a restart, and how to enable persistence in each run mode.",
};

export default function RunningPersistencePage() {
  return (
    <DocsPage>
      <DocsEyebrow>Running Mocko</DocsEyebrow>
      <DocsTitle>Persistence and Redis</DocsTitle>
      <DocsLead>
        Every persistence question in Mocko has the same answer: are you running
        storeless or with Redis? This page is the definitive breakdown of the
        two modes, what each one stores, and when to switch.
      </DocsLead>

      <DocsH2>The two modes</DocsH2>
      <DocsP>
        <strong className="text-foreground">Storeless</strong> is the default.
        Everything created at runtime lives in the process memory and disappears
        when Mocko stops. No dependencies, instant startup, and every session
        begins in a known clean state, which is exactly what you want on a
        laptop and in CI.
      </DocsP>
      <DocsP>
        <strong className="text-foreground">Redis mode</strong> moves that
        runtime state into Redis. Mocks created in the UI, hosts, and flags
        survive restarts, several core replicas stay consistent, and the
        management <DocsLink href="/reference/operations">operations</DocsLink>{" "}
        become available. This is the mode for shared instances.
      </DocsP>

      <DocsH2>What lives where</DocsH2>
      <DocsUl>
        <li>
          <strong className="text-foreground">
            File mocks, hosts, and data blocks from .hcl files
          </strong>
          : always come from your files, in both modes. Their durability is your
          git history; a restart simply reloads them.
        </li>
        <li>
          <strong className="text-foreground">Deployed mocks and hosts</strong>{" "}
          (created in the UI): memory in storeless mode, Redis in Redis mode.
        </li>
        <li>
          <strong className="text-foreground">Flags</strong>: same split. In
          storeless mode a restart resets all state your mocks accumulated; in
          Redis mode a simulated scenario picks up where it left off.
        </li>
      </DocsUl>
      <Callout variant="info">
        This split is why the recommended workflow keeps repeatable behavior in
        files and treats the UI as an override layer: the part that matters is
        versioned regardless of mode, and the runtime layer is durable exactly
        when you choose it to be.
      </Callout>

      <DocsH2>Enabling Redis in each run mode</DocsH2>
      <DocsP>On the CLI, pass a Redis URL:</DocsP>
      <DocsCodeBlock language="bash">{`mocko -r redis://localhost:6379 --watch mocks`}</DocsCodeBlock>
      <DocsP>
        In containers (<DocsLink href="/running/compose">Compose</DocsLink> or
        the <DocsLink href="/running/docker">split images</DocsLink>), set the
        environment variables:
      </DocsP>
      <DocsCodeBlock language="yaml">{`REDIS_ENABLED: "true"
REDIS_URL: redis://redis:6379
# or discrete settings: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DATABASE`}</DocsCodeBlock>
      <DocsP>
        On <DocsLink href="/running/helm">Kubernetes with Helm</DocsLink>,
        persistence is on by default with a chart-managed Redis, and{" "}
        <DocsCode>persistence.redis.*</DocsCode> switches it to an external one.
      </DocsP>

      <DocsH2>When to switch to Redis</DocsH2>
      <DocsUl>
        <li>
          A shared instance where the team manages mocks through the UI and
          expects them to still be there tomorrow.
        </li>
        <li>
          More than one core replica: without a shared store, each replica would
          have its own flags and deployed mocks, and behavior would depend on
          which pod answered.
        </li>
        <li>
          Long-lived stateful simulations, like the{" "}
          <DocsLink href="/recipes/stateful-crud">Stateful CRUD</DocsLink>{" "}
          recipe backing a QA environment for weeks.
        </li>
        <li>
          The management operations for cleaning up and inspecting flags at
          scale, which are{" "}
          <DocsLink href="/reference/operations">Redis-only</DocsLink>.
        </li>
      </DocsUl>
      <DocsP>
        Conversely, stay storeless while the reset-on-restart behavior is doing
        you a favor: local development and CI runs usually want a clean slate,
        not durability.
      </DocsP>

      <DocsH2>Sharing a Redis instance</DocsH2>
      <DocsP>
        Mocko namespaces every key under a prefix, <DocsCode>mocko:</DocsCode>{" "}
        by default, configurable via <DocsCode>REDIS_PREFIX</DocsCode> (or{" "}
        <DocsCode>persistence.redis.prefix</DocsCode> in Helm). Give each Mocko
        deployment its own prefix when several share one Redis, or when Mocko
        shares a Redis with other applications.
      </DocsP>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          Flag TTLs work in both modes; in Redis mode they map to real key
          expirations, so expired scenario state cleans itself up.
        </li>
        <li>
          Redis mode does not change how file mocks load. Files are still read
          from disk on startup and on watch reloads, never from Redis.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        That wraps the run modes. For the complete list of environment variables
        behind them, head to the{" "}
        <DocsLink href="/reference/configuration">
          configuration reference
        </DocsLink>
        .
      </DocsP>
    </DocsPage>
  );
}
