/**
 * Closed dimension list. A new dimension belongs in this list only after a
 * recorded proposal. This package has no function that adds a dimension.
 */
export const TAXONOMY_DIMENSIONS = [
  "problem-domain",
  "target-user",
  "product-archetype",
  "interaction-paradigm",
  "ai-role",
  "technical-mechanism",
  "data-source",
  "physical-digital-context",
  "deployment-mode",
  "demo-mechanism",
  "novelty-dimension",
  "implementation-evidence-level",
] as const;

export type TaxonomyDimension = (typeof TAXONOMY_DIMENSIONS)[number];

const DIMENSION_SET: ReadonlySet<string> = new Set(TAXONOMY_DIMENSIONS);

export function isTaxonomyDimension(value: string): value is TaxonomyDimension {
  return DIMENSION_SET.has(value);
}
