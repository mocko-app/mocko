---
name: mocko
description: Write and review Mocko mock HCL files for the dynamic HTTP mocking tool. Use when the user asks about Mocko mocks, .hcl files, mock templates, request context, flags, proxying, or how to structure mock responses. Also covers Bigodon templating as used in mock bodies.
---

# Mocko Skill

Mocko is a dynamic HTTP mocking tool. Mocks are defined in `.hcl` files and response bodies support [Bigodon](BIGODON.md) templating.

Mocko also has a TypeScript SDK (`@mocko/sdk`) for automated tests that need to read and write Mocko flags or fire callbacks through mocko-core. Use [SDK.md](SDK.md) when a user asks about SDK setup, `MockoClient`, typed flag definitions, SDK auth, test-side flag state, or firing callbacks from tests.

## CLI

```
Usage: mocko [options] [path to mocks folder]
Example: mocko -p 4000 mocks

Options:

  -h, --help       Shows this screen
  -v, --version    Shows the current version
  -w, --watch      Watches for file changes and restarts the server
  -p, --port       Port to serve the mocks (8080)
  -u, --url        URL to proxy requests when no mock is defined
  -t, --timeout    Max time to wait for a response from the proxied URL in millis (30000)
  --no-ui          Disables the control panel UI
  -r, --redis      Enables Redis mode using the provided Redis URL
  -P, --ui-port    Overrides the UI port (default: 6625)
```

### mocko validate

```
Usage: mocko validate [options] <path to mocks folder>
Example: mocko validate mocks

Options:

  -h, --help      Shows this screen
  -s, --strict    Treats warnings as errors
  -j, --json      Outputs machine-readable JSON
```

Checks every mock without starting a server and exits 1 when any is broken; built for CI, but also the fastest way to check mocks you just wrote or edited. Run it after changing `.hcl` files when a Mocko server isn't already running.

Errors (exit 1): HCL files that fail to parse (silently ignored at startup), invalid mock, host, or callback definitions, routes that fail to map (duplicated method+path, query params in the path), body templates that fail to compile (mock responds 500 to every request), mocks on the reserved `/__mocko__` path, and folders with no mocks. Note that template errors that only happen at render time (unknown helpers, bad `setStatus` values) are NOT caught, they still 500 at request time.

Warnings (exit 0 unless `--strict`): paths with `:param`, `*`, or `${param}` (Mocko parameters are `{param}`), mocks whose `host` matches no host block, and callbacks whose `host` matches no host block.

## Quick start

```hcl
mock "GET /users/{id}" {
  status = 200
  format = "json"
  body = <<-EOF
    {
      "id": "{{request.params.id}}",
      "name": "Alice"
    }
  EOF
}
```

## Mock block structure

```hcl
mock "METHOD /path/{param}" {
  status  = 200           # optional; default 201 for POST, 200 for others
  delay   = 500           # optional; ms (0–300000)
  enabled = true          # optional; default true
  name    = "my-mock"     # optional; label shown in UI
  host    = "host-slug"   # optional; route to a vhost (see HCL-REFERENCE.md)
  format  = "json"        # optional; sets Content-Type shorthand
  labels  = ["tag"]       # optional; for filtering when running with Mocko UI

  headers {
    X-Custom     = "value"
  }

  body = "..."            # Bigodon template string
}
```

Methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `*` (any).  
Paths: use `{param}` for path parameters (e.g. `/users/{id}`).

Prefer `format` over manually setting `Content-Type` for supported formats: `json`, `html`, `text`, `xml`, `javascript`, and `css`. If a user writes a supported `Content-Type` header such as `application/json`, suggest the equivalent `format` field. Do not combine `format` with an explicit `Content-Type` header.

## Template context

Inside `body`, the following context is available:

```hbs
{{request.params.id}}          {{! path parameter }}
{{request.query.page}}         {{! query param (string; array if the key repeats — see Gotchas) }}
{{request.headers.x-token}}    {{! request header (lowercase) }}
{{request.body.field}}         {{! parsed request body field }}
{{data.myblock.key}}           {{! data block values }}
```

## Common patterns

**Conditional response + override status:**
```hcl
body = <<-EOF
  {{#startsWith (downcase request.params.name) 'g'}}
    {
      "name": "{{capitalize request.params.name}}"
    }
  {{else}}
    {{setStatus 404}}
    {
      "error": "Not found"
    }
  {{/startsWith}}
EOF
```

