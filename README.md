# Hackathon Atlas

Hackathon Atlas is an evidence-backed, reusable, event-agnostic hackathon research and preparation system. It records what a source or an inspection actually supports so later decisions and lessons stay traceable.

## Purpose

Atlas is a catalog of hackathon events, projects, submissions, repositories, evidence, and claims. Catalog files are the canonical record relative to generated indexes and a local explorer. Full archive pages and third-party trees are not catalog content. This draft does not approve collection.

The system is event-agnostic. One event may seed discovery. The catalog is not a mirror of that event and not a race to accumulate projects or prose.

## First discovery seed

[HackMIT](https://archive.hackmit.org/) is the first discovery seed. It is a starting point for finding sources. It is not a bulk repository mirror, and it is not permission to collect every project or repository the archive links to.

## Intended users

- People preparing for a future hackathon who need research and a plan tied to evidence.
- People capturing lessons from their own participation. Participation that did not happen is not invented.
- Reviewers who need claims tied to evidence, with unknowns left explicit.

## Non-goals

- Optimizing for project counts or generated prose.
- A mandatory runtime LLM.
- A vector database.
- An extra agent-orchestration framework in M0.
- Broad collection.
- The full explorer in M0.

## Where to read next

- [DATA_POLICY.md](DATA_POLICY.md) — draft access, retention, and reuse rules.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — intended shape of the system.
- [docs/adr/0001-technology-baseline.md](docs/adr/0001-technology-baseline.md) — technology choices for this baseline.
- [docs/M1_ACCEPTANCE.md](docs/M1_ACCEPTANCE.md) — proposed acceptance criteria for the milestone after M0.
- [ops/STATE.md](ops/STATE.md) — current milestone state.
- [ops/TASK_CONTRACT.md](ops/TASK_CONTRACT.md) — how a task is scoped and reported.
- [AGENTS.md](AGENTS.md) — standing agent rules, already on `main`.

## Draft status

M0 foundation documents are in progress. This pull request does not create the TypeScript workspace, catalog data, ingestion, indexes, or explorer. Dependency versions, schema results, and source-audit results are unknown here. A design-time security review is recorded in [ops/STATE.md](ops/STATE.md). It is not M0 acceptance. A second pass is required before M0 acceptance. The owner has not chosen a license. Devpost automation stays disabled. Public names and schools are an owner decision, not a default.

This draft is for coordinator integration. It is not legal advice, and it is not an owner approval of policy or of later milestones.
