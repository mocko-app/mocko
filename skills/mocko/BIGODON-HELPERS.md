# Bigodon Helpers Reference

## Array

| Helper | Signature | Description |
|--------|-----------|-------------|
| `each` | `each arr` | Block: iterate array (or wrap non-array once) |
| `forEach` | `forEach arr` | Block: iterate with `{item, index, total, isFirst, isLast}` context |
| `first` | `first arr` | First element |
| `last` | `last arr` | Last element |
| `itemAt` | `itemAt arr n` | Element at index n (only way to access by index) |
| `length` | `length arr\|str` | Length of array or string |
| `slice` | `slice arr start [end]` | Subarray [start, end) |
| `after` | `after arr n` | Items after index n |
| `before` | `before arr n` | Items before index n |
| `splice` | `splice arr start [count]` | Block: removed items |
| `includes` / `contains` | `includes arr\|str item` | True if item in array or substring in string |
| `isArray` | `isArray val` | True if value is array |
| `isEmpty` | `isEmpty arr` | True if array exists and is empty |
| `join` | `join arr sep` | Array → string with separator |
| `merge` | `merge arr1 arr2 ...` | Concatenate arrays |
| `reverse` | `reverse arr\|str` | Reversed array or string |
| `pluck` | `pluck arr "key"` | Extract property from each object |
| `unique` | `unique arr` | Deduplicated array |
| `sort` | `sort arr [desc]` | Sort numbers/strings; pass `true` for descending |
| `split` | `split str sep` | String → array on separator |

## String

| Helper | Signature | Description |
|--------|-----------|-------------|
| `append` | `append s1 s2 ...` | Concatenate strings |
| `uppercase` / `upper` / `upcase` | `uppercase str` | UPPER CASE |
| `lowercase` / `lower` / `downcase` | `lowercase str` | lower case |
| `capitalize` | `capitalize str` | Capitalize first letter |
| `capitalizeAll` / `capitalizeWords` | `capitalizeAll str` | Capitalize Each Word |
| `startsWith` | `startsWith str prefix` | True if string starts with prefix |
| `endsWith` | `endsWith str suffix` | True if string ends with suffix |
| `toString` | `toString val` | Convert to string |
| `replace` | `replace str from to` | Replace all occurrences |
| `substring` | `substring str start [end]` | Substring |
| `trim` | `trim str` | Remove surrounding whitespace |
| `trimLeft` / `trimStart` | `trimLeft str` | Remove leading whitespace |
| `trimRight` / `trimEnd` | `trimRight str` | Remove trailing whitespace |
| `padLeft` / `padStart` | `padLeft str len pad` | Pad from left |
| `padRight` / `padEnd` | `padRight str len pad` | Pad from right |
| `json` / `JSONstringify` | `json obj [indent]` | JSON string; `true` = 2-space, number = N-space indent |
| `uuid` | `uuid` | Generate random UUID v4 |

## Math

All math helpers accept numbers or numeric strings. Return `NaN` for non-numeric input.

| Helper | Signature | Description |
|--------|-----------|-------------|
| `add` / `sum` / `plus` | `add a b` | a + b |
| `subtract` / `minus` | `subtract a b` | a − b |
| `multiply` / `times` / `product` | `multiply a b` | a × b |
| `divide` / `quotient` | `divide a b` | a ÷ b |
| `modulo` / `mod` / `remainder` | `modulo a b` | a % b |
| `toInt` / `toInteger` / `parseInt` | `toInt n` | Truncate to integer |
| `toFloat` / `toDecimal` / `parseFloat` | `toFloat n` | Parse as float |
| `toNumber` / `number` | `toNumber n` | Coerce to number |
| `toFixed` | `toFixed n digits` | Fixed-point string (e.g. `{{toFixed price 2}}` → `"5.00"`) |
| `floor` | `floor n` | Round down |
| `ceil` | `ceil n` | Round up |
| `round` | `round n` | Round to nearest integer |
| `random` | `random min max` | Random integer between `min` and `max`, **inclusive on both ends** (`random 0 100` can return `0` and `100`) |

## Comparison

| Helper | Signature | Description |
|--------|-----------|-------------|
| `eq` | `eq a b` | Strict equality (===) — `eq '1' 1` → false |
| `is` | `is a b` | Loose equality (==) — `is '1' 1` → true; useful when comparing request params (strings) against data block numbers |
| `gt` | `gt a b` | a > b |
| `gte` | `gte a b` | a >= b |
| `lt` | `lt a b` | a < b |
| `lte` | `lte a b` | a <= b |
| `and` | `and a b ...` | All truthy |
| `or` | `or a b ...` | Any truthy |
| `not` | `not a` | Falsy check |
| `default` / `coalesce` / `firstNonNull` | `default a b ...` | First non-`null`/`undefined` value. **Empty strings (`""`) and `0` pass through** — they are not treated as missing |
| `unless` | `unless val` | Block: runs when falsy (no context change) |

## Code / Control

| Helper | Signature | Description |
|--------|-----------|-------------|
| `if` | `if val` | Block: truthy check without context change |
| `with` | `with val` | Block: set explicit context |
| `typeof` | `typeof val` | Returns type string |
| `return` | `return` | Halt execution, return rendered so far |
| `pick` | `pick obj "key"` | Get property by string key — use for literal dotted keys like `{{pick params "user.name"}}` which reads the key `"user.name"` literally instead of traversing `params.user.name` |

## Date

All date helpers work with: timestamp (ms), `Date` object, or ISO string with explicit time (`2024-01-01T00:00:00.000Z`).

| Helper | Signature | Description |
|--------|-----------|-------------|
| `date` | `date val` | Parse to Date object |
| `now` | `now` | Current date/time |
| `dateAdd` | `dateAdd date amount unit` | Add time (units: `ms`, `s`, `min`, `h`, `day`, `week`, `month`, `year`) |
| `dateSub` | `dateSub date amount unit` | Subtract time |
| `dateIso` | `dateIso date` | ISO 8601 string |
| `dateTimestamp` | `dateTimestamp date` | Unix timestamp in ms |
| `dateDiff` | `dateDiff date1 date2 [unit]` | Difference (default ms, supports up to `week`; `month`/`year` not supported) |

### Date Examples

```hbs
Created: {{dateIso (date createdAt)}}
Expires: {{dateIso (dateAdd (date createdAt) ttlDays "day")}}
Reminder: {{dateIso (dateSub (dateAdd (date createdAt) ttlDays "day") 2 "h")}}
Age in days: {{dateDiff (now) (date createdAt) "day"}}
Created timestamp: {{dateTimestamp (date createdAt)}}
```

With context:

```json
{
  "createdAt": "2024-01-01T00:00:00.000Z",
  "ttlDays": 7
}
```
