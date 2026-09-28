# @hackathon-atlas/eval

Retrieval evaluation harness for six fixed queries. It records each query as `NOT MEASURED` until both a gold set and a real corpus exist. It does not invent projects, awards, or scores.

An empty gold set produces `NOT MEASURED` for every fixed query. Those results have no `precision` and no `recall` field. `requirePrecisionAndRecall` throws if a result is `NOT MEASURED`.

A file or object with `synthetic: true` is not a gold set. The committed fixture `fixtures/synthetic-not-a-gold-set.json` is labeled synthetic and is rejected. Records with `synthetic: true` are excluded from the real corpus count. A corpus that contains only synthetic records is not a real corpus.

This package does not read the catalog index, does not search, and does not call a model. Callers supply gold judgments and retrieved ids. Measurement uses only those ids when every cited id is in the real corpus. If the gold set is empty, the corpus has no real records, a cited id is absent, or no retrieval was supplied, the query stays `NOT MEASURED`.

## Fixed queries

- Find HackMIT projects involving computer vision but not healthcare.
- Find physical-world projects with an AI component.
- Find projects using speech as the primary interaction.
- Find award-winning projects with public code.
- Find projects structurally similar to a social matching product.
- Find projects where README technology claims are supported by repository evidence.

## Versions

Dev dependencies are pinned to TypeScript `7.0.2` and Vitest `5.0.2`, matching the workspace. `@types/node` is `24.19.0`.

## Checks

From the repository root:

```text
pnpm install --frozen-lockfile
pnpm --filter @hackathon-atlas/eval typecheck
pnpm --filter @hackathon-atlas/eval test
pnpm --filter @hackathon-atlas/eval bundle
```

`bundle` prints the unevaluated bundle: empty gold set, real corpus count 0, and `NOT MEASURED` for every query.
