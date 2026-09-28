import { TAXONOMY_DIMENSIONS, isTaxonomyDimension, type TaxonomyDimension } from "./dimensions.js";
import { TaxonomyError } from "./errors.js";
import { isAccepted, isProposed } from "./registry.js";
import type { Classification, ClassifiedDimension, ClassificationResult, DimensionAssignment } from "./types.js";
import { canonicalTaxonomyToken } from "./values.js";

/**
 * Applies a classification against accepted values only.
 * Unknown is valid. A proposed value, and any string that was never proposed, is rejected.
 */
export function classify(registry: TaxonomyRegistryShape, classification: Classification): ClassificationResult {
  const assignments = readAssignments(classification);
  const dimensions = assignments.map((assignment) =>
    classifyDimension(registry, assignment.dimension, assignment.assignment),
  );
  return Object.freeze({
    dimensions: Object.freeze(dimensions),
  });
}

type TaxonomyRegistryShape = Parameters<typeof isAccepted>[0];

function readAssignments(
  classification: Classification,
): readonly { dimension: TaxonomyDimension; assignment: DimensionAssignment }[] {
  if (!isRecord(classification)) {
    throw new TaxonomyError("invalid-assignment", "A classification must be an object.");
  }

  for (const key of Object.keys(classification)) {
    if (!isTaxonomyDimension(key)) {
      throw new TaxonomyError("unknown-dimension", "The dimension is not in the controlled taxonomy.");
    }
  }

  const assignments: { dimension: TaxonomyDimension; assignment: DimensionAssignment }[] = [];
  for (const dimension of TAXONOMY_DIMENSIONS) {
    if (!Object.hasOwn(classification, dimension)) {
      continue;
    }
    const assignment = classification[dimension];
    if (assignment === undefined) {
      throw new TaxonomyError("invalid-assignment", "A dimension assignment must be unknown or a value.");
    }
    assignments.push({ dimension, assignment });
  }
  return assignments;
}

function classifyDimension(
  registry: TaxonomyRegistryShape,
  dimension: TaxonomyDimension,
  assignment: DimensionAssignment,
): ClassifiedDimension {
  const parsed = readAssignment(assignment);
  if (parsed.status === "unknown") {
    return Object.freeze({ dimension, status: "unknown" });
  }
  return classifyValue(registry, dimension, parsed.value);
}

function readAssignment(value: DimensionAssignment): { status: "unknown" } | { status: "value"; value: string } {
  if (!isRecord(value)) {
    throw new TaxonomyError("invalid-assignment", "A dimension assignment must be an object.");
  }
  if (value.status === "unknown") {
    if (Object.hasOwn(value, "value")) {
      throw new TaxonomyError("invalid-assignment", "Unknown is not a taxonomy value.");
    }
    return { status: "unknown" };
  }
  if (value.status === "value") {
    if (typeof value.value !== "string") {
      throw new TaxonomyError("invalid-value", "A taxonomy value must be a string.");
    }
    return { status: "value", value: value.value };
  }
  throw new TaxonomyError("invalid-assignment", "A dimension assignment must be unknown or a value.");
}

function classifyValue(
  registry: TaxonomyRegistryShape,
  dimension: TaxonomyDimension,
  raw: string,
): ClassifiedDimension {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new TaxonomyError("invalid-value", "A taxonomy value must be a non-empty token.");
  }
  if (trimmed === "unknown") {
    throw new TaxonomyError("reserved-unknown", "Unknown is not a taxonomy value.");
  }

  const token = canonicalTaxonomyToken(trimmed);
  if (token && isAccepted(registry, dimension, token)) {
    return Object.freeze({ dimension, status: "accepted", value: token });
  }
  if (token && isProposed(registry, dimension, token)) {
    throw new TaxonomyError(
      "unaccepted-value",
      `Value "${token}" on ${dimension} is proposed and is not an accepted value.`,
    );
  }
  throw new TaxonomyError("never-proposed", `Value "${trimmed}" on ${dimension} was never proposed.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
