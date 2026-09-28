---
name: atlas-checkpoint
description: "Use when summarizing Hackathon Atlas state, artifacts, blockers, and next tasks. Does not promote canonical data or accept a milestone."
---

# Atlas checkpoint

## When to use

Use this skill to summarize the current milestone: state, artifacts, blockers, and the next tasks. Use it when work stops at a milestone boundary or a permission decision.

Do not use it to start new collection or to mark M0 accepted.

## Result

A checkpoint with four parts: state, artifacts, blockers, and next tasks. Completed work is separate from proposed work. Unknowns stay unknown.

## Bounds

- Read `AGENTS.md` and the assigned task before acting. If `ops/STATE.md` exists, read it and cite it. If it is missing, say it is missing. Do not invent it.
- Workers do not edit shared state files. Only the coordinator updates `ops/STATE.md` and promotes canonical data. This skill returns a summary; it does not write those files unless the task lists the path and the actor is the coordinator.
- Do not invent command results or owner approvals.
- Do not select a license. License not chosen is an owner blocker when redistribution is in scope.
- Do not mark collection as approved. Devpost automation stays disabled unless an authorization record is already in state.
- A design-time security review is not M0 acceptance. A second pass is required before M0 acceptance. Do not report that pass as done if it was not run.
- Public names and schools remain an owner decision, not a default.
- Do not spawn agents.

## Checks

- The summary names artifacts by path.
- Blockers are decisions that are actually open, not guessed approvals.
- Next tasks stay inside the current milestone or stop at the owner decision.
- Commands that were not run are listed as not run.
