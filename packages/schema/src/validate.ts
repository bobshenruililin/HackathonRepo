import {
  MAX_ATTRIBUTION_LENGTH,
  MAX_EXCERPT_QUOTE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PATH_LENGTH,
  MAX_REASON_LENGTH,
  MAX_REVISION_LENGTH,
  MAX_STATEMENT_LENGTH,
  MAX_URL_LENGTH,
  SCHEMA_VERSION,
  type Catalog,
  type ClaimRecord,
  type EvidenceRecord,
  type GeneratedIndex,
} from "./types.ts";

export interface ValidationIssue {
  path: string;
  message: string;
}

export class SchemaValidationError extends Error {
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
    this.name = "SchemaValidationError";
    this.issues = issues;
  }
}

const CLAIM_BASIS = [
  "source-reported",
  "code-observed",
  "test-observed",
  "inferred",
] as const;

const REVIEW_STATUS = ["unreviewed", "accepted", "rejected"] as const;

const FORBIDDEN_KEYS = new Set([
  "email",
  "e-mail",
  "phone",
  "telephone",
  "mobile",
  "profile",
  "profileurl",
  "privateprofile",
  "account",
  "accountid",
  "userid",
  "username",
  "login",
  "secret",
  "token",
  "password",
  "apikey",
  "body",
  "pagebody",
  "sourcebody",
  "html",
  "fulltext",
  "fullpage",
  "school",
  "schoolname",
  "participant",
  "participants",
  "author",
  "authorname",
]);

const SENSITIVE_FIELD_MESSAGE =
  "This field is not allowed. The schema does not store emails, phones, profiles, account identifiers, secrets, schools, or full page or source bodies.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function push(issues: ValidationIssue[], path: string, message: string): void {
  issues.push({ path, message });
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, "");
}

function checkKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(normalizeKey(key))) {
      push(issues, `${path}.${key}`, SENSITIVE_FIELD_MESSAGE);
      continue;
    }
    if (!allowed.includes(key)) {
      push(issues, `${path}.${key}`, "Unexpected field.");
    }
  }
}

function readString(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  max: number,
  message: string,
): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    push(issues, path, message);
    return undefined;
  }
  if (value !== value.trim()) {
    push(issues, path, "Leading and trailing whitespace is not allowed.");
  }
  if (/\s/.test(value) && path.endsWith("inspectedRevision")) {
    push(issues, path, "Inspected revision must be a single commit id token.");
  }
  if (value.length > max) {
    push(
      issues,
      path,
      `Exceeds the maximum length of ${max}. Full page or source bodies are not stored.`,
    );
  }
  if (value.includes("@")) {
    push(issues, path, "Email addresses are not stored.");
  }
  return value;
}

function readBoolean(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  message: string,
): boolean | undefined {
  if (typeof value !== "boolean") {
    push(issues, path, message);
    return undefined;
  }
  return value;
}

function readId(
  value: unknown,
  prefix: string,
  path: string,
  issues: ValidationIssue[],
): string | undefined {
  if (
    typeof value !== "string" ||
    value.length > 80 ||
    !new RegExp(`^${prefix}[a-z0-9_]+$`).test(value)
  ) {
    push(issues, path, `Expected a stable id starting with "${prefix}".`);
    return undefined;
  }
  return value;
}

function readTimestamp(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  message: string,
): string | undefined {
  const text = readString(value, path, issues, 40, message);
  if (text === undefined) {
    return undefined;
  }
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(text) ||
    Number.isNaN(Date.parse(text))
  ) {
    push(issues, path, "Expected an ISO-8601 UTC timestamp with millisecond precision.");
  }
  return text;
}

function readUrl(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  message: string,
): string | undefined {
  const text = readString(value, path, issues, MAX_URL_LENGTH, message);
  if (text === undefined) {
    return undefined;
  }
  if (!/^https:\/\/[^\s]+$/.test(text)) {
    push(issues, path, "Expected an https URL.");
  }
  return text;
}

