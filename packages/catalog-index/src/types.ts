export type KnownOrUnknown =
  | { status: "known"; value: string }
  | { status: "unknown"; reason: string };

export type EvidenceKind = "source" | "code" | "test";

export type ClaimBasis = "source-reported" | "code-observed" | "test-observed" | "inferred";

export type ReviewStatus = "unreviewed" | "accepted" | "rejected";

export type IndexedEvidence = {
  id: string;
  kind: EvidenceKind;
  synthetic: boolean;
  sourceUrl?: KnownOrUnknown;
  retrievedAt?: KnownOrUnknown;
  observedAt?: KnownOrUnknown;
  quote?: KnownOrUnknown;
  attribution?: KnownOrUnknown;
  repositoryId?: KnownOrUnknown;
  inspectedRevision?: KnownOrUnknown;
  path?: KnownOrUnknown;
  result?: KnownOrUnknown;
};

export type IndexedSubmission = {
  id: string;
  synthetic: boolean;
  eventId: KnownOrUnknown;
  eventName: KnownOrUnknown;
  submittedAt: KnownOrUnknown;
};

export type IndexedRepository = {
  id: string;
  synthetic: boolean;
  locator: KnownOrUnknown;
};

export type IndexedClaim = {
  id: string;
  synthetic: boolean;
  statement: string;
  basis: ClaimBasis;
  reviewStatus: ReviewStatus;
  evidenceIds:
    | { status: "known"; value: string[] }
    | { status: "unknown"; reason: string };
  sourceUrl: KnownOrUnknown;
  retrievedAt: KnownOrUnknown;
  observedAt: KnownOrUnknown;
  resolution: KnownOrUnknown;
};

export type UnknownField = {
  field: string;
  reason: string;
};

export type RecordDetails = {
  sourceFacts: {
    title: KnownOrUnknown;
    summary: KnownOrUnknown;
    synthetic: KnownOrUnknown;
  };
  evidence: IndexedEvidence[];
  submissions: IndexedSubmission[];
  repositories: IndexedRepository[];
  claims: IndexedClaim[];
  unknowns: UnknownField[];
};

export type CatalogRecord = {
  id: string;
  title: string;
  summary: string;
  synthetic: boolean;
  searchText: string;
  details: RecordDetails;
};

export type RecordCounts = {
  real: number;
  synthetic: number;
};

export type SearchHit = {
  id: string;
  title: string;
  summary: string;
  synthetic: boolean;
};

export type BuildIndexOptions = {
  catalogDir: string;
  dbPath: string;
};

export type ListFilters = {
  query?: string;
  basis?: "" | "unknown" | ClaimBasis;
  reviewStatus?: "" | "unknown" | ReviewStatus;
  eventId?: string;
  repository?: "" | "unknown" | "known";
  /** "known" requires an award, prize, or winner claim. "unknown" requires none. */
  award?: "" | "unknown" | "known";
  /** "unknown" requires no track claim. Any other value must appear in a track claim. */
  track?: string;
};
