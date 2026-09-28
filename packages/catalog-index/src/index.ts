export { buildIndex } from "./build-index.js";
export { countRecords } from "./count-records.js";
export { MissingIndexError } from "./errors.js";
export { getRecord } from "./get-record.js";
export { listRecords } from "./list-records.js";
export { searchRecords } from "./search-records.js";
export type {
  BuildIndexOptions,
  CatalogRecord,
  ClaimBasis,
  IndexedClaim,
  IndexedEvidence,
  IndexedRepository,
  IndexedSubmission,
  KnownOrUnknown,
  ListFilters,
  RecordCounts,
  RecordDetails,
  ReviewStatus,
  SearchHit,
  UnknownField,
} from "./types.js";
