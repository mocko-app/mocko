# Mocko HCL Reference

## Mock block fields

| Field | Type | Constraint | Default | Description |
|-------|------|-----------|---------|-------------|
| `status` | number | 200–599 | 201 (POST), 200 (others) | HTTP response status |
| `delay` | number | 0–300000 ms | none | Artificial delay before responding (applies to proxied responses too) |
| `body` | string | — | `""` | Response body; Bigodon template |
| `format` | string | json, html, text, xml, javascript, css | none | Sets Content-Type header shorthand. Cannot be combined with an explicit Content-Type header. |
| `headers` | block | key = "value" | `{}` | Response headers |
| `name` | string | — | file path | Label shown in UI |
| `enabled` | boolean | — | `true` | Disable without deleting |
| `host` | string | valid slug | none | Route to a named vhost |
| `labels` | array of strings | — | `[]` | Tags for filtering in UI |

## Format shorthand

Use `format` instead of setting `Content-Type` manually for supported response types:

```hcl
mock "GET /users" {
  format = "json"
  body = <<-EOF
    [{ "id": 1 }]
  EOF
}
```

| format | Content-Type |
|--------|--------------|
| `json` | `application/json` |
| `html` | `text/html` |
| `text` | `text/plain` |
| `xml` | `application/xml` |
| `javascript` | `text/javascript` |
| `css` | `text/css` |

`format` cannot be combined with a `Content-Type` header.

## Multi-line body (heredoc)

```hcl
# Strips leading indentation (preferred)
body = <<-EOF
  { "name": "{{request.params.name}}" }
EOF

# Preserves indentation exactly
body = <<EOF
{ "name": "{{request.params.name}}" }
EOF
```

## Data blocks

Shared data available in all mocks as `{{data.<block>.<key>}}`.

Flat key-value pairs are accessed directly:
```hcl
data "settings" {
  base_url = "https://api.example.com"
  version  = "v2"
}

mock "GET /info" {
  body = "{{data.settings.base_url}}"
}
```

**Named sub-blocks are always arrays** — even when defined only once:
```hcl
data "cats" {
  cat { name = "Alice" }
  cat { name = "Bob" }
}
# Access by index: {{pick (itemAt data.cats.cat 0) 'name'}}, {{pick (itemAt data.cats.cat 1) 'name'}}
# Or iterate:      {{#forEach data.cats.cat}}{{item.name}}{{/forEach}}
```

`data.cats.cat` is an array regardless of how many `cat` blocks are defined. A single block is still `[{ name: "Alice" }]`, not `{ name: "Alice" }` — access it with `{{pick (itemAt data.cats.cat 0) 'name'}}`, not `{{data.cats.cat.name}}`.

Data blocks merge across all `.hcl` files loaded.

## Host blocks (vhosts)

```hcl
host "backend" {
  name        = "My Backend"           # optional label
  source      = "api.example.com"      # incoming Host header to match
  destination = "http://backend:3000"  # proxy destination
}

# Assign a mock to this host
mock "GET /users" {
  host = "backend"
  body = "..."
}

# Proxy to a named host from the template
mock "GET /passthrough" {
  body = "{{proxy '@backend'}}"
}
```

## Match priority

1. **Exact path** beats **parameterized path** (`/cats/george` wins over `/cats/{name}`)
2. **DEPLOYED** mocks (UI/API) beat **FILE** mocks on the same method + path
3. First match wins — order within a file matters for same-specificity routes

## File layout

```
mocks/
  ├── users.hcl         # mocks for /users
  ├── posts.hcl         # mocks for /posts
  └── shared/
      └── data.hcl      # data blocks shared across all mocks
```

- All `.hcl` files are merged at load time
- Hidden files/directories (starting with `.`) are ignored
- File mocks are watched for changes when running with `--watch`
