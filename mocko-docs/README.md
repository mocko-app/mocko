# mocko-docs

The documentation site for [Mocko](https://mocko.dev), served at docs.mocko.dev. It covers Mocko v2 (getting started, creating mocks, self-hosting, reference) and keeps the legacy v1 docs under `/docs/v1`.

Built with Next.js and Tailwind, matching the stack of `mocko-control`. Pages are TSX components (no MDX or docs framework) so the site can share interactive components with the control panel, like the templating playground.

## Development

```
npm install
npm run dev
```

The site runs at http://localhost:3000. `npm run build` lints and builds.

## Structure

- `app/docs/` — one folder per docs page
- `app/docs/v1/` — frozen legacy v1 docs, migrated as-is from the old MkDocs site
- `components/docs/` — docs shell (sidebar, topbar) and prose building blocks
- `components/docs/nav-data.ts` — sidebar navigation structure
