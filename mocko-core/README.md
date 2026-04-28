# @mocko/core

Core runtime for [Mocko](https://github.com/mocko-app/mocko).

This package powers the Mocko HTTP mock server. It loads File Mocks, matches incoming requests, renders Bigodon templates, manages flags, and proxies unmatched requests when an upstream URL is configured.

Most users should install `@mocko/cli` instead:

```sh
npm i -g @mocko/cli
mocko
```

## Used By

- `@mocko/cli`
- Mocko Docker images

## Development

See the root [CONTRIBUTING.md](https://github.com/mocko-app/mocko/blob/main/CONTRIBUTING.md).
