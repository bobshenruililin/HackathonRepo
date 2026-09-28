import {
  MAX_STATEMENT_LENGTH,
  SCHEMA_VERSION,
  validateCatalog,
  type Catalog,
  type ClaimRecord,
  type ClaimSubject,
  type CodeEvidence,
  type EventId,
  type EventRecord,
  type EvidenceId,
  type EvidenceRecord,
  type MaybeKnown,
  type ProjectId,
  type ProjectRecord,
  type RepositoryId,
  type RepositoryRecord,
  type SourceEvidence,
  type SubmissionId,
  type SubmissionRecord,
  type TestEvidence,
} from "@hackathon-atlas/schema";

import { IngestError } from "./errors.ts";
import { compareText, stableId } from "./ids.ts";
import type { StagedClaim, StagedObservation } from "./types.ts";

const MISSING_SUMMARY = "No summary was staged for this project.";
const CONFLICT_SUMMARY = "Conflicting summaries were staged. Ingest did not choose one.";
const MISSING_START = "No start time was staged for this event.";
const CONFLICT_START = "Conflicting start times were staged. Ingest did not choose one.";
const MISSING_END = "No end time was staged for this event.";
const CONFLICT_END = "Conflicting end times were staged. Ingest did not choose one.";
const MISSING_SUBMITTED = "No submission time was staged.";
const CONFLICT_SUBMITTED = "Conflicting submission times were staged. Ingest did not choose one.";
const MISSING_LOCATOR = "No repository locator was staged.";
const CONFLICT_LOCATOR = "Conflicting repository locators were staged. Ingest did not choose one.";
const INVALID_LOCATOR = "The staged locator was not a valid https URL. No replacement was selected.";
const BROKEN_LINK = "No replacement locator was selected.";
const NAME_COLLISION = "The same project name was staged under more than one identity. Ingest did not merge them.";
const UNCERTAIN_PROJECT = "A possible match was staged and was not confirmed. Ingest did not merge the projects.";
const UNCERTAIN_RENAME = "A rename was suggested and was not confirmed. Ingest did not merge the repositories.";
const LICENSE_UNKNOWN = "No license was selected. A staged license value was not copied into the catalog.";
const CLAIM_CONFLICT = "Another staged claim conflicts. Ingest did not choose a winner.";
const MISSING_RESOLUTION = "No resolution was staged.";
const MISSING_PATH = "No code path was staged for this revision.";
const MISSING_RESULT = "No test result was staged for this revision.";

type LocatorKind = "missing" | "broken" | "conflict" | "reported" | "invalid" | "renamed";

type EvidenceRef = {
  evidenceId: EvidenceId;
  sourceUrl: string;
  retrievedAt: string;
  synthetic: boolean;
};

type EventFold = EvidenceRef & {
  mapKey: string;
  id: EventId;
  name: string;
  startsAt: MaybeKnown<string>;
  endsAt: MaybeKnown<string>;
  assertedIdentityKey: string | null;
  disputed: boolean;
  observationIds: string[];
};

type ProjectFold = EvidenceRef & {
  mapKey: string;
  id: ProjectId;
  name: string;
  summary: MaybeKnown<string>;
  assertedIdentityKey: string | null;
  disputed: boolean;
  observationIds: string[];
};

type SubmissionFold = EvidenceRef & {
  mapKey: string;
  id: SubmissionId;
  projectId: ProjectId;
  eventId: EventId;
  submittedAt: MaybeKnown<string>;
  observationIds: string[];
};

type RepoVote = EvidenceRef & {
  observationId: string;
  linkStatus: "missing" | "broken" | "reported";
  locator: string | null;
  invalidLocator: boolean;
  previousLocator: string | null;
  rename: "asserted-same" | "uncertain" | null;
  inspectedRevision: string | null;
};

type RepoFold = {
  mapKey: string;
  id: RepositoryId;
  synthetic: boolean;
  projectId: ProjectId;
  assertedIdentityKey: string | null;
  disputed: boolean;
  votes: RepoVote[];
  observationIds: string[];
};

