export const MAX_EXCERPT_QUOTE_LENGTH = 240;
export const MAX_PATH_LENGTH = 200;
export const MAX_REVISION_LENGTH = 120;
export const MAX_NAME_LENGTH = 120;

export const AWARD_NOT_INFERRED_REASON = "An award is never inferred from a repository.";

export type ObservationBasis = "source-reported" | "code-observed" | "unknown";

export type TechnologyRole = "language" | "framework" | "library" | "unknown";

export type RevisionPin =
  | { status: "known"; value: string }
  | { status: "unknown"; reason: string };

export type FileListing = {
  path: string;
};

export type TextExcerpt = {
  path: string;
  quote: string;
};

/**
 * Caller-supplied listings and excerpts. This package does not read a
 * repository from disk or from the network.
 */
export type ObserveRepositoryInput = {
  revision?: string;
  synthetic?: boolean;
  files?: readonly FileListing[];
  excerpts?: readonly TextExcerpt[];
  /**
   * Names to classify against the supplied README prose, manifests, and
   * source paths. A name with no supporting listing stays unknown.
   */
  technologyNames?: readonly string[];
  datasetLabel?: string;
  fixtureWarning?: string;
};

export type TechnologyObservation = {
  name: string;
  role: TechnologyRole;
  basis: ObservationBasis;
  revision: RevisionPin;
  evidencePaths: readonly string[];
  synthetic: boolean;
};

export type AwardObservation = {
  status: "unknown";
  reason: typeof AWARD_NOT_INFERRED_REASON;
};

export type ObservationCounts = {
  /** Always 0. A repository observation is not a project. */
  realProjects: number;
  /** Non-synthetic observations whose basis is source-reported or code-observed. */
  realObservations: number;
  /** Observations produced from input labeled synthetic. */
  syntheticObservations: number;
};

export type ObservationReport = {
  synthetic: boolean;
  revision: RevisionPin;
  observations: readonly TechnologyObservation[];
  languages: readonly TechnologyObservation[];
  frameworks: readonly TechnologyObservation[];
  award: AwardObservation;
  projects: readonly [];
  counts: ObservationCounts;
};
