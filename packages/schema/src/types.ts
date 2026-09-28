/**
 * Catalog schema 0.1.0.
 * This module proposes contracts. It is not promoted canonical data.
 */

export const SCHEMA_VERSION = "0.1.0" as const;
export type SchemaVersion = typeof SCHEMA_VERSION;

export const MAX_NAME_LENGTH = 120;
export const MAX_STATEMENT_LENGTH = 400;
export const MAX_REASON_LENGTH = 300;
export const MAX_URL_LENGTH = 300;
export const MAX_EXCERPT_QUOTE_LENGTH = 240;
export const MAX_ATTRIBUTION_LENGTH = 120;
export const MAX_PATH_LENGTH = 200;
export const MAX_REVISION_LENGTH = 120;

export type EventId = `evt_${string}`;
export type ProjectId = `prj_${string}`;
export type SubmissionId = `sub_${string}`;
export type RepositoryId = `repo_${string}`;
export type EvidenceId = `evd_${string}`;
export type ClaimId = `clm_${string}`;

export interface UnknownValue {
  status: "unknown";
  reason: string;
}

export interface KnownValue<T> {
  status: "known";
  value: T;
}

export type MaybeKnown<T> = KnownValue<T> | UnknownValue;

export type ClaimBasis =
  | "source-reported"
  | "code-observed"
  | "test-observed"
  | "inferred";

export type ReviewStatus = "unreviewed" | "accepted" | "rejected";

export type EntityKind = "event" | "project" | "submission" | "repository";

export interface EventRecord {
  id: EventId;
  synthetic: boolean;
  name: string;
  startsAt: MaybeKnown<string>;
  endsAt: MaybeKnown<string>;
}

export interface ProjectRecord {
  id: ProjectId;
  synthetic: boolean;
  name: string;
  summary: MaybeKnown<string>;
}

/** A submission links one project to one event. */
export interface SubmissionRecord {
  id: SubmissionId;
  synthetic: boolean;
  projectId: ProjectId;
  eventId: EventId;
  submittedAt: MaybeKnown<string>;
}

/** A repository links to one project. A project may have many repositories. */
export interface RepositoryRecord {
  id: RepositoryId;
  synthetic: boolean;
  projectId: ProjectId;
  locator: MaybeKnown<string>;
}

/**
 * Short third-party quote. This is not a page body and not a code copy.
 * `kind` is fixed so the quote stays labeled as third-party material.
 */
export interface ThirdPartyExcerpt {
  kind: "third-party-excerpt";
  attribution: string;
  quote: string;
}

export interface SourceEvidence {
  id: EvidenceId;
  kind: "source";
  synthetic: boolean;
  sourceUrl: string;
  retrievedAt: string;
  excerpt?: ThirdPartyExcerpt;
}

export interface CodeEvidence {
  id: EvidenceId;
  kind: "code";
  synthetic: boolean;
  repositoryId: RepositoryId;
  /** Commit id of the revision that was inspected. */
  inspectedRevision: string;
  observedAt: string;
  path: MaybeKnown<string>;
}

export interface TestEvidence {
  id: EvidenceId;
  kind: "test";
  synthetic: boolean;
  repositoryId: RepositoryId;
  /** Commit id of the revision that was inspected. */
  inspectedRevision: string;
  observedAt: string;
  result: MaybeKnown<"passed" | "failed">;
}

export type EvidenceRecord = SourceEvidence | CodeEvidence | TestEvidence;

export interface ClaimSubject {
  entity: EntityKind;
  id: EventId | ProjectId | SubmissionId | RepositoryId;
}

interface ClaimBase {
  id: ClaimId;
  synthetic: boolean;
  subject: ClaimSubject;
  statement: string;
  basis: ClaimBasis;
  evidenceIds: EvidenceId[];
  observedAt: string;
  reviewStatus: ReviewStatus;
  sourceUrl: string;
  retrievedAt: string;
  resolution: MaybeKnown<string>;
}

export type ClaimRecord =
  | (ClaimBase & { repositoryInspected: false })
  | (ClaimBase & {
      repositoryInspected: true;
      inspectedCommitId: string;
    });

/**
 * Canonical catalog document. Records in this document are authoritative.
 * Generated indexes are a different document type and are not authoritative.
 */
export interface Catalog {
  schemaVersion: SchemaVersion;
  authority: "canonical-catalog";
  authoritative: true;
  synthetic: boolean;
  datasetLabel: string;
  fixtureWarning?: string;
  events: EventRecord[];
  projects: ProjectRecord[];
  submissions: SubmissionRecord[];
  repositories: RepositoryRecord[];
  evidence: EvidenceRecord[];
  claims: ClaimRecord[];
}

/**
 * Derived view. `authoritative` is fixed to false: a generated index is not
 * a canonical catalog, even when it repeats catalog identifiers.
 */
export interface GeneratedIndex {
  schemaVersion: SchemaVersion;
  authority: "generated-index";
  authoritative: false;
  synthetic: boolean;
  entries: Array<{ label: string }>;
}