function unknown(reason: string): MaybeKnown<string> {
  return { status: "unknown", reason };
}

function known(value: string): MaybeKnown<string> {
  return { status: "known", value };
}

function isHttpsUrl(value: string): boolean {
  return /^https:\/\/[^\s]+$/.test(value);
}

function mergeText(
  current: MaybeKnown<string>,
  incoming: string | null,
  missingReason: string,
  conflictReason: string,
): MaybeKnown<string> {
  if (incoming == null) return current.status === "unknown" ? unknown(missingReason) : current;
  if (current.status === "unknown") return known(incoming);
  if (current.value === incoming) return current;
  return unknown(conflictReason);
}

function sourceEvidenceId(observationId: string): EvidenceId {
  return stableId("evd_", `source\0${observationId}`);
}

function eventMapKey(observation: StagedObservation, all: readonly StagedObservation[]): string | null {
  if (!observation.event) return null;
  const key = observation.event.identityKey;
  if (!key) return `solo:${observation.observationId}`;
  const names = new Set(
    all.filter((item) => item.event?.identityKey === key).map((item) => item.event?.name),
  );
  if (names.size > 1) return `unresolved:${observation.observationId}:${key}`;
  return `asserted:${key}`;
}

function projectMapKey(observation: StagedObservation, all: readonly StagedObservation[]): string | null {
  if (!observation.project) return null;
  const key = observation.project.identityKey;
  if (!key) return `solo:${observation.observationId}`;
  const names = new Set(
    all.filter((item) => item.project?.identityKey === key).map((item) => item.project?.name),
  );
  if (names.size > 1) return `unresolved:${observation.observationId}:${key}`;
  return `asserted:${key}`;
}

function submissionMapKey(observation: StagedObservation, all: readonly StagedObservation[]): string | null {
  if (!observation.submission) return null;
  const key = observation.submission.identityKey;
  const links = new Set(
    all
      .filter((item) => item.submission?.identityKey === key)
      .map((item) => `${item.submission?.projectIdentityKey}\0${item.submission?.eventIdentityKey}`),
  );
  if (links.size > 1) return `unresolved:${observation.observationId}:${key}`;
  return `asserted:${key}`;
}

function repositoryMapKey(observation: StagedObservation, all: readonly StagedObservation[]): string | null {
  if (!observation.repository) return null;
  const key = observation.repository.identityKey;
  if (!key) return `solo:${observation.observationId}`;
  const group = all.filter((item) => item.repository?.identityKey === key);
  const uncertain = group.some((item) => item.repository?.rename === "uncertain");
  const projects = new Set(group.map((item) => item.repository?.projectIdentityKey));
  if ((uncertain && group.length > 1) || projects.size > 1) {
    return `unresolved:${observation.observationId}:${key}`;
  }
  return `asserted:${key}`;
}

function refFor(observation: StagedObservation): EvidenceRef {
  return {
    evidenceId: sourceEvidenceId(observation.observationId),
    sourceUrl: observation.source.url,
    retrievedAt: observation.source.retrievedAt,
    synthetic: observation.synthetic,
  };
}

function findOwned<T extends { observationIds: string[]; assertedIdentityKey: string | null; disputed: boolean }>(
  folds: readonly T[],
  observationId: string,
  identityKey: string,
): T | undefined {
  return folds.find(
    (fold) => fold.observationIds.includes(observationId) && fold.assertedIdentityKey === identityKey,
  );
}

function findUnique<T extends { assertedIdentityKey: string | null; disputed: boolean }>(
  folds: readonly T[],
  identityKey: string,
  label: string,
): T {
  const matches = folds.filter((fold) => fold.assertedIdentityKey === identityKey);
  const only = matches[0];
  if (matches.length === 1 && only && !only.disputed) return only;
  if (matches.length === 0) {
    throw new IngestError(`${label} identity "${identityKey}" was not staged. Ingest did not invent a record.`);
  }
  throw new IngestError(`${label} identity "${identityKey}" is unresolved. Ingest did not guess a link.`);
}

