# ADR 0001: Technology baseline

## Status

Proposed. Recorded in the M0 foundation draft so later work shares one baseline. Not implemented in this pull request. Not an owner approval of licenses, hosting, or spend.

## Context

Hackathon Atlas needs a small, inspectable stack: canonical records, a rebuildable search index, a local explorer, and tests. M0 must not depend on a mandatory LLM, a vector database, or an extra agent-orchestration framework.

The schema package 0.1.0 and the source registry have landed on main. They are no longer in flight or unknown. A design-time security review exists and is not M0 acceptance. The second security pass is done and does not accept M0. Root workspace, CI, index build commands, and explorer routes are still absent. This ADR does not claim those checks passed. This ADR does not invent command results or owner approvals.

The owner has not chosen a license. This ADR does not select one. Collection is not approved. Devpost automation stays disabled.

## Decision

1. **Canonical catalog files.** Events, projects, submissions, repositories, evidence, and claims are separate. A project may have multiple repositories and multiple submissions. Claims record basis, evidence references, observation time, and review status. Code evidence identifies the inspected revision. Unknowns stay explicit. Synthetic fixtures are labeled and excluded from real counts.
2. **Generated SQLite FTS5 indexes.** Indexes are reproducible from the catalog and are not canonical.
3. **Local Next.js explorer on the Node.js runtime.** The full explorer is not part of M0 and is not fully implemented in this draft.
4. **TypeScript in a pnpm workspace.** The coordinator integrates shared root configuration.
5. **Vitest and Playwright** as the test tools.
6. **No mandatory LLM service and no vector database.**
7. **No extra agent-orchestration framework in M0.** Cursor project agents under `.cursor/agents/` and skills under `.cursor/skills/` are the M0 role and workflow definitions. At most ten active subagents. Subagents may not spawn agents.
8. **Root workspace dependency versions are not pinned in this ADR** because the root workspace is still absent. This ADR names tools only. It does not name root package versions, a root lockfile, or root install commands, and it does not claim those checks passed. Schema 0.1.0 has its own package pins. This ADR does not restate them as a root workspace or CI result.
9. **Proposed data boundary, not an approved policy.** Full archive pages and third-party trees are not catalog content. Secrets are not stored or reused. Public names and schools are an owner decision, not a default. The proposed controls are written in `DATA_POLICY.md` and `docs/ARCHITECTURE.md`. The owner has not approved them.

## M0 consequences

- This pull request added foundation documents, agent definitions, and skills. Schema 0.1.0 (`packages/schema/**`) and the source registry (`sources/**`) have since landed. A root `package.json`, a root lockfile, ingestion, SQLite indexes, and the explorer are still absent.
- Root workspace install, typecheck, Vitest, and Playwright are not recorded here. There is still no root workspace to run them in. This ADR does not claim those checks passed.
- Later implementation must keep catalog files canonical and must be able to rebuild FTS5 indexes from those files.
- Later explorer work stays local to the Node.js runtime unless a new ADR says otherwise. Shipping the full explorer is not required to finish M0.
- Retrieval and pattern work must still function when no LLM and no vector index are configured.
- Shared root configuration and canonical catalog promotion stay with the coordinator.
- A `LICENSE` file is not added. Redistribution terms for our code remain undecided.
- The design-time security review does not accept M0. The second security pass is done and does not accept M0.

## Alternatives considered

- A vector database as the primary store. Rejected for this baseline. It is a non-goal, and the catalog files plus FTS5 cover the stated retrieval need without it.
- A mandatory LLM at runtime. Rejected. Claims must rest on evidence even when no model is available.
- A separate orchestration framework in M0. Rejected. It is a non-goal for this milestone.
- Pinning root workspace versions in this ADR. Rejected. The root workspace is still absent, so a root pin would be an invented version.

## Confirmation

Schema 0.1.0 field names and the source registry have landed. Index build commands and explorer routes are still absent. Root workspace and CI are still absent. Do not treat this ADR as evidence that those checks passed.
