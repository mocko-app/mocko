# mocko-docs

The documentation site for [Mocko](https://mocko.dev), served at mocko.dev/docs. It covers Mocko v2 (getting started, creating mocks, recipes, the SDK, running Mocko, reference) and keeps the legacy v1 docs under `/docs/v1`.

Built with Next.js and Tailwind, matching the stack of `mocko-control`. Pages are TSX components (no MDX or docs framework) so the site can share interactive components with the control panel, like the templating playground.

## Development

```
npm install
npm run dev
```

The site runs at http://localhost:3000/docs (the app uses `basePath: /docs`). `npm run build` produces a static export in `out/` and generates the Pagefind search index; search only works against a production build.

## Structure

- `app/` — one folder per docs page
- `app/v1/` — frozen legacy v1 docs, migrated as-is from the old MkDocs site
- `components/docs/` — docs shell (sidebar, topbar, search) and prose building blocks
- `components/docs/nav-data.ts` — sidebar navigation structure

## Deployment

`Dockerfile` builds the site and serves the static export with nginx on port 8080 under the `/docs` prefix. `nginx.conf` also handles the legacy MkDocs-era URL redirects (`/docs/templating` and friends redirect to their `/docs/v1/...` equivalents) and exposes `/healthz` for probes.

```
docker build -t mocko-docs .
docker run -p 8080:8080 mocko-docs
```