function resolveProject(
  observation: StagedObservation,
  identityKey: string,
  projects: readonly ProjectFold[],
): ProjectFold {
  return (
    findOwned(projects, observation.observationId, identityKey) ??
    findUnique(projects, identityKey, "Project")
  );
}

function resolveEvent(
  observation: StagedObservation,
  identityKey: string,
  events: readonly EventFold[],
): EventFold {
  return (
    findOwned(events, observation.observationId, identityKey) ?? findUnique(events, identityKey, "Event")
  );
}

function decideLocator(votes: readonly RepoVote[]): { locator: MaybeKnown<string>; kind: LocatorKind } {
  const asserted = [
    ...new Set(
      votes
        .filter((vote) => vote.rename === "asserted-same" && vote.locator)
        .map((vote) => vote.locator as string),
    ),
  ];
  const urls = [...new Set(votes.flatMap((vote) => (vote.locator ? [vote.locator] : [])))];
  const broken = votes.some((vote) => vote.linkStatus === "broken");
  if (asserted.length > 1 || (asserted.length === 0 && urls.length > 1)) {
    return { locator: unknown(CONFLICT_LOCATOR), kind: "conflict" };
  }
  const chosen = asserted[0] ?? urls[0];
  if (chosen && asserted.length === 1) {
    return { locator: known(chosen), kind: broken ? "broken" : "renamed" };
  }
  if (chosen) {
    return { locator: known(chosen), kind: broken ? "broken" : "reported" };
  }
  if (votes.some((vote) => vote.invalidLocator) || (broken && !chosen)) {
    return { locator: unknown(INVALID_LOCATOR), kind: "invalid" };
  }
  return { locator: unknown(MISSING_LOCATOR), kind: "missing" };
}

function sourceClaim(args: {
  id: ClaimRecord["id"];
  synthetic: boolean;
  subject: ClaimSubject;
  statement: string;
  evidenceId: EvidenceId;
  sourceUrl: string;
  retrievedAt: string;
  resolution: MaybeKnown<string>;
}): ClaimRecord {
  return {
    id: args.id,
    synthetic: args.synthetic,
    subject: args.subject,
    statement: args.statement,
    basis: "source-reported",
    evidenceIds: [args.evidenceId],
    observedAt: args.retrievedAt,
    reviewStatus: "unreviewed",
    sourceUrl: args.sourceUrl,
    retrievedAt: args.retrievedAt,
    repositoryInspected: false,
    resolution: args.resolution,
  };
}

function resolutionOf(value: string | null): MaybeKnown<string> {
  if (value == null) return unknown(MISSING_RESOLUTION);
  return known(value);
}