**Default 404 when a loop finds no match:**
```hcl
body = <<-EOF
  {{= $id request.params.id}}
  {{= $found false}}
  {{#forEach data.products.product}}
    {{#is item.id $id}}
      {{= $found true}}
      {{item.content}}
    {{/is}}
  {{/forEach}}
  {{#unless $found}}
    {{setStatus 404}}
    {"error": "Not found"}
  {{/unless}}
EOF
```

> `$found` is a per-request variable — it resets on every call. Don't use `setFlag` for this; flags persist across requests.

**Accessing outer context from inside a loop (`$parent` / `$root`):**
```hcl
body = <<-EOF
  {{= $multiplier request.query.multiplier}}
  {{#forEach data.items.item}}
    {{! $multiplier works directly — variables are global scope }}
    {{! $parent.request.query.multiplier and $root.request.query.multiplier also work }}
    "{{item.name}}": {{multiply item.price $multiplier}}
  {{/forEach}}
EOF
```

> Inside any context-changing block, `$variables` remain accessible as-is (global scope). For context paths like `request` or `data`, use either a pre-extracted variable or `$root.request...` / `$parent.request...`. In nested loops, `$parent` walks up one level; `$root` always goes to the template root.

**Conditional proxy:**
```hcl
body = <<-EOF
  {{#is request.query.userId 1}}
    []
  {{else}}
    {{proxy}}
  {{/is}}
EOF
```

**Simulate instability:**
```hcl
delay = 1000
body = <<-EOF
  {{#lt (random 0 100) 30}}
    {{setStatus 500}}
    {
      "message": "Internal server error"
    }
  {{else}}
    {{proxy}}
  {{/lt}}
EOF
```

**Stateful user data with flags:**

Flag keys with `:` separators appear as nested folders in the Mocko UI.

```hcl
mock "PUT /users/{id}" {
  format = "json"
  body = <<-EOF
    {{= $nameKey (append 'users:' request.params.id ':name')}}
    {{= $emailKey (append 'users:' request.params.id ':email')}}
    {{setFlag $nameKey request.body.name}}
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
    {{= $nameKey (append 'users:' request.params.id ':name')}}
    {{= $emailKey (append 'users:' request.params.id ':email')}}
    {
      "id": "{{request.params.id}}",
      "name": "{{default (getFlag $nameKey) 'John Doe'}}",
      "email": "{{default (getFlag $emailKey) 'john@example.com'}}"
    }
  EOF
}
```

**Simulate a webhook (callback) after a mock responds:**
```hcl
callback "payment-approved" {
  host  = "backend"
  path  = "/payments/{{payload.id}}/status"
  delay = 2000
  body  = "{ \"id\": \"{{payload.id}}\", \"status\": \"APPROVED\" }"
}

mock "POST /payments" {
  format = "json"
  body = <<-EOF
    {{callback 'payment-approved' (object id=request.body.id)}}
    { "id": "{{request.body.id}}", "status": "PENDING" }
  EOF
}
```

> The mock responds immediately; the callback is delivered to the `backend` host 2s later, rendered at delivery time with `payload` and `data` in context (no `request`). See [HCL-REFERENCE.md](HCL-REFERENCE.md) for the stanza and [TEMPLATE-HELPERS.md](TEMPLATE-HELPERS.md) for trigger semantics.

**Paginated list:**
```hcl
mock "GET /items" {
  format = "json"
  body = <<-EOF
    {{= $page  (toInt (default request.query.page 1))}}
    {{= $size  (toInt (default request.query.size 10))}}
    {{= $start (multiply (subtract $page 1) $size)}}
    {{= $end   (add $start $size)}}
    {{= $all   data.items.item}}
    {
      "page":  {{$page}},
      "size":  {{$size}},
      "total": {{length $all}},
      "items": [
        {{#forEach (slice $all $start $end)}}
          { "id": {{item.id}}, "name": "{{item.name}}" }{{^isLast}},{{/isLast}}
        {{/forEach}}
      ]
    }
  EOF
}
```

> Pre-extract `data.items.item` to `$all` so you can use it twice (for `length` and `slice`) without retyping — and so the forEach iterates a plain array, not a nested path.

**Data-driven list and get:**