function readRevision(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  message: string,
): string | undefined {
  const text = readString(value, path, issues, MAX_REVISION_LENGTH, message);
  if (text !== undefined && /\s/.test(text)) {
    push(issues, path, "Inspected revision must be a single commit id token.");
  }
  return text;
}

function readMaybeKnown(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  readKnown: (known: unknown, knownPath: string, issues: ValidationIssue[]) => void,
): void {
  if (!isRecord(value)) {
    push(issues, path, "Expected an explicit known or unknown value.");
    return;
  }
  checkKeys(value, ["status", "reason", "value"], path, issues);
  if (value.status === "unknown") {
    if ("value" in value) {
      push(issues, `${path}.value`, "Unknown values must not include a value.");
    }
    readString(
      value.reason,
      `${path}.reason`,
      issues,
      MAX_REASON_LENGTH,
      "Unknown values require a non-empty reason.",
    );
    return;
  }
  if (value.status === "known") {
    if ("reason" in value) {
      push(issues, `${path}.reason`, "Known values must not include a reason.");
    }
    if (!("value" in value)) {
      push(issues, `${path}.value`, "Known values require a value.");
      return;
    }
    readKnown(value.value, `${path}.value`, issues);
    return;
  }
  push(issues, `${path}.status`, 'Status must be "known" or "unknown".');
}

function readExcerpt(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isRecord(value)) {
    push(issues, path, "Expected a third-party excerpt.");
    return;
  }
  checkKeys(value, ["kind", "attribution", "quote"], path, issues);
  if (value.kind !== "third-party-excerpt") {
    push(
      issues,
      `${path}.kind`,
      'Excerpt kind must be "third-party-excerpt".',
    );
  }
  readString(
    value.attribution,
    `${path}.attribution`,
    issues,
    MAX_ATTRIBUTION_LENGTH,
    "Excerpt attribution is required.",
  );
  readString(
    value.quote,
    `${path}.quote`,
    issues,
    MAX_EXCERPT_QUOTE_LENGTH,
    "Excerpt quote is required.",
  );
}

function requireUnique(ids: readonly string[], path: string, issues: ValidationIssue[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      push(issues, path, `Duplicate id "${id}".`);
    }
    seen.add(id);
  }
}

export function validateEvidence(input: unknown): EvidenceRecord {
  const issues: ValidationIssue[] = [];
  parseEvidence(input, "evidence", issues);
  if (issues.length > 0) {
    throw new SchemaValidationError(issues);
  }
  return input as EvidenceRecord;
}

export function validateClaim(input: unknown): ClaimRecord {
  const issues: ValidationIssue[] = [];
  parseClaim(input, "claim", issues);
  if (issues.length > 0) {
    throw new SchemaValidationError(issues);
  }
  return input as ClaimRecord;
}

