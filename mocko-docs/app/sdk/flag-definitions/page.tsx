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
  title: "Flag Definitions",
  description:
    "Declare typed, reusable Mocko flags with defineFlag and key patterns, and share them across your whole test suite.",
};

export default function SdkFlagDefinitionsPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Testing with the SDK</DocsEyebrow>
      <DocsTitle>Flag Definitions</DocsTitle>
      <DocsLead>
        Raw flag calls repeat key strings and value types across every test that
        touches them. A flag definition declares the key pattern and the type
        once, and every test gets autocompletion, type checking, and one place
        to change when the key structure evolves.
      </DocsLead>

      <DocsH2>Defining a flag</DocsH2>
      <DocsP>
        <DocsCode>defineFlag</DocsCode> takes a human description and a key
        pattern. Placeholders in braces become parameters:
      </DocsP>
      <DocsCodeBlock>{`const userStatus = mocko
  .defineFlag<string>('User status')
  .pattern('users:{id}:status');

await userStatus.set('123', 'active');

expect(await userStatus.get('123')).toBe('active');
expect(userStatus.key('123')).toBe('users:123:status');

await userStatus.delete('123');`}</DocsCodeBlock>
      <DocsP>
        The type parameter flows through everything: <DocsCode>get</DocsCode>{" "}
        returns <DocsCode>string | undefined</DocsCode> here, and{" "}
        <DocsCode>set</DocsCode> rejects anything that is not a string.
      </DocsP>

      <DocsH2>Zero, one, or many placeholders</DocsH2>
      <DocsP>
        The pattern decides the call shape. No placeholders means no key
        arguments:
      </DocsP>
      <DocsCodeBlock>{`const checkoutEnabled = mocko
  .defineFlag<boolean>('Checkout enabled')
  .pattern('features:checkout');

await checkoutEnabled.set(true);
expect(await checkoutEnabled.get()).toBe(true);`}</DocsCodeBlock>
      <DocsP>
        One placeholder takes a single positional string, as in{" "}
        <DocsCode>userStatus</DocsCode> above. Two or more take a params object,
        so call sites stay unambiguous:
      </DocsP>
      <DocsCodeBlock>{`const userPreference = mocko
  .defineFlag<string>('User preference')
  .pattern('users:{id}:preferences:{preference}');

await userPreference.set({ id: '123', preference: 'language' }, 'en');`}</DocsCodeBlock>

      <DocsH2>A flags module for the suite</DocsH2>
      <DocsP>
        Definitions shine when they live in one shared module next to the
        client. It reads like a catalog of everything your mocked environment
        can simulate:
      </DocsP>
      <DocsCodeBlock>{`// fixtures/mocko.ts
import { MockoClient } from '@mocko/sdk';

export const mocko = new MockoClient('http://localhost:8080');

export const userStatus = mocko
  .defineFlag<string>('User status served by GET /users/:id')
  .pattern('users:{id}:status');

export const paymentOutage = mocko
  .defineFlag<boolean>('Forces 503 on all payment endpoints')
  .pattern('outages:payments');`}</DocsCodeBlock>
      <DocsCodeBlock>{`import { paymentOutage } from './fixtures/mocko';

it('retries when the payment provider is down', async () => {
  await paymentOutage.set(true);

  const result = await app.checkout(cart);

  expect(result.attempts).toBeGreaterThan(1);
});`}</DocsCodeBlock>
      <Callout variant="tip">
        Keep the description honest about which mocks read the flag, like the
        examples above. Six months later, that string is how someone finds the
        mock behind a mysterious test failure.
      </Callout>

      <DocsH2>TTLs</DocsH2>
      <DocsP>
        SDK-written flags default to a 300 second TTL, so test state cleans
        itself up. Override it at whichever level fits:
      </DocsP>
      <DocsCodeBlock>{`// Client-wide default, in seconds
const mocko = new MockoClient('http://localhost:8080', {
  defaultFlagTtl: 60,
});

// Per definition: derives a new definition with its own TTL
const shortLivedStatus = userStatus.ttl(30);
await shortLivedStatus.set('123', 'active');

// Per raw write
await mocko.setFlag('users:123:status', 'active', 30);`}</DocsCodeBlock>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          <DocsCode>ttl()</DocsCode> returns a new definition; the original is
          unchanged, so a shared catalog stays safe to derive from inside one
          test.
        </li>
        <li>
          <DocsCode>key(...)</DocsCode> renders the concrete key without
          touching the server, useful for assertions and for debugging what a
          pattern produces.
        </li>
        <li>
          Definitions are client-side declarations only; nothing is registered
          on the Mocko instance. The server just sees flag reads and writes.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        Local instances need no credentials, but shared ones might. Continue to{" "}
        <DocsLink href="/sdk/auth">Auth and Deployment</DocsLink>.
      </DocsP>
    </DocsPage>
  );
}
