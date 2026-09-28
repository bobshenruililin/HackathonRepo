import { isTaxonomyDimension, type TaxonomyDimension } from "./dimensions.js";
import { TaxonomyError } from "./errors.js";
import {
  MAX_RATIONALE_LENGTH,
  MAX_SOURCE_RECORD_ID_LENGTH,
  MAX_TAXONOMY_VALUE_LENGTH,
} from "./types.js";

const VALUE_TOKEN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_RECORD_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$/;

export function assertDimension(value: unknown): TaxonomyDimension {
  if (typeof value !== "string" || !isTaxonomyDimension(value)) {
    throw new TaxonomyError("unknown-dimension", "The dimension is not in the controlled taxonomy.");
  }
  return value;
}

/**
 * Returns a controlled token, or undefined when the string cannot be stored.
 * "unknown" is reserved and is not a token.
 */
export function canonicalTaxonomyToken(input: string): string | undefined {
  const value = input.trim();
  if (value === "unknown") {
    return undefined;
  }
  if (value.length === 0 || value.length > MAX_TAXONOMY_VALUE_LENGTH || !VALUE_TOKEN.test(value)) {
    return undefined;
  }
  return value;
}

export function assertProposableValue(input: unknown): string {
  if (typeof input !== "string") {
    throw new TaxonomyError("invalid-value", "A taxonomy value must be a string.");
  }
  const value = input.trim();
  if (value === "unknown") {
    throw new TaxonomyError("reserved-unknown", "Unknown is not a taxonomy value.");
  }
  const token = canonicalTaxonomyToken(value);
  if (!token) {
    throw new TaxonomyError("invalid-value", "A taxonomy value must be a short lowercase token.");
  }
  return token;
}

export function assertRationale(input: unknown): string {
  if (typeof input !== "string") {
    throw new TaxonomyError("invalid-rationale", "A proposal needs a short rationale.");
  }
  const rationale = input.trim();
  if (rationale.length === 0 || rationale.length > MAX_RATIONALE_LENGTH) {
    throw new TaxonomyError("invalid-rationale", "A proposal needs a short rationale.");
  }
  return rationale;
}

/**
 * Stores the caller-supplied id. This package does not resolve or fetch it.
 */
export function assertSourceRecordId(input: unknown): string {
  if (typeof input !== "string") {
    throw new TaxonomyError("invalid-source-record-id", "A proposal needs a source record id.");
  }
  const sourceRecordId = input.trim();
  if (
    sourceRecordId.length === 0 ||
    sourceRecordId.length > MAX_SOURCE_RECORD_ID_LENGTH ||
    !SOURCE_RECORD_ID.test(sourceRecordId)
  ) {
    throw new TaxonomyError("invalid-source-record-id", "A proposal needs a source record id.");
  }
  return sourceRecordId;
}
