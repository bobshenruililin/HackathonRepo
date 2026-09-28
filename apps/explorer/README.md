# @hackathon-atlas/explorer

Local Next.js explorer on the Node.js runtime. It reads a generated SQLite FTS5 index: keyword search, filters that stay empty when a field is unknown, a project page, and a two-project comparison. Search and comparison do not call a model API. It is a local read interface, not a hosted product.

When the index real count is 0, the page says there are no real projects. Labeled synthetic fixtures stay in their own list. They are excluded from the real count.

The browser smoke test builds that index from labeled synthetic records only. Those records do not increase the real count. `next dev` and `next start` both use the Node.js runtime.

`@hackathon-atlas/schema` is already a workspace package. Root CI runs `pnpm typecheck` and `pnpm test`, which include that package's `typecheck` and `test` scripts. Its TypeScript 7.0.2 and Vitest 5.0.2 pins are unchanged. The reproducible install is root `pnpm install --frozen-lockfile` using `pnpm-lock.yaml`.

## Versions checked before pinning

Commands run on 2026-09-28:

```text
npm view next version
16.3.6

npm view react version
19.3.0

npm view react-dom version
19.3.0

npm view typescript version
7.0.2

npm view @playwright/test version
1.63.0

npm view @types/node@24 version
24.19.0

npm view @types/react version
19.3.0

npm view @types/react-dom version
19.3.0

npm view pnpm version
12.6.0
```

`npm view next@16.3.6 engines` reports `node: >=20.9.0`. Node.js 24.21.0 is the current Active LTS (Krypton), from `https://nodejs.org/dist/index.json` (`"lts": "Krypton"`, date `2026-09-07`) and `https://nodejs.org/dist/latest-v24.x/`. Root `.nvmrc` and `package.json` `engines.node` pin `24.21.0`. `packageManager` is `pnpm@12.6.0`.

GitHub Actions pins, verified with `gh api` against the release tags on 2026-09-28:

- `actions/checkout` v7.0.1 commit `3d3c42e5aac5ba805825da76410c181273ba90b1`
- `pnpm/setup` v3.0.0 commit `fbda4c85fc2e1e08721cd8763afea8f48d60f024`

`pnpm/setup` v3 installs pnpm 11+ and Node.js. The workflow reads `packageManager` and `.nvmrc`, then runs `pnpm install --frozen-lockfile`. `actions/setup-node` v7.0.0 (`820762786026740c76f36085b0efc47a31fe5020`) was verified and is not used, because `pnpm/setup` installs the runtime.

## Local commands

From the repository root:

```text
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm --filter @hackathon-atlas/explorer exec playwright install chromium
pnpm test:e2e
pnpm build-index
pnpm dev
pnpm build
pnpm start
```

`pnpm build-index` writes `apps/explorer/.data/catalog.sqlite` from the one synthetic catalog-index fixture (`real=0`, `synthetic=1`). `pnpm test:e2e` builds a smoke index with two labeled synthetic records (`real=0`, `synthetic=2`) and checks the page in Chromium. The smoke page says there are no real projects. The second smoke record carries labeled synthetic evidence, a submission, and repositories so the project and comparison pages have associated records to show. Those records are still synthetic.
