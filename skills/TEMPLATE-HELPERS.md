# Mocko Template Helpers

These helpers are available **in addition** to all standard Bigodon helpers (see [BIGODON-HELPERS.md](BIGODON-HELPERS.md)).

## Response helpers

These helpers render as empty string — they're side-effect only and won't add content to the body.

| Helper | Signature | Description |
|--------|-----------|-------------|
| `setStatus` | `setStatus code` | Override the response status code; accepts number or numeric string |
| `setHeader` | `setHeader 'name' 'value'` | Add or override a response header; case-insensitive, merges with `headers {}` block |
| `proxy` | `proxy ['url']` | Forward the current request (same method, headers, body, **path**, query) to the default backend, or to a URL/named host used as the **base** — the request path is appended. **Halts template execution.** |
| `log` | `log 'message'` | Print to server console; useful for debugging templates |

### `proxy` variants

```hbs
{{proxy}}                         {{! proxy to default backend (PROXY_URL env) }}
{{proxy 'http://other:3000'}}     {{! proxy to base URL — request path appended }}
{{proxy '@host-slug'}}            {{! proxy to a named host block }}
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
      "id": {{request.params.id}},
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
      "id": {{request.params.id}},
      "name": "{{default (getFlag $nameKey) 'John Doe'}}",
      "email": "{{default (getFlag $emailKey) 'john@example.com'}}"
    }
  EOF
}
```

## Template context reference

```hbs
request.params.<name>      path parameters from {name} in the route
request.query.<name>       query string parameters
request.headers.<name>     request headers — always lowercase
request.body.<field>       parsed JSON/form body fields
data.<block>.<key>         values from data blocks in .hcl files
```

All standard Bigodon helpers work on these values — string manipulation, math, conditionals, loops, etc. See [BIGODON-HELPERS.md](BIGODON-HELPERS.md).