```hcl
data "products" {
  product {
    id      = 1
    content = <<-EOF
      {
        "name": "Widget",
        "price": 9.99
      }
    EOF
  }
  product {
    id      = 2
    content = <<-EOF
      {
        "name": "Gadget",
        "price": 24.99
      }
    EOF
  }
  product {
    id      = 3
    content = <<-EOF
      {
        "name": "Doohickey",
        "price": 4.99
      }
    EOF
  }
}

mock "GET /products" {
  format = "json"
  body = <<-EOF
    [
      {{#forEach data.products.product}}
        {{item.content}}{{^isLast}},{{/isLast}}
      {{/forEach}}
    ]
  EOF
}

mock "GET /products/{id}" {
  format = "json"
  body = <<-EOF
    {{= $id request.params.id}}
    {{= $found false}}
    {{#forEach data.products.product}}
      {{#is item.id $id}}{{! extracted to $id — request.params.id is out of scope inside forEach; $root.request.params.id would also work}}
        {{= $found true}}
        {{item.content}}
      {{/is}}
    {{/forEach}}
    {{#unless $found}}
      {{setStatus 404}}
      {"error": "Not found"}
    {{/unless}}
  EOF
}
```

## Debugging

When a mock isn't doing what you expect, work through these in order:

1. **Check mocko's stdout at load time.** Every load problem prints a `warn`, but the server starts and reports "Serving mocks" regardless — confirm your route appears in the `Mapping 'GET /path'` lines. The failure modes behave differently:
   - **Template compile error** (unclosed block, bad expression): warned with a line/column pointer, but the route **is still mapped** and returns a diagnostic 500 (`This mock has an invalid template body: …`) on every request.
   - **Invalid field value** (`status` outside 200–599, `delay` outside 0–300000): warned, and the mock is **silently not mapped** — requests fall through to the default proxy or 404, which is easy to misread as a routing problem.
   - **HCL syntax error**: a single terse `Failed to parse file 'path:line:col'` warn and **every mock in that file** is silently not mapped.
   - **Unknown helper names are not caught at load** — they fail per-request (see #2).

2. **Generic 500 (`An internal server error occurred`) on request.** A template error at render time: an unknown helper, `setStatus` given a non-number or a value outside 200–599, etc. The client body says nothing useful; the real message (`Helper foo not found`, `Status must be between 200 and 599`) is printed to the server log at request time.

3. **Output comes back unformatted / not pretty-printed.** The rendered body isn't valid JSON. Mocko logs an error line — `Response declared a JSON Content-Type, but the rendered body was not valid JSON…` — and returns the raw text. Usual causes: a stray trailing comma (classic `{{^isLast}}` inside `{{#each}}` — see Gotchas), missing quotes around a string, or an empty field because a path resolved to undefined (see #5).

4. **Sprinkle `{{log '...'}}`.** Prints to the server console at `info` level. Useful for confirming a branch was taken, bisecting a template, or dumping a value: `{{log (json someValue)}}`.

5. **Empty string where a value should be.** Usually the context changed under you. Look for a surrounding `{{#forEach}}`, `{{#each}}`, `{{#with}}`, or a direct object/array block (`{{#request.body}}…{{/request.body}}`). Inside those, `request`, `data`, etc. are out of scope — extract to `$variables` before entering, or use `$root.request...`.

6. **Wrong mock matched.** Exact paths beat parameterized paths; within the same specificity, first declaration wins. A deployed (UI/API) mock on the same route beats file mocks. A POST to a GET-only route is a plain 404 (not 405) — same symptom as no route at all.

## v1 → v2 migration

In Mocko v1, mock bodies used **Handlebars** (with handlebars-helpers). In v2, they use **Bigodon**. The syntax is mostly compatible but there are differences to watch for when migrating:

| v1 (Handlebars) | v2 (Bigodon) |
|-----------------|--------------|
| `../field` (parent scope) | `$parent.field` |
| `{{#each arr}}{{this}}` | `{{#each arr}}{{$this}}` |
| `{{#inArray arr item}}` | `{{#includes arr item}}` |
| `{{{triple-stash}}}` (unescaped) | `{{value}}` (no escaping in Bigodon) |

Handlebars hash arguments (`{{helper key=value}}`) parse unchanged in Bigodon as named parameters. Whether a helper reads them depends on the helper — Bigodon built-ins that don't use them silently ignore them.

See [BIGODON.md](BIGODON.md) for the full Bigodon syntax reference.

## Reference files

- [HCL-REFERENCE.md](HCL-REFERENCE.md) — data blocks, host blocks, callback blocks, match priority, multi-file layout
- [TEMPLATE-HELPERS.md](TEMPLATE-HELPERS.md) — Mocko-specific helpers (setStatus, proxy, flags, callback, etc.)
- [BIGODON.md](BIGODON.md) — full Bigodon syntax and built-in helpers
- [BIGODON-HELPERS.md](BIGODON-HELPERS.md) — all built-in helpers by category
- [SDK.md](SDK.md) — TypeScript SDK setup, raw flags, typed flag definitions, TTL, callbacks, and auth

## Gotchas

- Request headers are accessed **lowercase** regardless of how they were sent
- `setStatus`/`setHeader` render empty string — they won't pollute the body
- `{{proxy}}` halts template execution; anything after it is ignored
- Exact paths match before parameterized ones (`/cats/george` wins over `/cats/{name}`)
- Named sub-blocks in `data` are **always arrays**, even if defined only once — `data.block.subblock` is `[{...}]`, not `{...}`; access the first element with `{{pick (itemAt data.block.subblock 0) 'field'}}` or iterate with `{{#forEach}}`; dot-chaining on helper results (`(itemAt ...).field`) is not valid Bigodon syntax. Flat key-value pairs (`key = "value"` directly in the data block) work as plain paths.
- `{{#each}}` and `{{#forEach}}` are **not interchangeable**: `isLast`/`isFirst`/`index`/`total` only exist inside `{{#forEach}}`; using `{{^isLast}}` inside `{{#each}}` silently always renders (isLast is undefined → falsy → negated block fires every iteration → trailing comma). Also, `$this` inside `{{#forEach}}` is the entire context object `{item, index, …}`, not the current element — use `{{item}}` instead. **Always use `forEach` in mock bodies that produce comma-separated output** (i.e. almost any JSON array).
- Any block that changes context (`{{#forEach}}`, `{{#each}}`, `{{#with}}`, and direct object/array blocks like `{{#request.body}}{{name}}{{/request.body}}`) puts `request`, `data`, etc. out of scope inside the block; extract values to variables before entering (`{{= $id request.params.id}}`) or use `$root.request.params.id`
- Valid JSON bodies are automatically pretty-printed — don't worry about whitespace and indentation in the template. If the rendered body isn't valid JSON, mocko logs an error and returns the raw text untouched (a useful signal that your template has a JSON bug — usually a stray comma or an empty field)
- Interpolation does **no escaping**: `"name": "{{request.body.name}}"` breaks (invalid JSON, see Debugging #3) if the value contains a quote or newline. Fine when you control the data; when echoing arbitrary input (request bodies, proxied data), use `"name": {{json request.body.name}}` — **without** surrounding quotes, `json` emits its own. Also remember path params are always strings: write `"id": "{{request.params.id}}"`, quoted; unquoted only parses when the value happens to be numeric
- Bare `{{` or `}}` in a body that isn't part of a template expression will fail to parse. Easy to hit by accident when a JSON payload ends in nested closing braces (`{"user":{"id":1}}`). The template needs to see `\{{` / `\}}`, and the backslash count depends on the HCL body form: in a heredoc (`<<-EOF`), write `\{{` and `\}}` as-is; in a double-quoted string, write `\\{{` and `\\}}` because quoted HCL strings consume one `\` (heredocs don't). Getting it backwards fails either way: the doubled form in a heredoc is a template compile error (500), and the single form in a quoted string is an HCL parse error that silently drops the whole file
- A repeated query key produces an **array**: with `?tag=a&tag=b`, `request.query.tag` is `["a","b"]` — but with a single `?tag=a` it's a plain string. Direct interpolation of the array renders the literal text `[object Array]`, while array helpers misbehave on the string case (`join`/`itemAt` render empty, `length` counts characters). `{{#forEach}}` handles both shapes — it wraps a scalar into a single iteration: `[{{#forEach request.query.tag}}"{{item}}"{{^isLast}},{{/isLast}}{{/forEach}}]` renders `["a","b"]` and `["only"]`. To branch on shape, `{{typeof request.query.tag}}` is `object` for an array, `string` for a single value
- `{{default a b}}` only falls back to `b` when `a` is `null` or `undefined`. Empty strings (`""`) and `0` pass through — so `{{default request.query.foo 'x'}}` on `?foo=` renders empty, not `'x'`. Use `{{#unless}}` or a length check for "blank" semantics
- Callback templates render at **delivery** time with `{payload, data}` in context — `request` is gone by then; put anything you need from the request into the trigger's payload. `setStatus`, `setHeader`, `proxy`, and `callback` are unavailable in callback bodies (no chaining)
