# @mocko/sdk

TypeScript SDK for using Mocko from automated tests.

The SDK currently focuses on Mocko flags: shared state that tests and Mocko templates can read and write through mocko-core.

## Installation

```sh
npm install @mocko/sdk
```

Requires Node.js 20 or newer.

## Setup

Create one client for the Mocko core instance used by your test environment:

```ts
import { MockoClient } from '@mocko/sdk';

export const mocko = new MockoClient('http://localhost:8080');
```

The URL must point to mocko-core, not mocko-control.

## Raw Flags

Use raw flags for ad-hoc state:

```ts
await mocko.setFlag('users:123:status', 'active');

const status = await mocko.getFlag<string>('users:123:status');

await mocko.deleteFlag('users:123:status');
```

Values are serialized as JSON, so strings, numbers, booleans, arrays, and objects are supported:

```ts
await mocko.setFlag('users:123:profile', {
  status: 'active',
  roles: ['admin', 'reviewer'],
});
```

`getFlag(...)` returns `undefined` when the flag does not exist.

## Typed Flag Definitions

Define reusable typed flags once and use them across tests:

```ts
const userStatus = mocko
  .defineFlag<string>('User status')
  .pattern('users:{id}:status');

await userStatus.set('123', 'active');

expect(await userStatus.get('123')).toBe('active');
expect(userStatus.key('123')).toBe('users:123:status');

await userStatus.delete('123');
```

Patterns with no placeholders use no key arguments:

```ts
const checkoutEnabled = mocko
  .defineFlag<boolean>('Checkout enabled')
  .pattern('features:checkout');

await checkoutEnabled.set(true);
expect(await checkoutEnabled.get()).toBe(true);
```

Patterns with one placeholder use one positional string:

```ts
const userPlan = mocko
  .defineFlag<string>('User plan')
  .pattern('users:{id}:plan');

await userPlan.set('123', 'pro');
```

Patterns with two or more placeholders use a params object:

```ts
const userPreference = mocko
  .defineFlag<string>('User preference')
  .pattern('users:{id}:preferences:{preference}');

await userPreference.set({ id: '123', preference: 'language' }, 'en');
```

## TTL

Flags written through the SDK use a default TTL of 300 seconds.

Override the client default:

```ts
const mocko = new MockoClient('http://localhost:8080', {
  defaultFlagTtl: 60,
});
```

Override one raw write:

```ts
await mocko.setFlag('users:123:status', 'active', 30);
```

Override a typed flag definition:

```ts
const shortLivedStatus = userStatus.ttl(30);

await shortLivedStatus.set('123', 'active');
```

## Auth

By default, Mocko uses `MANAGEMENT_AUTH_MODE=deploy`. In that mode, flag endpoints are open and the SDK does not need a secret.

When mocko-core runs with `MANAGEMENT_AUTH_MODE=all`, pass the deploy secret:

```ts
const mocko = new MockoClient('http://localhost:8080', {
  secret: process.env.MOCKO_SECRET,
});
```

The SDK sends `Authorization: Bearer <secret>` on flag requests when `secret` is provided.

## Mock Template Interop

SDK-written flags are available to Mocko templates:

```hcl
mock "GET /users/{id}" {
  body = <<-EOF
    {{= $statusKey (append 'users:' request.params.id ':status')}}
    {{getFlag $statusKey}}
  EOF
}
```

Flags written by templates with `setFlag` are readable through the SDK.