export function materialize(observations: readonly StagedObservation[]): Catalog {
  const ordered = [...observations].sort((left, right) => compareText(left.observationId, right.observationId));
  const events = new Map<string, EventFold>();
  const projects = new Map<string, ProjectFold>();
  const submissions = new Map<string, SubmissionFold>();
  const repositories = new Map<string, RepoFold>();

  for (const observation of ordered) {
    const reference = refFor(observation);
    const eventKey = eventMapKey(observation, ordered);
    if (observation.event && eventKey) {
      const existing = events.get(eventKey);
      const disputed = eventKey.startsWith("unresolved:");
      if (!existing) {
        events.set(eventKey, {
          ...reference,
          mapKey: eventKey,
          id: stableId("evt_", `event\0${eventKey}`),
          name: observation.event.name,
          startsAt: observation.event.startsAt == null ? unknown(MISSING_START) : known(observation.event.startsAt),
          endsAt: observation.event.endsAt == null ? unknown(MISSING_END) : known(observation.event.endsAt),
          assertedIdentityKey: observation.event.identityKey,
          disputed,
          observationIds: [observation.observationId],
          synthetic: observation.synthetic,
        });
      } else {
        existing.synthetic = existing.synthetic || observation.synthetic;
        existing.observationIds.push(observation.observationId);
        existing.startsAt = mergeText(existing.startsAt, observation.event.startsAt, MISSING_START, CONFLICT_START);
        existing.endsAt = mergeText(existing.endsAt, observation.event.endsAt, MISSING_END, CONFLICT_END);
      }
    }

    const projectKey = projectMapKey(observation, ordered);
    if (observation.project && projectKey) {
      const existing = projects.get(projectKey);
      const disputed = projectKey.startsWith("unresolved:");
      if (!existing) {
        projects.set(projectKey, {
          ...reference,
          mapKey: projectKey,
          id: stableId("prj_", `project\0${projectKey}`),
          name: observation.project.name,
          summary: observation.project.summary == null ? unknown(MISSING_SUMMARY) : known(observation.project.summary),
          assertedIdentityKey: observation.project.identityKey,
          disputed,
          observationIds: [observation.observationId],
          synthetic: observation.synthetic,
        });
      } else {
        existing.synthetic = existing.synthetic || observation.synthetic;
        existing.observationIds.push(observation.observationId);
        existing.summary = mergeText(existing.summary, observation.project.summary, MISSING_SUMMARY, CONFLICT_SUMMARY);
      }
    }
  }

  const projectFolds = [...projects.values()];
  const eventFolds = [...events.values()];

  for (const observation of ordered) {
    const reference = refFor(observation);
    const submissionKey = submissionMapKey(observation, ordered);
    if (observation.submission && submissionKey) {
      const project = resolveProject(observation, observation.submission.projectIdentityKey, projectFolds);
      const event = resolveEvent(observation, observation.submission.eventIdentityKey, eventFolds);
      const existing = submissions.get(submissionKey);
      if (!existing) {
        submissions.set(submissionKey, {
          ...reference,
          mapKey: submissionKey,
          id: stableId("sub_", `submission\0${submissionKey}`),
          projectId: project.id,
          eventId: event.id,
          submittedAt:
            observation.submission.submittedAt == null
              ? unknown(MISSING_SUBMITTED)
              : known(observation.submission.submittedAt),
          observationIds: [observation.observationId],
          synthetic: observation.synthetic || project.synthetic || event.synthetic,
        });
      } else {
        existing.synthetic = existing.synthetic || observation.synthetic;
        existing.observationIds.push(observation.observationId);
        existing.submittedAt = mergeText(
          existing.submittedAt,
          observation.submission.submittedAt,
          MISSING_SUBMITTED,
          CONFLICT_SUBMITTED,
        );
      }
    }

    const repositoryKey = repositoryMapKey(observation, ordered);
    if (observation.repository && repositoryKey) {
      const project = resolveProject(observation, observation.repository.projectIdentityKey, projectFolds);
      const locator = observation.repository.locator;
      const previous = observation.repository.previousLocator;
      const vote: RepoVote = {
        ...reference,
        observationId: observation.observationId,
        linkStatus: observation.repository.linkStatus,
        locator: locator != null && isHttpsUrl(locator) ? locator : null,
        invalidLocator: locator != null && !isHttpsUrl(locator),
        previousLocator: previous != null && isHttpsUrl(previous) ? previous : null,
        rename: observation.repository.rename,
        inspectedRevision: observation.repository.inspectedRevision,
        synthetic: observation.synthetic || project.synthetic,
      };
      const existing = repositories.get(repositoryKey);
      const disputed = repositoryKey.startsWith("unresolved:");
      if (!existing) {
        repositories.set(repositoryKey, {
          mapKey: repositoryKey,
          id: stableId("repo_", `repository\0${repositoryKey}`),
          synthetic: vote.synthetic,
          projectId: project.id,
          assertedIdentityKey: observation.repository.identityKey,
          disputed,
          votes: [vote],
          observationIds: [observation.observationId],
        });
      } else {
        existing.synthetic = existing.synthetic || vote.synthetic;
        existing.votes.push(vote);
        existing.observationIds.push(observation.observationId);
      }
    }
  }

  const evidence: EvidenceRecord[] = [];
  const evidenceIds = new Set<string>();
  const claims: ClaimRecord[] = [];
  const conflictKeys = new Map<string, string>();

  function addEvidence(record: EvidenceRecord): void {
    if (evidenceIds.has(record.id)) return;
    evidenceIds.add(record.id);
    evidence.push(record);
  }

  for (const observation of ordered) {
    const source: SourceEvidence = {
      id: sourceEvidenceId(observation.observationId),
      kind: "source",
      synthetic: observation.synthetic,
      sourceUrl: observation.source.url,
      retrievedAt: observation.source.retrievedAt,
      ...(observation.source.excerpt
        ? {
            excerpt: {
              kind: "third-party-excerpt" as const,
              attribution: observation.source.excerpt.attribution,
              quote: observation.source.excerpt.quote,
            },
          }
        : {}),
    };
    addEvidence(source);
  }

  for (const observation of ordered) {
    const projectKey = projectMapKey(observation, ordered);
    const project = projectKey ? projects.get(projectKey) : undefined;
    if (project && project.observationIds[0] === observation.observationId) {
      claims.push(
        sourceClaim({
          id: stableId("clm_", `project-name\0${project.id}`),
          synthetic: project.synthetic,
          subject: { entity: "project", id: project.id },
          statement: `The staged project name is ${project.name}.`,
          evidenceId: project.evidenceId,
          sourceUrl: project.sourceUrl,
          retrievedAt: project.retrievedAt,
          resolution: known(project.name),
        }),
      );
    }
    if (observation.project?.uncertainSameAs && project) {
      claims.push(
        sourceClaim({
          id: stableId("clm_", `uncertain-project\0${observation.observationId}`),
          synthetic: observation.synthetic || project.synthetic,
          subject: { entity: "project", id: project.id },
          statement: "Whether this project is the same as another staged identity is unresolved.",
          evidenceId: sourceEvidenceId(observation.observationId),
          sourceUrl: observation.source.url,
          retrievedAt: observation.source.retrievedAt,
          resolution: unknown(UNCERTAIN_PROJECT),
        }),
      );
    }
    if (observation.license && project) {
      claims.push(
        sourceClaim({
          id: stableId("clm_", `license\0${observation.observationId}`),
          synthetic: observation.synthetic || project.synthetic,
          subject: { entity: "project", id: project.id },
          statement: "The license is unknown.",
          evidenceId: sourceEvidenceId(observation.observationId),
          sourceUrl: observation.source.url,
          retrievedAt: observation.source.retrievedAt,
          resolution: unknown(LICENSE_UNKNOWN),
        }),
      );
    } else if (observation.license) {
      throw new IngestError(
        `${observation.observationId}: A license note requires a project. Ingest did not select a license.`,
      );
    }

    const event = eventMapKey(observation, ordered) ? events.get(eventMapKey(observation, ordered) as string) : undefined;
    const submissionKey = submissionMapKey(observation, ordered);
    const submission = submissionKey ? submissions.get(submissionKey) : undefined;
    const repositoryKey = repositoryMapKey(observation, ordered);
    const repository = repositoryKey ? repositories.get(repositoryKey) : undefined;
    for (const claim of observation.claims) {
      claims.push(
        buildUserClaim(observation, claim, {
          eventId: event?.id,
          projectId: project?.id,
          submissionId: submission?.id,
          repositoryId: repository?.id,
        }, addEvidence, conflictKeys),
      );
    }
  }

  const projectList = [...projects.values()];
  const names = new Map<string, ProjectFold[]>();
  for (const project of projectList) {
    const group = names.get(project.name) ?? [];
    group.push(project);
    names.set(project.name, group);
  }
  for (const group of names.values()) {
    const ids = new Set(group.map((project) => project.id));
    if (ids.size < 2) continue;
    for (const project of group) {
      claims.push(
        sourceClaim({
          id: stableId("clm_", `name-collision\0${project.id}`),
          synthetic: project.synthetic,
          subject: { entity: "project", id: project.id },
          statement: "Whether this project is the same as another staged project with the same name is unresolved.",
          evidenceId: project.evidenceId,
          sourceUrl: project.sourceUrl,
          retrievedAt: project.retrievedAt,
          resolution: unknown(NAME_COLLISION),
        }),
      );
    }
  }

  for (const repository of repositories.values()) {
    const decision = decideLocator(repository.votes);
    const earliest = [...repository.votes].sort((left, right) => compareText(left.observationId, right.observationId))[0];
    if (!earliest) continue;
    if (decision.kind === "conflict") {
      claims.push(
        sourceClaim({
          id: stableId("clm_", `locator-conflict\0${repository.id}`),
          synthetic: repository.synthetic,
          subject: { entity: "repository", id: repository.id },
          statement: "The repository locator is unresolved.",
          evidenceId: earliest.evidenceId,
          sourceUrl: earliest.sourceUrl,
          retrievedAt: earliest.retrievedAt,
          resolution: decision.locator,
        }),
      );
    } else if (decision.kind === "invalid" || decision.kind === "missing") {
      claims.push(
        sourceClaim({
          id: stableId("clm_", `locator-unknown\0${repository.id}`),
          synthetic: repository.synthetic,
          subject: { entity: "repository", id: repository.id },
          statement: "The repository locator is unknown.",
          evidenceId: earliest.evidenceId,
          sourceUrl: earliest.sourceUrl,
          retrievedAt: earliest.retrievedAt,
          resolution: decision.locator,
        }),
      );
    }
    if (repository.votes.some((vote) => vote.linkStatus === "broken")) {
      const brokenVote = [...repository.votes]
        .filter((vote) => vote.linkStatus === "broken")
        .sort((left, right) => compareText(left.observationId, right.observationId))[0];
      if (brokenVote) {
        claims.push(
          sourceClaim({
            id: stableId("clm_", `broken-link\0${repository.id}`),
            synthetic: repository.synthetic,
            subject: { entity: "repository", id: repository.id },
            statement: "The staged observation reported this repository link as broken.",
            evidenceId: brokenVote.evidenceId,
            sourceUrl: brokenVote.sourceUrl,
            retrievedAt: brokenVote.retrievedAt,
            resolution: unknown(BROKEN_LINK),
          }),
        );
      }
    }
    const asserted = repository.votes.find((vote) => vote.rename === "asserted-same" && vote.locator);
    if (asserted && decision.kind !== "conflict" && decision.locator.status === "known") {
      const base = "The staged observation reports that this repository locator replaced a previous locator.";
      const withPrevious = asserted.previousLocator ? `${base} Previous locator: ${asserted.previousLocator}.` : base;
      claims.push(
        sourceClaim({
          id: stableId("clm_", `rename\0${repository.id}`),
          synthetic: repository.synthetic,
          subject: { entity: "repository", id: repository.id },
          statement: withPrevious.length <= MAX_STATEMENT_LENGTH ? withPrevious : base,
          evidenceId: asserted.evidenceId,
          sourceUrl: asserted.sourceUrl,
          retrievedAt: asserted.retrievedAt,
          resolution: known(decision.locator.value),
        }),
      );
    }
    if (repository.votes.some((vote) => vote.rename === "uncertain")) {
      const uncertainVote = [...repository.votes]
        .filter((vote) => vote.rename === "uncertain")
        .sort((left, right) => compareText(left.observationId, right.observationId))[0];
      if (uncertainVote) {
        claims.push(
          sourceClaim({
            id: stableId("clm_", `uncertain-rename\0${repository.id}`),
            synthetic: repository.synthetic,
            subject: { entity: "repository", id: repository.id },
            statement: "Whether this repository is a rename of another repository is unresolved.",
            evidenceId: uncertainVote.evidenceId,
            sourceUrl: uncertainVote.sourceUrl,
            retrievedAt: uncertainVote.retrievedAt,
            resolution: unknown(UNCERTAIN_RENAME),
          }),
        );
      }
    }
    for (const vote of repository.votes) {
      if (!vote.inspectedRevision) continue;
      addEvidence(codeEvidence(vote, repository.id, vote.inspectedRevision));
      claims.push(
        inspectedClaim({
          id: stableId("clm_", `revision\0${vote.observationId}\0${vote.inspectedRevision}`),
          synthetic: vote.synthetic,
          subject: { entity: "repository", id: repository.id },
          statement: "An inspected revision was staged for this repository.",
          basis: "code-observed",
          evidenceId: stableId("evd_", `code\0${vote.observationId}\0${vote.inspectedRevision}`),
          sourceUrl: vote.sourceUrl,
          retrievedAt: vote.retrievedAt,
          inspectedCommitId: vote.inspectedRevision,
          resolution: known(vote.inspectedRevision),
        }),
      );
    }
  }

  const conflictGroups = new Map<string, ClaimRecord[]>();
  for (const claim of claims) {
    const key = conflictKeys.get(claim.id);
    if (!key) continue;
    const group = conflictGroups.get(key) ?? [];
    group.push(claim);
    conflictGroups.set(key, group);
  }
  for (const group of conflictGroups.values()) {
    const statements = new Set(group.map((claim) => claim.statement));
    if (statements.size < 2) continue;
    for (const claim of group) {
      claim.resolution = unknown(CLAIM_CONFLICT);
    }
  }

  const allSynthetic = ordered.every((observation) => observation.synthetic);
  const catalog = {
    schemaVersion: SCHEMA_VERSION,
    authority: "canonical-catalog" as const,
    authoritative: true as const,
    synthetic: allSynthetic,
    datasetLabel: allSynthetic ? "synthetic-fixtures" : "staged-observations",
    ...(allSynthetic
      ? {
          fixtureWarning:
            "SYNTHETIC FIXTURE. Not a real project. Do not count these records as real projects.",
        }
      : {}),
    events: eventFolds
      .map((fold) => toEvent(fold))
      .sort((left, right) => compareText(left.id, right.id)),
    projects: projectList
      .map((fold) => toProject(fold))
      .sort((left, right) => compareText(left.id, right.id)),
    submissions: [...submissions.values()]
      .map((fold) => toSubmission(fold))
      .sort((left, right) => compareText(left.id, right.id)),
    repositories: [...repositories.values()]
      .map((fold) => toRepository(fold))
      .sort((left, right) => compareText(left.id, right.id)),
    evidence: evidence.sort((left, right) => compareText(left.id, right.id)),
    claims: claims.sort((left, right) => compareText(left.id, right.id)),
  };
  return validateCatalog(catalog);
}

