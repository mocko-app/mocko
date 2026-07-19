# SDK Reference For Agents

Use this only for Mocko TypeScript SDK questions. Keep answers/code focused on `@mocko/sdk`, flags, and callbacks unless the user explicitly asks about future SDK work.

## What Exists

- Package: `@mocko/sdk`
- Runtime target: Node 20+
- Main class: `MockoClient`
- Scope today: flags and callbacks
- Talks to: mocko-core URL, not mocko-control URL
- Not implemented: mock references, tap/collect, scenarios, core version compatibility checks

## Client

```ts
import { MockoClient } from '@mocko/sdk';

const mocko = new MockoClient('http://localhost:8080');
```

Options:

```ts
new MockoClient(url, {
  defaultFlagTtl?: number, // seconds, default 300
  secret?: string,         // only needed for MANAGEMENT_AUTH_MODE=all
});
```

## Raw Flags

```ts
await mocko.setFlag<T>(key, value, ttl?);
const value = await mocko.getFlag<T>(key); // T | undefined
await mocko.deleteFlag(key);
```

Notes:

- Values are JSON serialized.
- Supports strings, numbers, booleans, arrays, and objects.
- `undefined` cannot be set.
- `getFlag` returns `undefined` for missing flags.
- Prefer random/resource-specific key parts in parallel tests.

## Typed Flags

```ts
const flag = mocko.defineFlag<TValue>('Human description').pattern(pattern);
```

Pattern dispatch:

```ts
// 0 placeholders
const enabled = mocko.defineFlag<boolean>('Enabled').pattern('feature:enabled');
await enabled.set(true);
await enabled.get();
await enabled.delete();
enabled.key();

// 1 placeholder: positional string
const status = mocko.defineFlag<string>('Status').pattern('users:{id}:status');
await status.set('123', 'active');
await status.get('123');
await status.delete('123');
status.key('123');

// 2+ placeholders: params object
const pref = mocko
  .defineFlag<string>('Preference')
  .pattern('users:{id}:preferences:{preference}');
await pref.set({ id: '123', preference: 'language' }, 'en');
await pref.get({ id: '123', preference: 'language' });
await pref.delete({ id: '123', preference: 'language' });
pref.key({ id: '123', preference: 'language' });
```

Typed TTL:

```ts
const shortLived = status.ttl(30);
await shortLived.set('123', 'active');
```

## Callbacks

Fire and manage [callback blocks](HCL-REFERENCE.md) defined in the mocks:

```ts
const pending = await mocko.fireCallback('payment-approved', { id: 'pay-42' });
await mocko.fireCallback('payment-approved', { id: 'pay-43' }, { delay: 60_000 });

const list = await mocko.listPendingCallbacks(); // PendingCallback[], ordered by dueAt
await mocko.firePendingCallback(pending.id);     // fire now, skipping the delay
await mocko.cancelPendingCallback(pending.id);
await mocko.clearPendingCallbacks();             // test isolation
```

Notes:

- `fireCallback` fires immediately by default; the stanza `delay` only applies to mock-triggered callbacks. Pass `{ delay }` (ms) to schedule instead.
- The payload must be JSON serializable; it is available as `payload` in the callback's templates, which render at delivery time.
- In tests, never sleep through a delay: schedule, assert on `listPendingCallbacks()`, then `firePendingCallback(id)` to deliver immediately.
- `clearPendingCallbacks()` in a `beforeEach` keeps parallel-unsafe pending state out of other tests.
- Unknown slugs and hosts without destinations throw (`Mocko failed to fire callback "slug": HTTP 404` / `422`).

## Auth Rules

Mocko core `MANAGEMENT_AUTH_MODE`:

- `none`: SDK flags and callbacks need no secret.
- `deploy`: SDK flags and callbacks need no secret; deploy/mocks/hosts stay protected.
- `all`: SDK flags and callbacks require `secret`.

For `all` mode:

```ts
const mocko = new MockoClient('http://localhost:8080', {
  secret: process.env.MOCKO_SECRET,
});
```

The SDK sends `Authorization: Bearer <secret>` on every request.

## Template Interop

SDK and templates share the same flag store.

Use dynamic keys in mocks with `append`:

```hcl
mock "PUT /users/{id}" {
  body = <<-EOF
    {{= $statusKey (append 'users:' request.params.id ':status')}}
    {{setFlag $statusKey request.body.status}}
  EOF
}

mock "GET /users/{id}" {
  body = <<-EOF
    {{= $statusKey (append 'users:' request.params.id ':status')}}
    {{getFlag $statusKey}}
  EOF
}
```

For object/array flags in templates:

```hcl
{{pick (getFlag $profileKey) 'status'}}
{{itemAt (getFlag $rolesKey) 0}}
```

