export const TAXONOMY_ERROR_CODES = [
  "unknown-dimension",
  "invalid-value",
  "reserved-unknown",
  "invalid-rationale",
  "invalid-source-record-id",
  "duplicate-proposal",
  "not-proposed",
  "unaccepted-value",
  "never-proposed",
  "invalid-assignment",
] as const;

export type TaxonomyErrorCode = (typeof TAXONOMY_ERROR_CODES)[number];

export class TaxonomyError extends Error {
  readonly code: TaxonomyErrorCode;

  constructor(code: TaxonomyErrorCode, message: string) {
    super(message);
    this.name = "TaxonomyError";
    this.code = code;
  }
}
