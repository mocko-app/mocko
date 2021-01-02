# Mocko Logger
This is the logging module used by [Mocko](https://cdt.one/WzuRdVq).

## Usage
With Mocko Logger, you can create logging templates that you'll use
later to log structured messages. Here's an example:
```ts
import { LogColumn, Logger } from '@mocko/logger';
import * as colors from 'colors/safe';

const log = new Logger()
    .column(LogColumn.fixed('[mocko]').color(colors.blue))
    .column(LogColumn.timestamp().clf().color(colors.dim))
    .column(LogColumn.text().size(7).right().color(colors.gray))
    .column(LogColumn.text())
    .log;

log("info", "Hi there :)");
log("warning", "Lorem ipsum dolor sit amet");
```

This would produce:

![Logs](https://i.imgur.com/cGmim2y_d.webp?maxwidth=760&fidelity=grand)

## Columns

### Generic
All columns provide you with the `.color` modifier. You can pass
a color function from any lib you use. Example:
```ts
import { LogColumn, Logger } from '@mocko/logger';
import * as colors from 'colors/safe';

const log = new Logger()
    .column(LogColumn.text().color(colors.magenta))
    .log;

log('This text is magenta :)');
```

### Fixed
The `fixed` column is a piece of text that won't change. It doesn't
require a new parameter from the user. Example:
```ts
import { LogColumn, Logger } from '@mocko/logger';
import * as colors from 'colors/safe';

const warn = new Logger()
    .column(LogColumn.fixed('WARN').color(colors.yellow))
    .column(LogColumn.text())
    .log;

warn('This is a warning');
```

### Text
The `text` column requires a new parameter from the user and will apply its rules to it.
A fixed size text will have padding added to the beggining or end
of it deppending on the alignment (right/left).
The default is left-aligned text.

### Timestamp
The timestamp column prints the current time, it doesn't require a new parameter from the user. You can format it with `.iso`, `.utc`, `.clf` or `.millis`. The default is `clf`. Example:
```ts
import { LogColumn, Logger } from '@mocko/logger';
import * as colors from 'colors/safe';

const warn = new Logger()
    .column(LogColumn.timestamp().iso().color(colors.dim))
    .column(LogColumn.fixed('WARN').color(colors.yellow))
    .column(LogColumn.text())
    .log;

warn('This is a warning');
```