function parseEvidence(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
): EvidenceRecord | undefined {
  if (!isRecord(input)) {
    push(issues, path, "Expected an evidence record.");
    return undefined;
  }
  const kind = input.kind;
  if (kind === "source") {
    checkKeys(input, ["id", "kind", "synthetic", "sourceUrl", "retrievedAt", "excerpt"], path, issues);
    readId(input.id, "evd_", `${path}.id`, issues);
    readBoolean(input.synthetic, `${path}.synthetic`, issues, "Synthetic flag is required.");
    readUrl(input.sourceUrl, `${path}.sourceUrl`, issues, "Source URL is required.");
    readTimestamp(input.retrievedAt, `${path}.retrievedAt`, issues, "Retrieval time is required.");
    if ("excerpt" in input) {
      readExcerpt(input.excerpt, `${path}.excerpt`, issues);
    }
    return input as unknown as EvidenceRecord;
  }
  if (kind === "code") {
    checkKeys(
      input,
      ["id", "kind", "synthetic", "repositoryId", "inspectedRevision", "observedAt", "path"],
      path,
      issues,
    );
    readId(input.id, "evd_", `${path}.id`, issues);
    readBoolean(input.synthetic, `${path}.synthetic`, issues, "Synthetic flag is required.");
    readId(input.repositoryId, "repo_", `${path}.repositoryId`, issues);
    if (!("inspectedRevision" in input)) {
      push(issues, `${path}.inspectedRevision`, "Code evidence requires the inspected revision.");
    } else {
      readRevision(
        input.inspectedRevision,
        `${path}.inspectedRevision`,
        issues,
        "Code evidence requires the inspected revision.",
      );
    }
    readTimestamp(input.observedAt, `${path}.observedAt`, issues, "Observation time is required.");
    readMaybeKnown(input.path, `${path}.path`, issues, (known, knownPath, knownIssues) => {
      readString(known, knownPath, knownIssues, MAX_PATH_LENGTH, "Code path is required when known.");
    });
    return input as unknown as EvidenceRecord;
  }
  if (kind === "test") {
    checkKeys(
      input,
      ["id", "kind", "synthetic", "repositoryId", "inspectedRevision", "observedAt", "result"],
      path,
      issues,
    );
    readId(input.id, "evd_", `${path}.id`, issues);
    readBoolean(input.synthetic, `${path}.synthetic`, issues, "Synthetic flag is required.");
    readId(input.repositoryId, "repo_", `${path}.repositoryId`, issues);
    readRevision(
      input.inspectedRevision,
      `${path}.inspectedRevision`,
      issues,
      "Test evidence requires the inspected revision.",
    );
    readTimestamp(input.observedAt, `${path}.observedAt`, issues, "Observation time is required.");
    readMaybeKnown(input.result, `${path}.result`, issues, (known, knownPath, knownIssues) => {
      if (known !== "passed" && known !== "failed") {
        push(knownIssues, knownPath, 'Test result must be "passed" or "failed" when known.');
      }
    });
    return input as unknown as EvidenceRecord;
  }
  checkKeys(input, ["id", "kind", "synthetic"], path, issues);
  push(issues, `${path}.kind`, 'Evidence kind must be "source", "code", or "test".');
  return undefined;
}

