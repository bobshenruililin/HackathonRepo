import type { TaxonomyDimension } from "./dimensions.js";

export const MAX_TAXONOMY_VALUE_LENGTH = 80;
export const MAX_RATIONALE_LENGTH = 300;
export const MAX_SOURCE_RECORD_ID_LENGTH = 120;

export type ProposedTaxonomyValue = {
  readonly status: "proposed";
  readonly dimension: TaxonomyDimension;
  readonly value: string;
  readonly rationale: string;
  readonly sourceRecordId: string;
};

export type AcceptedTaxonomyValue = {
  readonly status: "accepted";
  readonly dimension: TaxonomyDimension;
  readonly value: string;
  readonly rationale: string;
  readonly sourceRecordId: string;
};

export type TaxonomyRegistry = {
  readonly proposals: readonly ProposedTaxonomyValue[];
  readonly accepted: readonly AcceptedTaxonomyValue[];
};

export type ProposeValueInput = {
  readonly dimension: TaxonomyDimension;
  readonly value: string;
  readonly rationale: string;
  readonly sourceRecordId: string;
};

export type AcceptValueInput = {
  readonly dimension: TaxonomyDimension;
  readonly value: string;
};

export type UnknownAssignment = {
  readonly status: "unknown";
};

export type ValueAssignment = {
  readonly status: "value";
  readonly value: string;
};

export type DimensionAssignment = UnknownAssignment | ValueAssignment;

export type Classification = {
  readonly [Dimension in TaxonomyDimension]?: DimensionAssignment;
};

export type UnknownClassification = {
  readonly dimension: TaxonomyDimension;
  readonly status: "unknown";
};

export type AcceptedClassification = {
  readonly dimension: TaxonomyDimension;
  readonly status: "accepted";
  readonly value: string;
};

export type ClassifiedDimension = UnknownClassification | AcceptedClassification;

export type ClassificationResult = {
  readonly dimensions: readonly ClassifiedDimension[];
};
