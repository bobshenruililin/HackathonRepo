# M1 acceptance criteria (proposed)

**Status: proposed. Not started. Not approved.**

M1 means the milestone after M0. Nothing in this file starts M1, schedules it, or records owner approval. Criteria below are the proposed checks for that later milestone. They are measurable so a future verifier can apply them without reinterpretation. Schema field names are in `packages/schema`. Workspace commands are in the package manifests. Do not treat a missing command as a pass.

The schema package and the root workspace scaffold exist. Their commands are in the package manifests. The coordinator's install, typecheck, Vitest, and Playwright results are in `ops/STATE.md`. Those results are not M1 criteria. M0's full explorer is still out of scope. Passing M0 does not require M1.

## Criteria

### 1. No broad collection until approval

Measure: every collected source record cites an approval reference that already existed before the fetch. The number of collected sources with no approval reference is 0.

A discovery seed, including `https://archive.hackmit.org/`, is not an approval to collect the projects or repositories it mentions.

This criterion fails if any fetch job, import, or catalog insert covers a source that lacks that approval reference.

### 2. Devpost automation stays disabled

Measure: Devpost automated collection is off. The number of Devpost fetch or import runs is 0 unless an explicit authorization record exists, and this draft records no such authorization.

This criterion fails if a config flag, scheduled job, script, or agent task enables Devpost automation, or if a Devpost response is imported, without that authorization record.

### 3. One later ingest slice keeps unknowns explicit

Measure: for one agreed ingest slice (the slice itself is not chosen in this draft; the chosen slice id is unknown), every missing fact is stored as an explicit unknown. A review of that slice finds 0 fields that are blank, guessed, or defaulted where the source or inspection did not supply a value.

The slice also records claim basis, evidence references, observation time, and review status, or records each of those as unknown. Code evidence includes the inspected revision, or records the revision as unknown.

This criterion fails if the slice fills gaps with plausible values, or if "empty" is used to mean success.

### 4. Synthetic fixtures are excluded from real counts

Measure: in that same ingest slice, every synthetic fixture is labeled synthetic. Every reported real count of events, projects, submissions, repositories, evidence, and claims includes 0 synthetic fixtures.

This criterion fails if a real count changes when synthetic fixtures are added or removed, or if an unlabeled fixture is counted as real.

### 5. The full explorer is not part of M0

Measure: the M0 change set does not contain a complete Next.js explorer, and M0 is not held open waiting for one. A checklist for closing M0 can pass with the explorer unimplemented.

This criterion is about scope, not about forbidding a later explorer. M1 does not, by this draft, approve building the full explorer. If explorer work is proposed later, it needs its own approved task. This criterion fails if M0 is declared blocked or incomplete solely because the full explorer is absent.

## Not acceptance criteria

- A chosen license. The owner has not chosen one. License selection is an owner blocker, not an M1 pass condition invented here.
- A target number of projects, repositories, or pages.
- A passing parser, a green typecheck, or a source URL, as proof that a claim is true.
- Install, typecheck, Vitest, or Playwright results. The coordinator recorded those commands for the workspace scaffold in `ops/STATE.md`. A green check is not proof that a claim is true, and it is not an M1 result.

## Current result

M1 has not started. No criterion above has been executed. Result of each criterion: not run.