function parseClaim(input: unknown, path: string, issues: ValidationIssue[]): ClaimRecord | undefined {
  if (!isRecord(input)) {
    push(issues, path, "Expected a claim record.");
    return undefined;
  }
  const allowed = [
    "id",
    "synthetic",
    "subject",
    "statement",
    "basis",
    "evidenceIds",
    "observedAt",
    "reviewStatus",
    "sourceUrl",
    "retrievedAt",
    "repositoryInspected",
    "inspectedCommitId",
    "resolution",
  ];
  checkKeys(input, allowed, path, issues);
  readId(input.id, "clm_", `${path}.id`, issues);
  readBoolean(input.synthetic, `${path}.synthetic`, issues, "Synthetic flag is required.");
  parseSubject(input.subject, `${path}.subject`, issues);
  readString(
    input.statement,
    `${path}.statement`,
    issues,
    MAX_STATEMENT_LENGTH,
    "Claim statement is required.",
  );
  if (!("basis" in input) || input.basis === undefined || input.basis === null || input.basis === "") {
    push(issues, `${path}.basis`, "Claim basis is required.");
  } else if (!CLAIM_BASIS.includes(input.basis as (typeof CLAIM_BASIS)[number])) {
    push(
      issues,
      `${path}.basis`,
      "Claim basis must be source-reported, code-observed, test-observed, or inferred.",
    );
  }
  if (!("evidenceIds" in input) || !Array.isArray(input.evidenceIds) || input.evidenceIds.length === 0) {
    push(issues, `${path}.evidenceIds`, "Evidence references are required.");
  } else {
    input.evidenceIds.forEach((evidenceId, index) => {
      readId(evidenceId, "evd_", `${path}.evidenceIds[${index}]`, issues);
    });
    requireUnique(
      input.evidenceIds.filter((id): id is string => typeof id === "string"),
      `${path}.evidenceIds`,
      issues,
    );
  }
  if (!("observedAt" in input)) {
    push(issues, `${path}.observedAt`, "Observation time is required.");
  } else {
    readTimestamp(input.observedAt, `${path}.observedAt`, issues, "Observation time is required.");
  }
  if (!("reviewStatus" in input) || input.reviewStatus === undefined || input.reviewStatus === null || input.reviewStatus === "") {
    push(issues, `${path}.reviewStatus`, "Review status is required.");
  } else if (!REVIEW_STATUS.includes(input.reviewStatus as (typeof REVIEW_STATUS)[number])) {
    push(issues, `${path}.reviewStatus`, "Review status must be unreviewed, accepted, or rejected.");
  }
  if (!("sourceUrl" in input)) {
    push(issues, `${path}.sourceUrl`, "Source URL is required.");
  } else {
    readUrl(input.sourceUrl, `${path}.sourceUrl`, issues, "Source URL is required.");
  }
  if (!("retrievedAt" in input)) {
    push(issues, `${path}.retrievedAt`, "Retrieval time is required.");
  } else {
    readTimestamp(input.retrievedAt, `${path}.retrievedAt`, issues, "Retrieval time is required.");
  }
  const inspectedRepository =
    input.basis === "code-observed" || input.basis === "test-observed" || input.repositoryInspected === true;
  if (input.repositoryInspected === undefined) {
    push(issues, `${path}.repositoryInspected`, "repositoryInspected is required.");
  } else if (typeof input.repositoryInspected !== "boolean") {
    push(issues, `${path}.repositoryInspected`, "repositoryInspected must be a boolean.");
  } else if (inspectedRepository && input.repositoryInspected !== true) {
    push(
      issues,
      `${path}.repositoryInspected`,
      "Code-observed and test-observed claims record a repository inspection.",
    );
  }
  if (input.repositoryInspected === true || inspectedRepository) {
    if (!("inspectedCommitId" in input)) {
      push(issues, `${path}.inspectedCommitId`, "Inspected commit id is required.");
    } else {
      readRevision(
        input.inspectedCommitId,
        `${path}.inspectedCommitId`,
        issues,
        "Inspected commit id is required.",
      );
    }
  } else if ("inspectedCommitId" in input) {
    push(
      issues,
      `${path}.inspectedCommitId`,
      "Inspected commit id is recorded only when a repository was inspected.",
    );
  }
  readMaybeKnown(input.resolution, `${path}.resolution`, issues, (known, knownPath, knownIssues) => {
    readString(known, knownPath, knownIssues, MAX_STATEMENT_LENGTH, "Known resolution requires a value.");
  });
  return input as unknown as ClaimRecord;
}

function parseSubject(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(value)) {
    push(issues, path, "Claim subject is required.");
    return;
  }
  checkKeys(value, ["entity", "id"], path, issues);
  const prefixes: Record<string, string> = {
    event: "evt_",
    project: "prj_",
    submission: "sub_",
    repository: "repo_",
  };
  if (typeof value.entity !== "string" || !(value.entity in prefixes)) {
    push(issues, `${path}.entity`, "Claim subject entity must be event, project, submission, or repository.");
    return;
  }
  readId(value.id, prefixes[value.entity] ?? "", `${path}.id`, issues);
}

