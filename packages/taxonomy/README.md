# @hackathon-atlas/taxonomy

Controlled vocabulary for Hackathon Atlas. The twelve dimensions in `TAXONOMY_DIMENSIONS` are the whole list. A new dimension belongs in that list only after a recorded proposal. This package has no function that adds a dimension.

`createTaxonomyRegistry()` starts empty. `hackmitTrackTaxonomy()` is a separate registry that accepts five source-reported gallery track labels as problem-domain values: education, healthcare, sustainability, entertainment, and interactive-media. A track label is not an inferred product fact. The other eleven dimensions stay unaccepted in that registry. The package does not store projects.

## Proposal and acceptance

`proposeValue` records a value, a short rationale, and a source record id supplied by the caller. The new record has status `proposed`. It is not added to the accepted set. This package stores the source record id and does not resolve or fetch it.

`acceptValue` is a separate function. It copies an existing proposal into the accepted set and leaves the proposal record proposed. Classification consults the accepted set only.

## Classification

`classify` rejects a value that is not accepted. A proposed value is still rejected. A string that was never proposed is rejected.

Unknown is `{ status: "unknown" }`. It is valid on any closed dimension. It is not a taxonomy value, and it does not enter the accepted set. The token `unknown` cannot be proposed.

## Checks

From the repository root:

```text
pnpm --filter @hackathon-atlas/taxonomy test
pnpm --filter @hackathon-atlas/taxonomy typecheck
```

TypeScript `7.0.2` and Vitest `5.0.2` match the workspace pins. Node.js `>=22.12.0` matches the package `engines` field. The package does not make network calls.
