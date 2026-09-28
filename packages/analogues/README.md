# @hackathon-atlas/analogues

Deterministic analogue retrieval over a schema 0.1.0 catalog JSON document. The document has the same collections ingest writes: `projects`, `submissions`, `events`, `repositories`, `claims`, and `evidence`.

`retrieveAnalogues` takes that document, a project id, and a mode. It returns other projects that share evidence in that mode. Each analogue cites the project ids and the claim statements that justified the match. The package does not read `catalog/hackmit`. It does not call the network, run third-party code, call a model, or use a vector database.

Copyright (c) 2026 Shen Ruililin. Original code in this package is under the MIT License. Third-party material keeps its own terms.

## Modes

- `direct`: a shared track or challenge named by a claim. Recognized wording includes `names the track`, `names challenge preferences`, and a claim whose whole statement is `Track:` or `Challenge:` plus a name. Claims that only say Winner, award labels, and claims that do not name a track or challenge are ignored. `General`, `NO TRACK`, and the exact label `Beginner` are too generic to match.
- `mechanism`: a shared technology named by dependency wording, `Built With` wording, gallery technology wording, or the text before `is code-observed as a library`, `framework`, or `language`. An award label is not a mechanism. Words such as `ai`, `web`, and `technology` are too generic to match. `code-observed`, `library`, `framework`, `language`, `revision`, `manifest`, and `path` are not tokens by themselves.
- `demo`: the host of a URL in a claim that states a demo URL. Hosts such as `youtu.be`, `youtube.com`, `drive.google.com`, and `github.com` are too generic to match. A link that does not state a demo URL is not a demo.

A specific shared value produces `matched`. Shared text that is only generic produces `no-match`. A project with no named value, or a claim that states the value is unknown, produces `unknown`. Unknown stays unknown.

Synthetic projects stay labeled. `realAnalogueCount` counts only analogues whose project `synthetic` flag is false.

A rejected claim, an inferred claim, or a claim whose evidence id is not in the catalog does not justify a match.

## Checks

From the repository root, with Node.js on `PATH`:

```text
pnpm --filter @hackathon-atlas/analogues test
pnpm --filter @hackathon-atlas/analogues typecheck
```

TypeScript `7.0.2` and Vitest `5.0.2` match `packages/taxonomy`. Tests use a small in-memory fixture. They do not load a real catalog.