function toEvent(fold: EventFold): EventRecord {
  return {
    id: fold.id,
    synthetic: fold.synthetic,
    name: fold.name,
    startsAt: fold.startsAt,
    endsAt: fold.endsAt,
  };
}

function toProject(fold: ProjectFold): ProjectRecord {
  return {
    id: fold.id,
    synthetic: fold.synthetic,
    name: fold.name,
    summary: fold.summary,
  };
}

function toSubmission(fold: SubmissionFold): SubmissionRecord {
  return {
    id: fold.id,
    synthetic: fold.synthetic,
    projectId: fold.projectId,
    eventId: fold.eventId,
    submittedAt: fold.submittedAt,
  };
}

function toRepository(fold: RepoFold): RepositoryRecord {
  return {
    id: fold.id,
    synthetic: fold.synthetic,
    projectId: fold.projectId,
    locator: decideLocator(fold.votes).locator,
  };
}

function codeEvidence(vote: RepoVote, repositoryId: RepositoryId, revision: string): CodeEvidence {
  return {
    id: stableId("evd_", `code\0${vote.observationId}\0${revision}`),
    kind: "code",
    synthetic: vote.synthetic,
    repositoryId,
    inspectedRevision: revision,
    observedAt: vote.retrievedAt,
    path: unknown(MISSING_PATH),
  };
}

