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
  title: "Migrating from v1",
  description:
    "Move a Mocko v1 installation to v2: run the built-in migration operation against the same Redis, fix templates, and purge v1 data.",
};

export default function ReferenceV1MigrationPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Reference</DocsEyebrow>
      <DocsTitle>Migrating from v1</DocsTitle>
      <DocsLead>
        Mocko v2 ships a supervised migration that copies a v1
        installation&apos;s mocks and flags into v2 on the same Redis. The two
        versions run side by side during the transition, v1 stays untouched
        until you explicitly purge it, and rollback is always possible in
        between.
      </DocsLead>

      <DocsH2>How it works</DocsH2>
      <DocsP>
        v1 and v2 store their data under different key namespaces inside the
        same Redis, so the safe path is: point your v2 install at the Redis v1
        already uses, copy the data across namespaces with the migration
        operation, verify, and only then decommission v1.
      </DocsP>

      <DocsH2>1. Point v2 at the v1 Redis</DocsH2>
      <DocsP>
        Deploy v2 in <DocsLink href="/running/persistence">Redis mode</DocsLink>{" "}
        against the existing v1 Redis, keeping the same key prefix v1 used. On{" "}
        <DocsLink href="/running/helm">Helm</DocsLink>, that means disabling the
        chart&apos;s bundled Redis and configuring the external one:
      </DocsP>
      <DocsCodeBlock language="yaml">{`persistence:
  redis:
    enabled: true
    internal:
      enabled: false
    url: "redis://my-existing-redis:6379"

control:
  v1Migration:
    enabled: true`}</DocsCodeBlock>
      <Callout variant="info">
        v1 Helm installs used the release name as the key prefix, so have your
        old release name at hand: it is the source prefix the migration will ask
        for. Outside Helm, it is whatever <DocsCode>REDIS_PREFIX</DocsCode> v1
        ran with.
      </Callout>

      <DocsH2>2. Enable the migration operations</DocsH2>
      <DocsP>
        The migration UI is hidden by default. Setting{" "}
        <DocsCode>control.v1Migration.enabled: true</DocsCode> (or{" "}
        <DocsCode>MOCKO_V1_MIGRATION_ENABLED=true</DocsCode> on a self-managed
        control panel) reveals two extra{" "}
        <DocsLink href="/reference/operations">operations</DocsLink> on the
        Management page:{" "}
        <strong className="text-foreground">Migrate from V1</strong> and{" "}
        <strong className="text-foreground">Purge V1 data</strong>. Turn the
        setting back off once you are done.
      </DocsP>

      <DocsH2>3. Run the migration</DocsH2>
      <DocsP>
        Start <strong className="text-foreground">Migrate from V1</strong> and
        enter the v1 prefix. Like every operation, it scans first and reports
        what it found, for example &quot;12 mocks and 3,400 flags will be
        migrated&quot;, before anything is written. On execute it copies all
        flags (values and remaining TTLs) and then all mocks, with live
        progress, and the migrated mocks are served by v2 the moment the run
        completes.
      </DocsP>
      <DocsUl>
        <li>
          The migration is one-time and requires an empty v2 workspace: it
          refuses to run if v2 already has mocks.
        </li>
        <li>
          A scan that finds nothing usually means a wrong source prefix; cancel
          and check the prefix against your v1 configuration.
        </li>
        <li>
          v1 keeps running unmodified throughout, so you can compare the two
          side by side before switching traffic.
        </li>
      </DocsUl>

      <DocsH2>4. Fix templates that need it</DocsH2>
      <DocsP>
        v1 bodies used Handlebars; v2 uses{" "}
        <DocsLink href="/reference/bigodon">Bigodon</DocsLink>. The syntax is
        largely compatible, and mocks whose templates do not parse as Bigodon
        are still migrated: they get an{" "}
        <strong className="text-foreground">Invalid template</strong> badge in
        the mocks list and return 500 if hit, and the badge clears on the first
        successful save. The usual edits are <DocsCode>../field</DocsCode> to{" "}
        <DocsCode>$parent.field</DocsCode>, <DocsCode>{"{{this}}"}</DocsCode> to{" "}
        <DocsCode>{"{{$this}}"}</DocsCode>, and unescaping triple-stash.
      </DocsP>
      <DocsP>
        If you use an AI coding agent, install the Mocko skill and ask it to
        translate the flagged templates:
      </DocsP>
      <DocsSnippet
        command="npx skills@latest add mocko-app/mocko/skills/mocko"
        className="mb-4"
      />

      <DocsH2>5. Purge v1 data</DocsH2>
      <DocsP>
        <strong className="text-foreground">Purge V1 data</strong> appears only
        after a successful migration run. It deletes the old v1 keys (only
        Mocko&apos;s known key patterns, never a blanket wipe of the prefix)
        after a confirmation that shows the migration date.
      </DocsP>
      <Callout variant="warning">
        Anything v1 wrote <em>after</em> the migration date is lost on purge.
        Purge only once v1 is decommissioned and nothing writes to it anymore.
      </Callout>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          An interrupted migration can be re-run and completes cleanly; flag
          collisions are overwritten by the v1 value during migration.
        </li>
        <li>
          v1 installs on a different Redis than the one v2 will use: migrate on
          the old Redis first, then move the database with standard Redis
          tooling.
        </li>
        <li>
          The operations API and UI reject both operations while the
          v1-migration setting is off, so leaving it disabled day to day costs
          nothing.
        </li>
      </DocsUl>
    </DocsPage>
  );
}
