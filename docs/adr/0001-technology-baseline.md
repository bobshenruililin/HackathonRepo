# ADR 0001: Technology baseline

## Status

Proposed. Recorded in the M0 foundation draft so later work shares one baseline. Not implemented in this pull request. Not an owner approval of licenses, hosting, or spend.

## Context

Hackathon Atlas needs a small, inspectable stack: canonical records, a rebuildable search index, a local explorer, and tests. M0 must not depend on a mandatory LLM, a vector database, or an extra agent-orchestration framework.

The schema package and source registry are in flight elsewhere. Their results and versions are unknown. A design-time security review exists and is not M0 acceptance. A second pass is required before M0 acceptance. This ADR does not invent command results or owner approvals.

The owner has not chosen a license. This ADR does not select one. Collection is not approved. Devpost automation stays disabled.

## Decision

1. **Canonical catalog files.** Events, projects, submissions, repositories, evidence, and claims are separate. A project may have multiple repositories and multiple submissions. Claims record basis, evidence references, observation time, and review status. Code evidence identifies the inspected revision. Unknowns stay explicit. Synthetic fixtures are labeled and excluded from real counts.
2. **Generated SQLite FTS5 indexes.** Indexes are reproducible from the catalog and are not canonical.
3. **Local Next.js explorer on the Node.js runtime.** The full explorer is not part of M0 and is not fully implemented in this draft.
4. **TypeScript in a pnpm workspace.** The coordinator integrates shared root configuration.
5. **Vitest and Playwright** as the test tools.
6. **No mandatory LLM service and no vector database.**
7. **No extra agent-orchestration framework in M0.** Cursor project agents under `.cursor/agents/` and skills under `.cursor/skills/` are the M0 role and workflow definitions. At most ten active subagents. Subagents may not spawn agents.
8. **Dependency versions are not pinned in this pull request** because the workspace is not created yet. This ADR names tools only. It does not name package versions, lockfile entries, or install commands.
9. **Proposed data boundary, not an approved policy.** Full archive pages and third-party trees are not catalog content. Secrets are not stored or reused. Public names and schools are an owner decision, not a default. The proposed controls are written in `DATA_POLICY.md` and `docs/ARCHITECTURE.md`. The owner has not approved them.

## M0 consequences

- This pull request adds foundation documents, agent definitions, and skills. It does not add `package.json`, a lockfile, `packages/schema/**`, `sources/**`, ingestion, SQLite indexes, or the explorer.
- Install, typecheck, Vitest, and Playwright are not run, because there is no workspace here to run them in.
- Later implementation must keep catalog files canonical and must be able to rebuild FTS5 indexes from those files.
- Later explorer work stays local to the Node.js runtime unless a new ADR says otherwise. Shipping the full explorer is not required to finish M0.
- Retrieval and pattern work must still function when no LLM and no vector index are configured.
- Shared root configuration and canonical catalog promotion stay with the coordinator.
- A `LICENSE` file is not added. Redistribution terms for our code remain undecided.
- The design-time security review does not accept M0. A second pass is required before M0 acceptance. That pass has not been run here.

## Alternatives considered

- A vector database as the primary store. Rejected for this baseline. It is a non-goal, and the catalog files plus FTS5 cover the stated retrieval need without it.
- A mandatory LLM at runtime. Rejected. Claims must rest on evidence even when no model is available.
- A separate orchestration framework in M0. Rejected. It is a non-goal for this milestone.
- Pinning versions now. Rejected. The workspace does not exist in this pull request, so a pin would be an invented version.

## Confirmation

Schema field names, package versions, index build commands, and explorer routes are unknown until the owning work lands. Do not treat this ADR as evidence that those artifacts exist or that any check passed.
