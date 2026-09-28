export { TAXONOMY_DIMENSIONS, isTaxonomyDimension } from "./dimensions.js";
export type { TaxonomyDimension } from "./dimensions.js";
export { TAXONOMY_ERROR_CODES, TaxonomyError } from "./errors.js";
export type { TaxonomyErrorCode } from "./errors.js";
export {
  acceptValue,
  createTaxonomyRegistry,
  isAccepted,
  isProposed,
  listAccepted,
  listProposed,
  proposeValue,
} from "./registry.js";
export { classify } from "./classify.js";
export { assignHackmitTrackFromClaims, hackmitTrackTaxonomy } from "./hackmit-tracks.js";
export {
  MAX_RATIONALE_LENGTH,
  MAX_SOURCE_RECORD_ID_LENGTH,
  MAX_TAXONOMY_VALUE_LENGTH,
} from "./types.js";
export type {
  AcceptValueInput,
  AcceptedClassification,
  AcceptedTaxonomyValue,
  Classification,
  ClassificationResult,
  ClassifiedDimension,
  DimensionAssignment,
  ProposeValueInput,
  ProposedTaxonomyValue,
  TaxonomyRegistry,
  UnknownAssignment,
  UnknownClassification,
  ValueAssignment,
} from "./types.js";
