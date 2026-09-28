# Proposed ADR: Versioned entity and evidence schema

- Status: Proposed. Not accepted. Not promoted canonical data.
- Schema version: 0.1.0
- Scope: `packages/schema` only

## Context

Hackathon Atlas separates events, projects, submissions, repositories, and evidence. A factual claim needs evidence or an explicit unknown. Claim basis is source-reported, code-observed, test-observed, or inferred. Catalog files are the authority. Generated indexes are not. Synthetic fixtures must be labeled and excluded from real project counts.

The schema also refuses fields for emails, phones, private profiles, account identifiers, secrets, schools, and full page or source bodies. Claims cite a source URL, a retrieval time, and, when a repository was inspected, the commit id.

## Decision

Represent the catalog as versioned records with stable prefixed ids and foreign-key relationships.

- A submission is the relationship between one project and one event. A project may have many submissions.
- A repository points at one project. A project may have many repositories.
- Claims point at evidence ids. They do not embed evidence or source bodies.
- Code evidence stores `inspectedRevision`, the commit id that was inspected.
- Unknown values are `{ "status": "unknown", "reason" }`. Known values are `{ "status": "known", "value" }`.
- Canonical documents set `authoritative: true`. Generated indexes set `authoritative: false` and fail validation otherwise.
- Fixture documents set `synthetic: true` and `datasetLabel: "synthetic-fixtures"`. Real project counts skip those documents and any project still labeled synthetic.
- Optional source excerpts are short quotes labeled `third-party-excerpt`.

This branch proposes the contract. It does not promote catalog data, choose a license, or add an explorer, ingestion pipeline, or SQLite index.

## Consequences

Callers can check relationships without inferring them from nested project blobs. Historical code claims stay tied to the inspected commit. Missing facts stay visible. Indexes can be rebuilt without becoming a second source of truth.

Person names, schools, contact details, account ids, secrets, and page bodies have nowhere to go in this version. A later version would need a new schema version and a new decision before adding any of those.

## Alternatives considered

- Nest repositories and submissions inside the project object. Rejected. The project would no longer have explicit, separately identifiable relationships.
- Use null or an omitted field for unknown. Rejected. Absence cannot be told apart from a value that was never reviewed.
- Treat a generated SQLite index as the catalog. Rejected. Indexes are derived and are not authoritative. SQLite is outside this proposal.
- Store retrieved page bodies so later claims can be re-read from the catalog. Rejected. Full source bodies are out of scope. Claims cite the source URL, retrieval time, and any inspected commit instead.
- Record team members, emails, or schools on the project. Rejected. Those fields are not required and are not collected.
