# Bigodon — Template Language Reference

Bigodon is the templating language used in Mocko mock bodies. It is Handlebars-like with async support.

## Quick start

```hbs
Hello, {{ name }}!                     {{! path expression }}
Hello, {{capitalize name}}!            {{! helper call }}
Hello, {{default name "stranger"}}!    {{! helper with literal arg }}
Hello, {{default (capitalize name) "stranger"}}!  {{! nested helpers }}
```

Spaces inside `{{ }}` are optional. Use `$this` to distinguish context paths from parameterless helpers:
```hbs
{{ uuid }}        {{! calls uuid() helper }}
{{ $this.uuid }}  {{! reads context field "uuid" }}
```

String literals accept `"double"`, `'single'`, or `` `backtick` `` quotes.

## Key syntax

| Construct | Syntax |
|-----------|--------|
| Path | `{{ user.name }}` |
| Comment | `{{! text }}` |
| Helper | `{{helperName arg1 arg2}}` |
| Variable assign | `{{= $var value}}` |
| Variable use | `{{ $var }}` |
| Conditional block | `{{#expr}}...{{/expr}}` |
| Negated block | `{{^expr}}...{{/expr}}` — `expr` must be a helper call or path, not a `$variable` (use `{{#unless $var}}` for variables) |
| Else | `{{else}}` or `{{else helperName args}}` |
| Loop (array) | `{{#array}}...{{/array}}` — context becomes item |
| Context block (object) | `{{#obj}}...{{/obj}}` — context becomes obj |
| Current item | `$this` |
| Parent context | `$parent` (chainable: `$parent.$parent.x`) |
| Root context | `$root` |
| Escape `{{` | `\{{` renders as literal `{{` |
| Escape `}}` | `\}}` renders as literal `}}` |
| Escape `\` | `\\` renders as literal `\` (only needed before `{{`) |

> Note: no space allowed between `{{` and `#`, `^`, `/`.

## Common patterns

**Conditional with else-if chain:**
```hbs
{{#is status "active"}}Active{{else is status "pending"}}Pending{{else}}Unknown{{/is}}
```

**Loop with index info (forEach):**
```hbs
{{#forEach items}}
  {{index}}: {{item}}{{^isLast}},{{/isLast}}
{{/forEach}}
```

**Variables for accumulation:**
```hbs
{{= $total 0}}
{{#numbers}}{{= $total (add $total $this)}}{{/numbers}}
Total: {{$total}}
```

**Prevent object from changing context (use `if`):**
```hbs
{{#if parent}}Hello, {{name}}!{{/if}}  {{! name stays root context }}
```

**Force primitive as context (use `with`):**
```hbs
{{#with items}}Count: {{length $this}}{{/with}}
```

## Reference files

- [BIGODON-HELPERS.md](BIGODON-HELPERS.md) — all available helpers by category

## Gotchas

- Date strings must include explicit time: `2024-01-01T00:00:00.000Z` ✓, `2024-01-01` ✗
- Variables have **global** scope — assignments inside blocks persist outside
- `{{#array}}` loops change context to each item; `{{#if array}}` does not
- `{{#$var}}` and `{{^$var}}` (variable blocks) are not valid — use `{{#if $var}}`, `{{#with $var}}`, `{{#each $var}}`, or `{{#unless $var}}` depending on intent; `{{#expr}}` / `{{^expr}}` only work when `expr` is a helper call or context path, not a `$variable`
- Any context-changing block (`{{#forEach}}`, `{{#each}}`, `{{#with}}`, `{{#obj}}`, direct object/array blocks like `{{#request.body}}`) puts the outer context out of direct scope inside — extract needed values to variables before entering (`{{= $x outer.value}}`) or reach back with `$root.outer.value`
- Close only the **outermost** helper in chained else-if blocks
- No bracket array access — `arr[0]` doesn't exist; use `{{itemAt arr 0}}`
- `pick` is the only way to access keys with dots in them: `{{pick params "user.name"}}` reads the literal key `"user.name"`, unlike `{{params.user.name}}` which traverses nested objects
