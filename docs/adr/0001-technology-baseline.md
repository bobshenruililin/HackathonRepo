# ADR 0001: Technology baseline

## Status

Proposed. The baseline is recorded, and the root workspace scaffold now exists. This ADR is not an owner approval of licenses, hosting, or spend.

## Context

Hackathon Atlas needs a small, inspectable stack: canonical records, a rebuildable search index, a local explorer, and tests. M0 must not depend on a mandatory LLM, a vector database, or an extra agent-orchestration framework.

The schema package 0.1.0 and the source registry have landed on main. A design-time security review exists and is not M0 acceptance. The second security pass is done and does not accept M0. The root workspace scaffold, CI workflow, SQLite FTS5 index builder, and local explorer scaffold are in this change. Command results are recorded in `ops/STATE.md`, not invented here. This ADR does not invent owner approvals.

The owner has not chosen a license. This ADR does not select one. Collection is not approved. Devpost automation stays disabled.

## Decision

1. **Canonical catalog files.** Events, projects, submissions, repositories, evidence, and claims are separate. A project may have multiple repositories and multiple submissions. Claims record basis, evidence references, observation time, and review status. Code evidence identifies the inspected revision. Unknowns stay explicit. Synthetic fixtures are labeled and excluded from real counts.
2. **Generated SQLite FTS5 indexes.** Indexes are reproducible from the catalog and are not canonical.
3. **Local Next.js explorer on the Node.js runtime.** The full explorer is not part of M0 and is not fully implemented in this draft.
4. **TypeScript in a pnpm workspace.** The coordinator integrates shared root configuration.
5. **Vitest and Playwright** as the test tools.
6. **No mandatory LLM service and no vector database.**
7. **No extra agent-orchestration framework in M0.** Cursor project agents under `.cursor/agents/` and skills under `.cursor/skills/` are the M0 role and workflow definitions. At most ten active subagents. Subagents may not spawn agents.
8. **Root pins live in the workspace manifests, not in this ADR.** `package.json` pins Node `24.21.0` and pnpm `12.6.0`. Package manifests pin TypeScript `7.0.2`, Vitest `5.0.2`, Next.js `16.3.6`, and Playwright `@playwright/test` `1.63.0`. `pnpm-lock.yaml` is the install lock. The coordinator's install and test commands are in `ops/STATE.md`.
9. **Proposed data boundary, not an approved policy.** Full archive pages and third-party trees are not catalog content. Secrets are not stored or reused. Public names and schools are an owner decision, not a default. The proposed controls are written in `DATA_POLICY.md` and `docs/ARCHITECTURE.md`. The owner has not approved them.

## M0 consequences

- Foundation documents, agent definitions, and skills landed earlier. Schema 0.1.0 and the source registry are on main. This change adds the root workspace, CI, a generated SQLite FTS5 index package, and a local explorer scaffold. Ingestion and a real catalog are still absent. The full explorer is still absent.
- Root install, typecheck, Vitest, and Playwright were run by the coordinator on commit `10b3e3c`. GitHub Actions run `36430260863` passed on `c60b825`. Both are recorded in `ops/STATE.md`.
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
- Pinning root workspace versions inside this ADR text as the authority. Rejected. The manifests and `pnpm-lock.yaml` are the pins. This ADR names them so the baseline stays readable.

## Confirmation

Schema 0.1.0, the source registry, and the workspace scaffold are in the tree this ADR describes. `ops/STATE.md` is the record of the coordinator's commands and of GitHub Actions run `36430260863`. Do not treat this ADR as owner approval.
