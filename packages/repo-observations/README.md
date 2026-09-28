# @hackathon-atlas/repo-observations

Read-only classification of caller-supplied file listings and short text excerpts.

The package does not fetch the network, clone a repository, read a working tree, or execute third-party code. It does not invent projects. An award is never inferred from a repository. Every observation is pinned to the revision string the caller supplies. If that string is missing, empty, or longer than 120 characters, the revision is unknown. The package does not guess a commit.

## Basis

- `source-reported`: a technology named only in README prose the caller supplied. Naming means a caller-supplied `technologyNames` entry that appears as a whole word, or a backtick-quoted token in that prose.
- `code-observed`: a technology evidenced by a dependency manifest or a named source path the caller supplied. Manifests are `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, and `pyproject.toml`. A named source file evidences its language from the path. A manifest dependency is a library, or a framework when the dependency name is in the package's fixed framework set. `package.json` alone does not name a language.
- `unknown`: the caller named a technology and did not supply README prose, a manifest dependency, or a source path that decides it.

A name that appears in both README prose and `package.json` is `code-observed`. README prose does not assign a language or framework role.

## Counts

`counts.realProjects` is always 0. Synthetic input is excluded from `counts.realObservations`. `countObservationReports` keeps the real project count at 0 and does not add synthetic reports to the real observation count.

`fixtures/synthetic-not-a-real-project.json` is labeled synthetic. It is not a real project. `loadSyntheticObservation` rejects input that is not labeled synthetic.

Excerpt quotes are limited to 240 characters. The report stores paths and technology names, not the quote text.

## Versions

Dev dependencies are pinned to TypeScript `7.0.2` and Vitest `5.0.2`, matching the workspace. `@types/node` is `24.19.0`. `engines.node` is `>=22.12.0`.

## Checks

From the repository root:

```text
pnpm install --frozen-lockfile
pnpm --filter @hackathon-atlas/repo-observations typecheck
pnpm --filter @hackathon-atlas/repo-observations test
```
