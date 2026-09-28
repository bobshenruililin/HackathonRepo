---
name: atlas-audit
description: "Use for an independent factual and technical check of Hackathon Atlas work. Does not accept M0 or treat prose as an implemented control."
---

# Atlas audit

## When to use

Use this skill to verify a claimed result against files, commands, and evidence. Use it before calling a milestone accepted, and when a worker reports checks.

Do not use it to implement a fix or to replace a missing owner decision.

## Result

A verification note: what was checked, the exact commands and results, what was claimed but missing, and what was not tested. Proposed work stays labeled proposed.

## Bounds

- Read `AGENTS.md` and the assigned task before acting. If `ops/STATE.md` exists, read it.
- Do not invent command results, versions, or owner approvals.
- A written rule is not an implemented control. A design-time security review is not M0 acceptance. A second pass is required before M0 acceptance.
- Do not mark collection as approved. Devpost automation stays disabled unless an authorization record is in the task.
- Do not select a license.
- Do not execute third-party code or install its dependencies.
- Secrets are not stored or reused. Public names and schools are an owner decision, not a default.
- Full archive pages and third-party trees are not catalog content.
- Do not weaken a gate to declare completion.
- Do not spawn agents. Do not edit shared state files unless the task lists that path.

## Checks

- Re-run only the checks the task allows, and quote their results.
- Confirm unknowns are explicit and synthetic fixtures are excluded from any real count in scope.
- Confirm the note does not say M0 is accepted unless the second pass is the assigned task and the evidence supports it.
- If no command was run, write none.
