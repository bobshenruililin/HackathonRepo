# @hackathon-atlas/schema

Proposed contracts for Hackathon Atlas catalog records. Schema version **0.1.0** (`SCHEMA_VERSION`).

This package is a proposal. It is not promoted canonical data. It does not select a license, and it does not ship real projects, awards, links, or participation.

## Versions

TypeScript and Vitest are pinned to the npm `latest` dist-tag queried on 2026-09-28. The commands and their output:

```text
npm view typescript version
7.0.2

npm view vitest version
5.0.2
```

Those exact versions are the `devDependencies` in `package.json`. There are no version ranges.

## Authority

Canonical catalog documents use `authority: "canonical-catalog"` and `authoritative: true`. Those records are the authority.

Generated indexes use `authority: "generated-index"` and `authoritative: false`. A generated index is derived. It is not authoritative, even when it repeats catalog identifiers.

## Relationship rules

- An event, a project, a submission, a repository, an evidence record, and a claim are separate records. Each has its own stable id.
- A submission links one project to one event (`projectId`, `eventId`). A project may have many submissions, including submissions to different events.
- A repository links to one project (`projectId`). A project may have many repositories. A repository is not a submission.
- Evidence is stored apart from the claim that cites it. A claim references evidence by id. It does not embed the evidence body.
- A claim records `basis` (`source-reported`, `code-observed`, `test-observed`, or `inferred`), one or more `evidenceIds`, `observedAt`, and `reviewStatus`.
- A claim also cites `sourceUrl` and `retrievedAt`. When `repositoryInspected` is true, the claim cites `inspectedCommitId`.
- Code evidence and test evidence record `inspectedRevision`, the commit id of the revision that was inspected. That revision is the historical observation. It is not a statement about later repository contents.
- A source-reported claim must cite source evidence with the same source URL and retrieval time. A code-observed claim must cite code evidence for the same commit. A test-observed claim must cite test evidence for the same commit.
- Unknowns use `{ "status": "unknown", "reason": "..." }`. They are not omitted, null, or filled in.

## What this schema does not store

No email, phone, private profile, account identifier, secret, school, participant name, or full page or source body fields. Public names and schools are not required. Project and event `name` values are titles of those records.

Source evidence may include one short excerpt. The excerpt `kind` is `third-party-excerpt`, with an attribution and a quote of at most 240 characters. The excerpt is third-party material, not a copied implementation and not a page body.

## Synthetic fixtures

`fixtures/synthetic-catalog.json` is synthetic. The catalog sets `synthetic: true`, `datasetLabel: "synthetic-fixtures"`, and a `fixtureWarning` that says the file is not a real project. Every record in that file is labeled `synthetic: true`.

`loadSyntheticCatalog` rejects an input that is not labeled synthetic. `countRealProjects` returns 0 for a synthetic catalog and ignores projects that are still labeled synthetic. These fixtures must never be counted as real projects.

Names start with `SYNTHETIC`. Locators use `example.invalid`. Times are in 2099. The inspected revision is `SYNTHETIC-COMMIT-paper-boat-app-0001`, not a real commit hash. No awards, licenses, or participation are asserted.

## Checks

From `packages/schema`:

```text
npm test
npm run typecheck
```

`npm test` runs `vitest run`. `npm run typecheck` runs `tsc --noEmit`.
