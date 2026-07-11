---
name: mocko
description: Write and review Mocko mock HCL files for the dynamic HTTP mocking tool. Use when the user asks about Mocko mocks, .hcl files, mock templates, request context, flags, proxying, or how to structure mock responses. Also covers Bigodon templating as used in mock bodies.
---

# Mocko Skill

Mocko is a dynamic HTTP mocking tool. Mocks are defined in `.hcl` files and response bodies support [Bigodon](BIGODON.md) templating.

Mocko also has a TypeScript SDK (`@mocko/sdk`) for automated tests that need to read and write Mocko flags through mocko-core. Use [SDK.md](SDK.md) when a user asks about SDK setup, `MockoClient`, typed flag definitions, SDK auth, or test-side flag state.

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

## Quick start

```hcl
mock "GET /users/{id}" {
  status = 200
  format = "json"
  body = <<-EOF
    {
      "id": {{request.params.id}},
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
{{request.query.page}}         {{! query string }}
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
      "id": {{request.params.id}},
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
      "id": {{request.params.id}},
      "name": "{{default (getFlag $nameKey) 'John Doe'}}",
      "email": "{{default (getFlag $emailKey) 'john@example.com'}}"
    }
  EOF
}
```

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

1. **Check mocko's stdout.** Template compile errors print with a line/column pointer at load time — if a mock isn't being served, the error is there.

2. **Output comes back unformatted / not pretty-printed.** The rendered body isn't valid JSON. Mocko logs an error line — `Response declared a JSON Content-Type, but the rendered body was not valid JSON…` — and returns the raw text. Usual causes: a stray trailing comma (classic `{{^isLast}}` inside `{{#each}}` — see Gotchas), missing quotes around a string, or an empty field because a path resolved to undefined (see #4).

3. **Sprinkle `{{log '...'}}`.** Prints to the server console at `info` level. Useful for confirming a branch was taken, bisecting a template, or dumping a value: `{{log (json someValue)}}`.

4. **Empty string where a value should be.** Usually the context changed under you. Look for a surrounding `{{#forEach}}`, `{{#each}}`, `{{#with}}`, or a direct object/array block (`{{#request.body}}…{{/request.body}}`). Inside those, `request`, `data`, etc. are out of scope — extract to `$variables` before entering, or use `$root.request...`.

5. **Wrong mock matched.** Exact paths beat parameterized paths; within the same specificity, first declaration wins. A deployed (UI/API) mock on the same route beats file mocks.

## v1 → v2 migration

In Mocko v1, mock bodies used **Handlebars** (with handlebars-helpers). In v2, they use **Bigodon**. The syntax is mostly compatible but there are differences to watch for when migrating:

| v1 (Handlebars) | v2 (Bigodon) |
|-----------------|--------------|
| `../field` (parent scope) | `$parent.field` |
| `{{#each arr}}{{this}}` | `{{#each arr}}{{$this}}` |
| `{{#inArray arr item}}` | `{{#includes arr item}}` |
| `{{{triple-stash}}}` (unescaped) | `{{value}}` (no escaping in Bigodon) |

See [BIGODON.md](BIGODON.md) for the full Bigodon syntax reference.

## Reference files

- [HCL-REFERENCE.md](HCL-REFERENCE.md) — data blocks, host blocks, match priority, multi-file layout
- [TEMPLATE-HELPERS.md](TEMPLATE-HELPERS.md) — Mocko-specific helpers (setStatus, proxy, flags, etc.)
- [BIGODON.md](BIGODON.md) — full Bigodon syntax and built-in helpers
- [BIGODON-HELPERS.md](BIGODON-HELPERS.md) — all built-in helpers by category
- [SDK.md](SDK.md) — TypeScript SDK setup, raw flags, typed flag definitions, TTL, and auth

## Gotchas

- Request headers are accessed **lowercase** regardless of how they were sent
- `setStatus`/`setHeader` render empty string — they won't pollute the body
- `{{proxy}}` halts template execution; anything after it is ignored
- Exact paths match before parameterized ones (`/cats/george` wins over `/cats/{name}`)
- Named sub-blocks in `data` are **always arrays**, even if defined only once — `data.block.subblock` is `[{...}]`, not `{...}`; access the first element with `{{pick (itemAt data.block.subblock 0) 'field'}}` or iterate with `{{#forEach}}`; dot-chaining on helper results (`(itemAt ...).field`) is not valid Bigodon syntax. Flat key-value pairs (`key = "value"` directly in the data block) work as plain paths.
- `{{#each}}` and `{{#forEach}}` are **not interchangeable**: `isLast`/`isFirst`/`index`/`total` only exist inside `{{#forEach}}`; using `{{^isLast}}` inside `{{#each}}` silently always renders (isLast is undefined → falsy → negated block fires every iteration → trailing comma). Also, `$this` inside `{{#forEach}}` is the entire context object `{item, index, …}`, not the current element — use `{{item}}` instead. **Always use `forEach` in mock bodies that produce comma-separated output** (i.e. almost any JSON array).
- Any block that changes context (`{{#forEach}}`, `{{#each}}`, `{{#with}}`, and direct object/array blocks like `{{#request.body}}{{name}}{{/request.body}}`) puts `request`, `data`, etc. out of scope inside the block; extract values to variables before entering (`{{= $id request.params.id}}`) or use `$root.request.params.id`
- Valid JSON bodies are automatically pretty-printed — don't worry about whitespace and indentation in the template. If the rendered body isn't valid JSON, mocko logs an error and returns the raw text untouched (a useful signal that your template has a JSON bug — usually a stray comma or an empty field)
- Bare `{{` or `}}` in a body that isn't part of a template expression will fail to parse. Easy to hit by accident when a JSON payload ends in nested closing braces (`{"user":{"id":1}}`). Escape with `\{{` and `\}}` — in HCL string literals, write `\\{{` and `\\}}` because HCL itself consumes one `\`
- `{{default a b}}` only falls back to `b` when `a` is `null` or `undefined`. Empty strings (`""`) and `0` pass through — so `{{default request.query.foo 'x'}}` on `?foo=` renders empty, not `'x'`. Use `{{#unless}}` or a length check for "blank" semantics