function parseEvent(input: unknown, path: string, issues: ValidationIssue[]): string | undefined {
  if (!isRecord(input)) {
    push(issues, path, "Expected an event record.");
    return undefined;
  }
  checkKeys(input, ["id", "synthetic", "name", "startsAt", "endsAt"], path, issues);
  const id = readId(input.id, "evt_", `${path}.id`, issues);
  readBoolean(input.synthetic, `${path}.synthetic`, issues, "Synthetic flag is required.");
  readString(input.name, `${path}.name`, issues, MAX_NAME_LENGTH, "Event name is required.");
  readMaybeKnown(input.startsAt, `${path}.startsAt`, issues, (known, knownPath, knownIssues) => {
    readTimestamp(known, knownPath, knownIssues, "Known start time must be a timestamp.");
  });
  readMaybeKnown(input.endsAt, `${path}.endsAt`, issues, (known, knownPath, knownIssues) => {
    readTimestamp(known, knownPath, knownIssues, "Known end time must be a timestamp.");
  });
  return id;
}

function parseProject(input: unknown, path: string, issues: ValidationIssue[]): string | undefined {
  if (!isRecord(input)) {
    push(issues, path, "Expected a project record.");
    return undefined;
  }
  checkKeys(input, ["id", "synthetic", "name", "summary"], path, issues);
  const id = readId(input.id, "prj_", `${path}.id`, issues);
  readBoolean(input.synthetic, `${path}.synthetic`, issues, "Synthetic flag is required.");
  readString(input.name, `${path}.name`, issues, MAX_NAME_LENGTH, "Project name is required.");
  readMaybeKnown(input.summary, `${path}.summary`, issues, (known, knownPath, knownIssues) => {
    readString(known, knownPath, knownIssues, MAX_STATEMENT_LENGTH, "Known summary requires text.");
  });
  return id;
}

function parseSubmission(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
): { id?: string; projectId?: string; eventId?: string } {
  if (!isRecord(input)) {
    push(issues, path, "Expected a submission record.");
    return {};
  }
  checkKeys(input, ["id", "synthetic", "projectId", "eventId", "submittedAt"], path, issues);
  const id = readId(input.id, "sub_", `${path}.id`, issues);
  readBoolean(input.synthetic, `${path}.synthetic`, issues, "Synthetic flag is required.");
  const projectId = readId(input.projectId, "prj_", `${path}.projectId`, issues);
  const eventId = readId(input.eventId, "evt_", `${path}.eventId`, issues);
  readMaybeKnown(input.submittedAt, `${path}.submittedAt`, issues, (known, knownPath, knownIssues) => {
    readTimestamp(known, knownPath, knownIssues, "Known submission time must be a timestamp.");
  });
  const parsed: { id?: string; projectId?: string; eventId?: string } = {};
  if (id !== undefined) parsed.id = id;
  if (projectId !== undefined) parsed.projectId = projectId;
  if (eventId !== undefined) parsed.eventId = eventId;
  return parsed;
}

function parseRepository(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
): { id?: string; projectId?: string } {
  if (!isRecord(input)) {
    push(issues, path, "Expected a repository record.");
    return {};
  }
  checkKeys(input, ["id", "synthetic", "projectId", "locator"], path, issues);
  const id = readId(input.id, "repo_", `${path}.id`, issues);
  readBoolean(input.synthetic, `${path}.synthetic`, issues, "Synthetic flag is required.");
  const projectId = readId(input.projectId, "prj_", `${path}.projectId`, issues);
  readMaybeKnown(input.locator, `${path}.locator`, issues, (known, knownPath, knownIssues) => {
    readUrl(known, knownPath, knownIssues, "Known repository locator must be an https URL.");
  });
  const parsed: { id?: string; projectId?: string } = {};
  if (id !== undefined) parsed.id = id;
  if (projectId !== undefined) parsed.projectId = projectId;
  return parsed;
}

function recordsOf(catalog: Record<string, unknown>, key: string): unknown[] {
  const value = catalog[key];
  return Array.isArray(value) ? value : [];
}

