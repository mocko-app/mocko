# Mocko Template Helpers

These helpers are available **in addition** to all standard Bigodon helpers (see [BIGODON-HELPERS.md](BIGODON-HELPERS.md)).

## Response helpers

These helpers render as empty string — they're side-effect only and won't add content to the body.

| Helper | Signature | Description |
|--------|-----------|-------------|
| `setStatus` | `setStatus code` | Override the response status code; accepts number or numeric string, 200–599 only (anything else → generic 500 to the client, reason in the server log) |
| `setHeader` | `setHeader 'name' 'value'` | Add or override a response header; case-insensitive, merges with `headers {}` block |
| `proxy` | `proxy ['url']` | Forward the current request (same method, headers, body, **path**, query) to the default backend, or to a URL/named host used as the **base** — the request path is appended. **Halts template execution.** |
| `log` | `log 'message'` | Print to server console; useful for debugging templates |

### `proxy` variants

```hbs
{{proxy}}                         {{! proxy to default backend (PROXY_URL env) }}
{{proxy 'http://other:3000'}}     {{! proxy to base URL — request path appended }}
{{proxy 'host-slug'}}             {{! proxy to a named host block }}
{{proxy '@host-slug'}}            {{! same, explicit form (2.2+ only), errors clearly when the slug doesn't match }}
```

> The URL is treated as a base. `GET /users/42` with `{{proxy 'http://other:3000'}}` → `GET http://other:3000/users/42`.

## Flag helpers

Flags are persistent key-value state scoped to the Mocko instance. They survive across requests and are useful for simulating stateful APIs.

| Helper | Signature | Description |
|--------|-----------|-------------|
| `setFlag` | `setFlag 'key' value [ttlMs]` | Set a flag; optional TTL in milliseconds |
| `getFlag` | `getFlag 'key'` | Retrieve flag value (empty string if not set) |
| `hasFlag` | `hasFlag 'key'` | Returns `true`/`false` — use in blocks for conditionals |
| `delFlag` | `delFlag 'key'` | Delete a flag |

> Setting a flag again with a TTL replaces any running TTL; setting it again without one keeps the existing TTL counting down — it does not make the flag permanent.

### Flag keys and the UI

Flag keys containing `:` are displayed as nested folders in the Mocko UI. Use this to organise per-resource flags:

```
users:42:name    →  users / 42 / name
users:42:email   →  users / 42 / email
```

Build keys dynamically with `append` and store them in a variable so the key is only written once:

```hbs
{{= $nameKey (append 'users:' request.params.id ':name')}}
{{setFlag $nameKey "Alice"}}
{{getFlag $nameKey}}
```

### Flag example — mutable user data

```hcl
mock "PUT /users/{id}" {
  format = "json"
  body = <<-EOF
    {{= $nameKey  (append 'users:' request.params.id ':name')}}
    {{= $emailKey (append 'users:' request.params.id ':email')}}
    {{setFlag $nameKey  request.body.name}}
    {{setFlag $emailKey request.body.email}}
    {
      "id": "{{request.params.id}}",
      "name": "{{getFlag $nameKey}}",
      "email": "{{getFlag $emailKey}}"
    }
  EOF
}

mock "GET /users/{id}" {
  format = "json"
  body = <<-EOF
    {{= $nameKey  (append 'users:' request.params.id ':name')}}
    {{= $emailKey (append 'users:' request.params.id ':email')}}
    {
      "id": "{{request.params.id}}",
      "name": "{{default (getFlag $nameKey) 'John Doe'}}",
      "email": "{{default (getFlag $emailKey) 'john@example.com'}}"
    }
  EOF
}
```

## Callback helper

Schedules delivery of a [callback block](HCL-REFERENCE.md) (a simulated webhook). Renders as empty string.

| Helper | Signature | Description |
|--------|-----------|-------------|
| `callback` | `callback 'slug' [payload] [delay=ms]` | Schedule the callback to be delivered after this mock responds |

```hbs
{{callback 'payment-approved'}}                                        {{! stanza defaults }}
{{callback 'payment-approved' delay=5000}}                             {{! delay override }}
{{callback 'payment-approved' (object id=request.body.id)}}            {{! object payload }}
{{callback 'payment-approved' 'EXPIRED' delay=5000}}                   {{! scalar payloads work too }}
```

- The optional positional argument is the **payload** — any JSON-serializable value, available as `payload` in the callback's templates at delivery time. Positional arguments must come before named ones.
- Delay precedence: helper `delay=` > stanza `delay` > 0. The callback is enqueued when the mock responds, so the delay is measured from the response, and delivery never holds the response up.
- Trigger-time validation: an unknown slug, a host with no destination, or a non-serializable payload throws — the mock responds 500, like `{{proxy '@bad-slug'}}`.
- **Rendered at fire time, not trigger time**: `body`, `path`/`url`, and header values render when the callback actually fires, with context `{payload, data}`. Definition or host edits made while the callback is pending apply; if the definition was deleted meanwhile, the delivery is dropped with a warning.
- Callback templates can use flag helpers (`setFlag` at delivery time is the idiomatic state-transition trigger) and everything else **except** `setStatus`, `setHeader`, `proxy`, and `callback` itself — callbacks cannot chain callbacks.
- Delivery failures (non-2xx, network errors) are logged with the slug and dropped; there are no automatic retries.

### Callback example — payment flow

```hcl
callback "payment-approved" {
  host  = "backend"
  path  = "/payments/{{payload.id}}/status"
  delay = 2000
  body  = <<-EOF
    {{setFlag (append 'payments:' payload.id ':status') 'APPROVED'}}
    { "id": "{{payload.id}}", "status": "APPROVED" }
  EOF
}

mock "POST /payments" {
  format = "json"
  body = <<-EOF
    {{callback 'payment-approved' (object id=request.body.id)}}
    { "id": "{{request.body.id}}", "status": "PENDING" }
  EOF
}
```

The mock responds `PENDING` immediately; two seconds later Mocko POSTs the approval to the backend and flips the flag, like a real payment provider would.

## Template context reference

```hbs
request.params.<name>      path parameters from {name} in the route
request.query.<name>       query string parameters
request.headers.<name>     request headers — always lowercase
request.body.<field>       parsed JSON/form body fields
data.<block>.<key>         values from data blocks in .hcl files
```

All standard Bigodon helpers work on these values — string manipulation, math, conditionals, loops, etc. See [BIGODON-HELPERS.md](BIGODON-HELPERS.md).