function inspectedClaim(args: {
  id: ClaimRecord["id"];
  synthetic: boolean;
  subject: ClaimSubject;
  statement: string;
  basis: "code-observed" | "test-observed" | "inferred";
  evidenceId: EvidenceId;
  sourceUrl: string;
  retrievedAt: string;
  inspectedCommitId: string;
  resolution: MaybeKnown<string>;
}): ClaimRecord {
  return {
    id: args.id,
    synthetic: args.synthetic,
    subject: args.subject,
    statement: args.statement,
    basis: args.basis,
    evidenceIds: [args.evidenceId],
    observedAt: args.retrievedAt,
    reviewStatus: "unreviewed",
    sourceUrl: args.sourceUrl,
    retrievedAt: args.retrievedAt,
    repositoryInspected: true,
    inspectedCommitId: args.inspectedCommitId,
    resolution: args.resolution,
  };
}

function buildUserClaim(
  observation: StagedObservation,
  claim: StagedClaim,
  ids: {
    eventId: EventId | undefined;
    projectId: ProjectId | undefined;
    submissionId: SubmissionId | undefined;
    repositoryId: RepositoryId | undefined;
  },
  addEvidence: (record: EvidenceRecord) => void,
  conflictKeys: Map<string, string>,
): ClaimRecord {
  const subjectId = {
    event: ids.eventId,
    project: ids.projectId,
    submission: ids.submissionId,
    repository: ids.repositoryId,
  }[claim.subject];
  if (!subjectId) {
    throw new IngestError(
      `${observation.observationId}: Claim "${claim.identityKey}" refers to a ${claim.subject} that was not staged. Ingest did not invent one.`,
    );
  }
  const reference = refFor(observation);
  const id = stableId("clm_", `claim\0${observation.observationId}\0${claim.identityKey}`);
  if (claim.conflictKey) conflictKeys.set(id, claim.conflictKey);
  const inspected =
    claim.basis === "code-observed" ||
    claim.basis === "test-observed" ||
    (claim.basis === "inferred" && claim.inspectedRevision != null);
  if (!inspected) {
    const record = sourceClaim({
      id,
      synthetic: observation.synthetic,
      subject: { entity: claim.subject, id: subjectId },
      statement: claim.statement,
      evidenceId: reference.evidenceId,
      sourceUrl: reference.sourceUrl,
      retrievedAt: reference.retrievedAt,
      resolution: resolutionOf(claim.resolution),
    });
    if (claim.basis === "inferred") {
      return { ...record, basis: "inferred" };
    }
    return record;
  }
  if (!claim.inspectedRevision || !ids.repositoryId) {
    throw new IngestError(
      `${observation.observationId}: Claim "${claim.identityKey}" inspected a repository that was not staged. Ingest did not invent a commit id.`,
    );
  }
  if (claim.basis === "test-observed") {
    const testRecord: TestEvidence = {
      id: stableId("evd_", `test\0${observation.observationId}\0${claim.inspectedRevision}`),
      kind: "test",
      synthetic: observation.synthetic,
      repositoryId: ids.repositoryId,
      inspectedRevision: claim.inspectedRevision,
      observedAt: observation.source.retrievedAt,
      result: claim.testResult == null ? { status: "unknown", reason: MISSING_RESULT } : { status: "known", value: claim.testResult },
    };
    addEvidence(testRecord);
    return inspectedClaim({
      id,
      synthetic: observation.synthetic,
      subject: { entity: claim.subject, id: subjectId },
      statement: claim.statement,
      basis: "test-observed",
      evidenceId: testRecord.id,
      sourceUrl: reference.sourceUrl,
      retrievedAt: reference.retrievedAt,
      inspectedCommitId: claim.inspectedRevision,
      resolution: resolutionOf(claim.resolution),
    });
  }
  const revision = claim.inspectedRevision;
  addEvidence({
    id: stableId("evd_", `code\0${observation.observationId}\0${revision}`),
    kind: "code",
    synthetic: observation.synthetic,
    repositoryId: ids.repositoryId,
    inspectedRevision: revision,
    observedAt: observation.source.retrievedAt,
    path: unknown(MISSING_PATH),
  });
  return inspectedClaim({
    id,
    synthetic: observation.synthetic,
    subject: { entity: claim.subject, id: subjectId },
    statement: claim.statement,
    basis: claim.basis === "inferred" ? "inferred" : "code-observed",
    evidenceId: stableId("evd_", `code\0${observation.observationId}\0${revision}`),
    sourceUrl: reference.sourceUrl,
    retrievedAt: reference.retrievedAt,
    inspectedCommitId: revision,
    resolution: resolutionOf(claim.resolution),
  });
}