function assertSyntheticRecords(catalog: Record<string, unknown>, issues: ValidationIssue[]): void {
  const groups = ["events", "projects", "submissions", "repositories", "evidence", "claims"] as const;
  for (const group of groups) {
    recordsOf(catalog, group).forEach((record, index) => {
      if (!isRecord(record) || record.synthetic !== true) {
        push(issues, `${group}[${index}].synthetic`, "Fixture record is not labeled synthetic.");
      }
    });
  }
}

export function validateCatalog(input: unknown): Catalog {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    throw new SchemaValidationError([{ path: "catalog", message: "Expected a catalog object." }]);
  }
  checkKeys(
    input,
    [
      "schemaVersion",
      "authority",
      "authoritative",
      "synthetic",
      "datasetLabel",
      "fixtureWarning",
      "events",
      "projects",
      "submissions",
      "repositories",
      "evidence",
      "claims",
    ],
    "catalog",
    issues,
  );
  if (input.schemaVersion !== SCHEMA_VERSION) {
    push(issues, "catalog.schemaVersion", `Schema version must be ${SCHEMA_VERSION}.`);
  }
  if (input.authority !== "canonical-catalog") {
    push(issues, "catalog.authority", 'Catalog authority must be "canonical-catalog".');
  }
  if (input.authoritative !== true) {
    push(issues, "catalog.authoritative", "Canonical catalog records are authoritative.");
  }
  if (typeof input.synthetic !== "boolean") {
    push(issues, "catalog.synthetic", "Catalog synthetic flag is required.");
  }
  if (input.synthetic === true) {
    if (input.datasetLabel !== "synthetic-fixtures") {
      push(issues, "catalog.datasetLabel", "Fixture is not labeled synthetic.");
    }
    if (
      typeof input.fixtureWarning !== "string" ||
      !input.fixtureWarning.includes("SYNTHETIC") ||
      !/not a real project/i.test(input.fixtureWarning)
    ) {
      push(issues, "catalog.fixtureWarning", "Fixture is not labeled synthetic.");
    }
    assertSyntheticRecords(input, issues);
  } else if (input.synthetic === false) {
    if ("fixtureWarning" in input) {
      push(issues, "catalog.fixtureWarning", "fixtureWarning is only valid on synthetic fixtures.");
    }
    if (typeof input.datasetLabel !== "string" || input.datasetLabel.trim() === "") {
      push(issues, "catalog.datasetLabel", "datasetLabel is required.");
    } else if (input.datasetLabel === "synthetic-fixtures") {
      push(issues, "catalog.datasetLabel", "synthetic-fixtures is reserved for synthetic catalogs.");
    }
  }

  const collections = ["events", "projects", "submissions", "repositories", "evidence", "claims"] as const;
  for (const key of collections) {
    if (!Array.isArray(input[key])) {
      push(issues, `catalog.${key}`, "Expected an array.");
    }
  }

  const eventIds: string[] = [];
  const projectIds: string[] = [];
  const submissionIds: string[] = [];
  const repositoryIds: string[] = [];
  const evidenceIds: string[] = [];
  const claimIds: string[] = [];
  const evidenceById = new Map<string, Record<string, unknown>>();
  const submissions: Array<{ projectId?: string; eventId?: string }> = [];
  const repositories: Array<{ projectId?: string }> = [];

  recordsOf(input, "events").forEach((record, index) => {
    const id = parseEvent(record, `catalog.events[${index}]`, issues);
    if (id) eventIds.push(id);
  });
  recordsOf(input, "projects").forEach((record, index) => {
    const id = parseProject(record, `catalog.projects[${index}]`, issues);
    if (id) projectIds.push(id);
  });
  recordsOf(input, "submissions").forEach((record, index) => {
    const parsed = parseSubmission(record, `catalog.submissions[${index}]`, issues);
    if (parsed.id) submissionIds.push(parsed.id);
    submissions.push(parsed);
  });
  recordsOf(input, "repositories").forEach((record, index) => {
    const parsed = parseRepository(record, `catalog.repositories[${index}]`, issues);
    if (parsed.id) repositoryIds.push(parsed.id);
    repositories.push(parsed);
  });
  recordsOf(input, "evidence").forEach((record, index) => {
    parseEvidence(record, `catalog.evidence[${index}]`, issues);
    if (isRecord(record) && typeof record.id === "string") {
      evidenceIds.push(record.id);
      evidenceById.set(record.id, record);
    }
  });
  recordsOf(input, "claims").forEach((record, index) => {
    parseClaim(record, `catalog.claims[${index}]`, issues);
    if (isRecord(record) && typeof record.id === "string") {
      claimIds.push(record.id);
      linkClaim(record, `catalog.claims[${index}]`, issues, {
        eventIds,
        projectIds,
        submissionIds,
        repositoryIds,
        evidenceById,
      });
    }
  });

  requireUnique(eventIds, "catalog.events", issues);
  requireUnique(projectIds, "catalog.projects", issues);
  requireUnique(submissionIds, "catalog.submissions", issues);
  requireUnique(repositoryIds, "catalog.repositories", issues);
  requireUnique(evidenceIds, "catalog.evidence", issues);
  requireUnique(claimIds, "catalog.claims", issues);

  const eventIdSet = new Set(eventIds);
  const projectIdSet = new Set(projectIds);
  const repositoryIdSet = new Set(repositoryIds);
  submissions.forEach((submission, index) => {
    if (submission.projectId && !projectIdSet.has(submission.projectId)) {
      push(issues, `catalog.submissions[${index}].projectId`, "Submission projectId does not match a project.");
    }
    if (submission.eventId && !eventIdSet.has(submission.eventId)) {
      push(issues, `catalog.submissions[${index}].eventId`, "Submission eventId does not match an event.");
    }
  });
  repositories.forEach((repository, index) => {
    if (repository.projectId && !projectIdSet.has(repository.projectId)) {
      push(issues, `catalog.repositories[${index}].projectId`, "Repository projectId does not match a project.");
    }
  });
  recordsOf(input, "evidence").forEach((record, index) => {
    if (!isRecord(record)) return;
    if (
      (record.kind === "code" || record.kind === "test") &&
      typeof record.repositoryId === "string" &&
      !repositoryIdSet.has(record.repositoryId)
    ) {
      push(
        issues,
        `catalog.evidence[${index}].repositoryId`,
        "Evidence repositoryId does not match a repository.",
      );
    }
  });

  if (issues.length > 0) {
    throw new SchemaValidationError(issues);
  }
  return input as unknown as Catalog;
}

