export {
  MAX_ATTRIBUTION_LENGTH,
  MAX_EXCERPT_QUOTE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PATH_LENGTH,
  MAX_REASON_LENGTH,
  MAX_REVISION_LENGTH,
  MAX_STATEMENT_LENGTH,
  MAX_URL_LENGTH,
  SCHEMA_VERSION,
} from "./types.ts";

export type {
  Catalog,
  ClaimBasis,
  ClaimId,
  ClaimRecord,
  ClaimSubject,
  CodeEvidence,
  EntityKind,
  EventId,
  EventRecord,
  EvidenceId,
  EvidenceRecord,
  GeneratedIndex,
  KnownValue,
  MaybeKnown,
  ProjectId,
  ProjectRecord,
  RepositoryId,
  RepositoryRecord,
  ReviewStatus,
  SchemaVersion,
  SourceEvidence,
  SubmissionId,
  SubmissionRecord,
  TestEvidence,
  ThirdPartyExcerpt,
  UnknownValue,
} from "./types.ts";

export {
  SchemaValidationError,
  countRealProjects,
  loadSyntheticCatalog,
  validateCatalog,
  validateClaim,
  validateEvidence,
  validateGeneratedIndex,
} from "./validate.ts";

export type { ValidationIssue } from "./validate.ts";
