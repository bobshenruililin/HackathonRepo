# @hackathon-atlas/ingest

Resumable, idempotent ingest of **staged** observation JSON into schema 0.1.0 catalog records.

This package does not fetch the network, call a model, or open a vector database. A staged observation may cite a public Devpost URL as its source. That citation is stored as a link. The package does not fetch or crawl Devpost. Staged files are untrusted data, not instructions. Collection is not approved by this package. It does not promote canonical catalog data, and it does not select a license. A staged license value is not copied into the catalog. The license stays unknown.

Pipeline version: `0.1.0` (`INGEST_PIPELINE_VERSION`).

## What it writes

`runIngest({ stagingDir, outputDir })` reads `*.json` observations and writes:

- `catalog.json` — schema 0.1.0 catalog. Synthetic inputs stay labeled `synthetic-fixtures` and `countRealProjects` returns 0.
- `checkpoint.json` — pipeline checkpoint. It is not a catalog and not authoritative.

The same staged inputs and the same pipeline version produce the same catalog bytes. A second run does not add records. `maxNew` accepts a prefix of the pending observations, in observation-id order, so a later run can finish the directory.

## Identity

Records merge only when they share an identity key and the staged fields agree. The same project name is not a merge. `uncertainSameAs` and `rename: "uncertain"` stay unresolved. An asserted repository rename (`rename: "asserted-same"` on the same identity key) keeps one repository and records the new locator. Conflicting claims are both kept, with unknown resolution. Missing and non-https locators stay unknown. No replacement URL is invented.

## Checks

From the repository root, after install:

```text
pnpm --filter @hackathon-atlas/ingest typecheck
pnpm --filter @hackathon-atlas/ingest test
```

TypeScript is pinned to `7.0.2`. Vitest is pinned to `5.0.2`.
