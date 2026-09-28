# @hackathon-atlas/catalog-index

Builds a local SQLite FTS5 index from catalog JSON files. The database is generated. It is not the canonical catalog. Generated `*.sqlite` files are gitignored.

`countRecords` reports `real` and `synthetic` separately. A record counts as synthetic only when its `synthetic` field is `true`. The committed fixture is labeled synthetic and does not increase the real count. It is not a HackMIT project.

`@hackathon-atlas/schema` is a separate workspace package. This package does not rewrite that package's contracts, fixtures, or tests. Root `pnpm typecheck` and `pnpm test` run the schema package scripts because `packages/*` is a workspace glob.

## Versions checked before pinning

Commands run on 2026-09-28:

```text
npm view pnpm version
12.6.0

npm view typescript version
7.0.2

npm view vitest version
5.0.2

npm view @types/node@24 version
24.19.0
```

Node.js 24.21.0 is the current Active LTS (Krypton). `https://nodejs.org/dist/index.json` lists `v24.21.0` with `"lts": "Krypton"` and date `2026-09-07`. `https://nodejs.org/dist/latest-v24.x/` publishes that same patch. The Node.js release schedule lists 24.x as Active LTS and 26.x as Current until 2026-10-28. Root `package.json` `engines.node` and `.nvmrc` pin `24.21.0`. Root `packageManager` is `pnpm@12.6.0`.

On Node 24.21.0, `node:sqlite` reports `ENABLE_FTS5 = 1` and SQLite 3.53.4. The Node.js v24 SQLite API is documented as Stability 1.2 (release candidate): `https://nodejs.org/docs/latest-v24.x/api/sqlite.html`.

Schema 0.1.0 already pins `typescript` `7.0.2` and `vitest` `5.0.2`. Those pins are unchanged. The workspace lockfile is root `pnpm-lock.yaml`.

## Checks

From the repository root, with Node 24.21.0:

```text
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
```

`pnpm test` runs Vitest in this package and in `@hackathon-atlas/schema`.