function linkClaim(
  claim: Record<string, unknown>,
  path: string,
  issues: ValidationIssue[],
  refs: {
    eventIds: readonly string[];
    projectIds: readonly string[];
    submissionIds: readonly string[];
    repositoryIds: readonly string[];
    evidenceById: ReadonlyMap<string, Record<string, unknown>>;
  },
): void {
  if (isRecord(claim.subject) && typeof claim.subject.id === "string") {
    const pools: Record<string, readonly string[]> = {
      event: refs.eventIds,
      project: refs.projectIds,
      submission: refs.submissionIds,
      repository: refs.repositoryIds,
    };
    const pool = pools[String(claim.subject.entity)];
    if (pool && !pool.includes(claim.subject.id)) {
      push(issues, `${path}.subject.id`, "Claim subject does not match a catalog record.");
    }
  }
  if (!Array.isArray(claim.evidenceIds)) return;
  const cited = claim.evidenceIds.filter((id): id is string => typeof id === "string");
  for (const evidenceId of cited) {
    if (!refs.evidenceById.has(evidenceId)) {
      push(issues, `${path}.evidenceIds`, `Evidence reference "${evidenceId}" does not match an evidence record.`);
    }
  }
  if (claim.basis === "source-reported") {
    const matched = cited.some((evidenceId) => {
      const evidence = refs.evidenceById.get(evidenceId);
      return (
        evidence?.kind === "source" &&
        evidence.sourceUrl === claim.sourceUrl &&
        evidence.retrievedAt === claim.retrievedAt
      );
    });
    if (!matched) {
      push(
        issues,
        `${path}.evidenceIds`,
        "Source-reported claim must cite source evidence with the same source URL and retrieval time.",
      );
    }
  }
  if (claim.basis === "code-observed") {
    const matched = cited.some((evidenceId) => {
      const evidence = refs.evidenceById.get(evidenceId);
      return evidence?.kind === "code" && evidence.inspectedRevision === claim.inspectedCommitId;
    });
    if (!matched) {
      push(
        issues,
        `${path}.evidenceIds`,
        "Code-observed claim must cite code evidence for the inspected commit.",
      );
    }
  }
  if (claim.basis === "inferred" && claim.repositoryInspected === true) {
    const matched = cited.some((evidenceId) => {
      const evidence = refs.evidenceById.get(evidenceId);
      return (
        (evidence?.kind === "code" || evidence?.kind === "test") &&
        evidence.inspectedRevision === claim.inspectedCommitId
      );
    });
    if (!matched) {
      push(
        issues,
        `${path}.evidenceIds`,
        "Inferred claim that inspected a repository must cite code or test evidence for that commit.",
      );
    }
  }
  if (claim.basis === "test-observed") {
    const matched = cited.some((evidenceId) => {
      const evidence = refs.evidenceById.get(evidenceId);
      return evidence?.kind === "test" && evidence.inspectedRevision === claim.inspectedCommitId;
    });
    if (!matched) {
      push(
        issues,
        `${path}.evidenceIds`,
        "Test-observed claim must cite test evidence for the inspected commit.",
      );
    }
  }
}

