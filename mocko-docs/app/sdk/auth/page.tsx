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
  title: "Auth and Deployment",
  description:
    "Use the Mocko SDK against shared and protected instances: MANAGEMENT_AUTH_MODE, the secret option, and where to get the secret in CI.",
};

export default function SdkAuthPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Testing with the SDK</DocsEyebrow>
      <DocsTitle>Auth and Deployment</DocsTitle>
      <DocsLead>
        On localhost the SDK just works. Against a shared staging instance,
        whether the flag and callback endpoints are open or protected depends on
        one setting on the mock server. This page covers that setting and how to
        wire the secret into your test runs.
      </DocsLead>

      <DocsH2>How Mocko protects management routes</DocsH2>
      <DocsP>
        The mock server&apos;s <DocsCode>MANAGEMENT_AUTH_MODE</DocsCode> setting
        has three levels:
      </DocsP>
      <DocsUl>
        <li>
          <DocsCode>deploy</DocsCode> (the default): internal management routes
          require auth, but flag and callback endpoints stay open. The SDK needs
          no configuration.
        </li>
        <li>
          <DocsCode>all</DocsCode>: flag and callback endpoints also require a
          bearer token. The SDK must be given the secret.
        </li>
        <li>
          <DocsCode>none</DocsCode>: everything is open. Fine for throwaway
          local setups.
        </li>
      </DocsUl>
      <DocsP>
        The default is deliberately test-friendly: flags and callbacks are the
        public contract between tests and mocks, so they stay open unless you
        opt into locking them down. Lock them down when the instance is
        reachable beyond your team or when flag values could be sensitive.
      </DocsP>

      <DocsH2>Passing the secret</DocsH2>
      <DocsP>
        Against a core running with{" "}
        <DocsCode>MANAGEMENT_AUTH_MODE=all</DocsCode>, pass the instance&apos;s
        deploy secret to the client. It is sent as{" "}
        <DocsCode>Authorization: Bearer &lt;secret&gt;</DocsCode> on every
        request:
      </DocsP>
      <DocsCodeBlock language="ts">{`export const mocko = new MockoClient('https://mocks.staging.example.com', {
  secret: process.env.MOCKO_SECRET,
});`}</DocsCodeBlock>
      <DocsP>
        Keep the secret in your test environment&apos;s secret store like any
        other credential; the client reads it from an environment variable so
        nothing lands in the repo.
      </DocsP>

      <DocsH2>Where the secret comes from</DocsH2>
      <DocsUl>
        <li>
          On self-managed cores, it is whatever you set as{" "}
          <DocsCode>DEPLOY_SECRET</DocsCode> in the{" "}
          <DocsLink href="/reference/configuration">configuration</DocsLink>.
        </li>
        <li>
          On <DocsLink href="/running/helm">Helm</DocsLink> installs, the chart
          generates it. Read it from the release secret:
        </li>
      </DocsUl>
      <DocsSnippet
        command={`kubectl get secret mocko -o jsonpath='{.data.deploy-secret}' | base64 -d`}
        className="mb-4"
      />
      <Callout variant="info">
        The CLI generates a random secret per run and keeps flag and callback
        endpoints open (<DocsCode>deploy</DocsCode> mode), which is why none of
        this ever comes up in local development.
      </Callout>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          With <DocsCode>all</DocsCode> mode and a missing or wrong secret, flag
          calls fail with <DocsCode>401</DocsCode>; the SDK surfaces that as a
          thrown error, so misconfigured CI fails loudly rather than silently
          testing nothing.
        </li>
        <li>
          The same secret protects the control panel&apos;s internal calls, so
          rotating <DocsCode>DEPLOY_SECRET</DocsCode> means updating both the
          control deployment and your test environments.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        That completes the SDK section. If you are setting up the instances your
        tests will point at, head to{" "}
        <DocsLink href="/running/cli">Running Mocko</DocsLink>.
      </DocsP>
    </DocsPage>
  );
}
