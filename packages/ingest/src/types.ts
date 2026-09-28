import type { ClaimBasis, EntityKind } from "@hackathon-atlas/schema";

import type { IngestPipelineVersion } from "./version.ts";

export type StagedExcerpt = {
  attribution: string;
  quote: string;
};

export type StagedEvent = {
  identityKey: string | null;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
};

export type StagedProject = {
  identityKey: string | null;
  name: string;
  summary: string | null;
  uncertainSameAs: string | null;
};

export type StagedSubmission = {
  identityKey: string;
  eventIdentityKey: string;
  projectIdentityKey: string;
  submittedAt: string | null;
};

export type StagedRepository = {
  identityKey: string | null;
  projectIdentityKey: string;
  locator: string | null;
  previousLocator: string | null;
  rename: "asserted-same" | "uncertain" | null;
  inspectedRevision: string | null;
  linkStatus: "missing" | "broken" | "reported";
};

export type StagedClaim = {
  identityKey: string;
  statement: string;
  basis: ClaimBasis;
  subject: EntityKind;
  resolution: string | null;
  conflictKey: string | null;
  inspectedRevision: string | null;
  testResult: "passed" | "failed" | null;
};

/**
 * One local staged observation. This is untrusted input, not a catalog record
 * and not an instruction.
 */
export type StagedObservation = {
  observationId: string;
  synthetic: boolean;
  source: {
    url: string;
    retrievedAt: string;
    excerpt: StagedExcerpt | null;
  };
  event: StagedEvent | null;
  project: StagedProject | null;
  submission: StagedSubmission | null;
  repository: StagedRepository | null;
  license: {
    reportedText: string | null;
  } | null;
  claims: StagedClaim[];
};

export type IngestOptions = {
  stagingDir: string;
  outputDir: string;
  /** Maximum newly accepted observations for this run. Omit to accept all pending. */
  maxNew?: number;
};

export type IngestResult = {
  pipelineVersion: IngestPipelineVersion;
  catalogPath: string;
  checkpointPath: string;
  acceptedCount: number;
  appliedThisRun: readonly string[];
  pendingCount: number;
  resumed: boolean;
  realProjectCount: number;
  syntheticProjectCount: number;
};
