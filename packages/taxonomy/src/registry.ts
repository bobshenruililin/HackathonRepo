import type { TaxonomyDimension } from "./dimensions.js";
import { TaxonomyError } from "./errors.js";
import type {
  AcceptValueInput,
  AcceptedTaxonomyValue,
  ProposeValueInput,
  ProposedTaxonomyValue,
  TaxonomyRegistry,
} from "./types.js";
import { assertDimension, assertProposableValue, assertRationale, assertSourceRecordId } from "./values.js";

export function createTaxonomyRegistry(): TaxonomyRegistry {
  return Object.freeze({
    proposals: Object.freeze([]),
    accepted: Object.freeze([]),
  });
}

/**
 * Records a caller-supplied value. The record stays proposed.
 * This function does not accept the value.
 */
export function proposeValue(registry: TaxonomyRegistry, input: ProposeValueInput): TaxonomyRegistry {
  const dimension = assertDimension(input.dimension);
  const value = assertProposableValue(input.value);
  const rationale = assertRationale(input.rationale);
  const sourceRecordId = assertSourceRecordId(input.sourceRecordId);

  if (isProposed(registry, dimension, value) || isAccepted(registry, dimension, value)) {
    throw new TaxonomyError(
      "duplicate-proposal",
      `Value "${value}" on ${dimension} already has a proposal.`,
    );
  }

  const proposal: ProposedTaxonomyValue = Object.freeze({
    status: "proposed",
    dimension,
    value,
    rationale,
    sourceRecordId,
  });

  return Object.freeze({
    proposals: Object.freeze([...registry.proposals, proposal]),
    accepted: registry.accepted,
  });
}

/**
 * Explicit acceptance of one value that was already proposed.
 * The proposal record stays proposed. Acceptance is a separate record.
 */
export function acceptValue(registry: TaxonomyRegistry, input: AcceptValueInput): TaxonomyRegistry {
  const dimension = assertDimension(input.dimension);
  const value = assertProposableValue(input.value);
  if (isAccepted(registry, dimension, value)) {
    return registry;
  }

  const proposal = registry.proposals.find((item) => item.dimension === dimension && item.value === value);
  if (!proposal) {
    throw new TaxonomyError("not-proposed", `Value "${value}" on ${dimension} was never proposed.`);
  }

  const accepted: AcceptedTaxonomyValue = Object.freeze({
    status: "accepted",
    dimension,
    value,
    rationale: proposal.rationale,
    sourceRecordId: proposal.sourceRecordId,
  });

  return Object.freeze({
    proposals: registry.proposals,
    accepted: Object.freeze([...registry.accepted, accepted]),
  });
}

export function listProposed(registry: TaxonomyRegistry): readonly ProposedTaxonomyValue[] {
  return registry.proposals;
}

export function listAccepted(registry: TaxonomyRegistry): readonly AcceptedTaxonomyValue[] {
  return registry.accepted;
}

export function isProposed(registry: TaxonomyRegistry, dimension: TaxonomyDimension, value: string): boolean {
  return registry.proposals.some((item) => item.dimension === dimension && item.value === value);
}

export function isAccepted(registry: TaxonomyRegistry, dimension: TaxonomyDimension, value: string): boolean {
  return registry.accepted.some((item) => item.dimension === dimension && item.value === value);
}
