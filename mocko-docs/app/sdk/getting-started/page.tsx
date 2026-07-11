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
  title: "Testing with the SDK",
  description:
    "Control Mocko from automated tests with the zero-dependency @mocko/sdk: set up scenarios through flags and assert against dynamic mocks.",
};

export default function SdkGettingStartedPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Testing with the SDK</DocsEyebrow>
      <DocsTitle>Getting Started</DocsTitle>
      <DocsLead>
        Automated tests need to put the mocked world into a known state before
        they run: this user exists, that feature is on, the next payment fails.{" "}
        <DocsCode>@mocko/sdk</DocsCode> does exactly that from TypeScript or
        JavaScript, by reading and writing the same{" "}
        <DocsLink href="/creating-mocks/flags">flags</DocsLink> your mock
        templates use.
      </DocsLead>

      <DocsH2>Install</DocsH2>
      <DocsSnippet command="npm install -D @mocko/sdk" className="mb-4" />
      <DocsP>Requires Node.js 20 or newer.</DocsP>
      <Callout variant="tip">
        The SDK has <strong>zero runtime dependencies</strong>. Nothing else
        enters your lockfile, there is no transitive tree to audit, and no
        surprise findings in SAST, SBOM, or <DocsCode>npm audit</DocsCode>{" "}
        pipelines. In organizations where every new dependency needs a security
        review, that means one small package to approve, once.
      </Callout>

      <DocsH2>Set up the client</DocsH2>
      <DocsP>
        Create one client for the Mocko instance your tests run against,
        typically in a shared test fixture module:
      </DocsP>
      <DocsCodeBlock language="ts">{`import { MockoClient } from '@mocko/sdk';

export const mocko = new MockoClient('http://localhost:8080');`}</DocsCodeBlock>
      <Callout variant="warning">
        The URL must point at the mock server (core, port 8080 by default), not
        at the control panel. The SDK talks to the same server your application
        requests hit.
      </Callout>

      <DocsH2>Reading and writing flags</DocsH2>
      <DocsP>
        The raw flag methods cover ad-hoc state. Values are serialized as JSON,
        so strings, numbers, booleans, arrays, and objects all work:
      </DocsP>
      <DocsCodeBlock language="ts">{`await mocko.setFlag('users:123:status', 'active');

const status = await mocko.getFlag<string>('users:123:status');

await mocko.setFlag('users:123:profile', {
  status: 'active',
  roles: ['admin', 'reviewer'],
});

await mocko.deleteFlag('users:123:status');`}</DocsCodeBlock>
      <DocsP>
        <DocsCode>getFlag</DocsCode> returns <DocsCode>undefined</DocsCode> when
        the flag does not exist, which is also what your templates see as a
        missing value.
      </DocsP>

      <DocsH2>A complete test</DocsH2>
      <DocsP>
        The pattern that makes this useful: the test arranges state through the
        SDK, the mock template reacts to it, and the system under test never
        knows the difference. Given this mock:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "GET /users/{id}" {
  format = "json"
  body = <<-EOF
    {{= $statusKey (append 'users:' request.params.id ':status')}}
    {
      "id": "{{request.params.id}}",
      "status": "{{default (getFlag $statusKey) 'active'}}"
    }
  EOF
}`}</DocsCodeBlock>
      <DocsP>a test can drive both sides of the scenario:</DocsP>
      <DocsCodeBlock language="ts">{`import { mocko } from './fixtures/mocko';

it('locks out suspended users', async () => {
  await mocko.setFlag('users:123:status', 'suspended');

  const response = await app.login('123');

  expect(response.status).toBe(403);
});`}</DocsCodeBlock>
      <DocsP>
        Flags written by templates with <DocsCode>setFlag</DocsCode> are
        readable through the SDK too, so assertions can also inspect state your
        mocks accumulated during the test.
      </DocsP>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          Flags written through the SDK get a default TTL of 300 seconds, so
          leftover test state expires on its own instead of leaking into later
          runs. TTLs are configurable per client, per definition, and per write;
          see <DocsLink href="/sdk/flag-definitions">Flag Definitions</DocsLink>
          .
        </li>
        <li>
          On shared instances, prefix keys per run (a worker id or a random
          suffix) to keep parallel test runs isolated, since flags are
          instance-wide.
        </li>
        <li>
          The SDK talks to a small, stable HTTP API on the mock server, so it
          works against any run mode: CLI, containers, or a cluster deployment.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        String keys sprinkled across tests get messy fast. Continue to{" "}
        <DocsLink href="/sdk/flag-definitions">Flag Definitions</DocsLink> for
        typed, reusable flag declarations.
      </DocsP>
    </DocsPage>
  );
}