export function validateGeneratedIndex(input: unknown): GeneratedIndex {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    throw new SchemaValidationError([{ path: "index", message: "Expected a generated index object." }]);
  }
  checkKeys(input, ["schemaVersion", "authority", "authoritative", "synthetic", "entries"], "index", issues);
  if (input.schemaVersion !== SCHEMA_VERSION) {
    push(issues, "index.schemaVersion", `Schema version must be ${SCHEMA_VERSION}.`);
  }
  if (input.authority !== "generated-index") {
    push(issues, "index.authority", 'Generated index authority must be "generated-index".');
  }
  if (input.authoritative !== false) {
    push(issues, "index.authoritative", "Generated indexes are not authoritative.");
  }
  readBoolean(input.synthetic, "index.synthetic", issues, "Synthetic flag is required.");
  if (!Array.isArray(input.entries)) {
    push(issues, "index.entries", "Expected an array.");
  } else {
    input.entries.forEach((entry, index) => {
      if (!isRecord(entry)) {
        push(issues, `index.entries[${index}]`, "Expected an index entry.");
        return;
      }
      checkKeys(entry, ["label"], `index.entries[${index}]`, issues);
      readString(entry.label, `index.entries[${index}].label`, issues, MAX_NAME_LENGTH, "Index label is required.");
    });
  }
  if (issues.length > 0) {
    throw new SchemaValidationError(issues);
  }
  return input as unknown as GeneratedIndex;
}

export function loadSyntheticCatalog(input: unknown): Catalog {
  if (!isRecord(input) || input.synthetic !== true) {
    throw new SchemaValidationError([
      { path: "catalog.synthetic", message: "Fixture is not labeled synthetic." },
    ]);
  }
  return validateCatalog(input);
}

/**
 * Synthetic catalogs and synthetic projects are excluded from real counts.
 * A generated index is not a catalog and must not be passed here.
 */
export function countRealProjects(catalog: Catalog): number {
  if (catalog.synthetic === true || catalog.datasetLabel === "synthetic-fixtures") {
    return 0;
  }
  return catalog.projects.filter((project) => project.synthetic !== true).length;
}
