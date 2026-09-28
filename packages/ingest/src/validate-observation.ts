import {
  MAX_ATTRIBUTION_LENGTH,
  MAX_EXCERPT_QUOTE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_REVISION_LENGTH,
  MAX_STATEMENT_LENGTH,
  MAX_URL_LENGTH,
  type ClaimBasis,
  type EntityKind,
} from "@hackathon-atlas/schema";

import { IngestError } from "./errors.ts";
import type { StagedClaim, StagedObservation } from "./types.ts";

const CLAIM_BASIS: readonly ClaimBasis[] = [
  "source-reported",
  "code-observed",
  "test-observed",
  "inferred",
];

const ENTITY_KIND: readonly EntityKind[] = ["event", "project", "submission", "repository"];

const FORBIDDEN_KEYS = new Set([
  "email",
  "emailaddress",
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

const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{8,}/,
  /\bsk-[A-Za-z0-9]{8,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{8,}/,
  /\bbearer\s+[A-Za-z0-9\-._~+/]{8,}/i,
  /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*\S+/i,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, "");
}

function rejectSensitive(value: unknown, path: string): void {
  if (typeof value === "string") {
    if (SECRET_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new IngestError(`${path}: A secret-like value was skipped and was not stored.`);
    }
    if (value.includes("@")) {
      throw new IngestError(`${path}: An email-like value was not stored.`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectSensitive(item, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(normalizeKey(key))) {
      throw new IngestError(`${path}.${key}: This field is not stored.`);
    }
    rejectSensitive(child, `${path}.${key}`);
  }
}

function checkKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      issues.push(`${path}.${key}: Unexpected field. Staged JSON is data, not instructions.`);
    }
  }
}

function requiredString(value: unknown, path: string, issues: string[], max: number): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push(`${path} must be a non-empty string.`);
    return undefined;
  }
  if (value !== value.trim()) {
    issues.push(`${path} must not have leading or trailing whitespace.`);
  }
  if (value.length > max) {
    issues.push(`${path} exceeds the maximum length of ${max}.`);
  }
  return value;
}

function optionalString(
  value: unknown,
  path: string,
  issues: string[],
  max: number,
): string | null | undefined {
  if (value === undefined || value === null) return null;
  return requiredString(value, path, issues, max);
}

function isTimestamp(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && !Number.isNaN(Date.parse(value))
  );
}

function isHttpsUrl(value: string): boolean {
  return /^https:\/\/[^\s]+$/.test(value) && value.length <= MAX_URL_LENGTH;
}

function isRevision(value: string): boolean {
  return value.length > 0 && value.length <= MAX_REVISION_LENGTH && !/\s/.test(value);
}

export function validateObservation(input: unknown, label: string): StagedObservation {
  rejectSensitive(input, label);
  const issues: string[] = [];
  if (!isRecord(input)) {
    throw new IngestError(`${label}: Expected an observation object.`);
  }
  checkKeys(
    input,
    [
      "observationId",
      "synthetic",
      "source",
      "event",
      "project",
      "submission",
      "repository",
      "license",
      "claims",
    ],
    label,
    issues,
  );

  const observationId = requiredString(input.observationId, `${label}.observationId`, issues, 80);
  if (
    observationId !== undefined &&
    !/^obs_[a-z0-9_]+$/.test(observationId)
  ) {
    issues.push(`${label}.observationId must match obs_[a-z0-9_].`);
  }
  if (typeof input.synthetic !== "boolean") {
    issues.push(`${label}.synthetic must be a boolean.`);
  }

  const source = readSource(input.source, `${label}.source`, issues);
  const event = readEvent(input.event, `${label}.event`, issues);
  const project = readProject(input.project, `${label}.project`, issues);
  const submission = readSubmission(input.submission, `${label}.submission`, issues);
  const repository = readRepository(input.repository, `${label}.repository`, issues);
  const license = readLicense(input.license, `${label}.license`, issues);
  const claims = readClaims(input.claims, `${label}.claims`, issues);

  if (event === undefined && project === undefined && submission === undefined && repository === undefined) {
    issues.push(`${label} has no event, project, submission, or repository. Ingest did not invent one.`);
  }
  if (project?.uncertainSameAs && project.identityKey && project.uncertainSameAs === project.identityKey) {
    issues.push(`${label}.project.uncertainSameAs repeats this project's identity. Ingest did not merge it with itself.`);
  }

  if (issues.length > 0 || !observationId || typeof input.synthetic !== "boolean" || !source) {
    throw new IngestError(issues.length > 0 ? issues : [`${label}: Observation is invalid.`]);
  }

  return {
    observationId,
    synthetic: input.synthetic,
    source,
    event: event ?? null,
    project: project ?? null,
    submission: submission ?? null,
    repository: repository ?? null,
    license,
    claims: claims ?? [],
  };
}

function readSource(
  value: unknown,
  path: string,
  issues: string[],
): StagedObservation["source"] | undefined {
  if (!isRecord(value)) {
    issues.push(`${path} is required.`);
    return undefined;
  }
  checkKeys(value, ["url", "retrievedAt", "excerpt"], path, issues);
  const url = requiredString(value.url, `${path}.url`, issues, MAX_URL_LENGTH);
  if (url !== undefined && !isHttpsUrl(url)) {
    issues.push(`${path}.url must be an https URL.`);
  }
  const retrievedAt = requiredString(value.retrievedAt, `${path}.retrievedAt`, issues, 40);
  if (retrievedAt !== undefined && !isTimestamp(retrievedAt)) {
    issues.push(`${path}.retrievedAt must be an ISO-8601 UTC timestamp with millisecond precision.`);
  }
  let excerpt: StagedObservation["source"]["excerpt"] = null;
  if ("excerpt" in value && value.excerpt !== null) {
    if (!isRecord(value.excerpt)) {
      issues.push(`${path}.excerpt must be an object.`);
    } else {
      checkKeys(value.excerpt, ["attribution", "quote"], `${path}.excerpt`, issues);
      const attribution = requiredString(
        value.excerpt.attribution,
        `${path}.excerpt.attribution`,
        issues,
        MAX_ATTRIBUTION_LENGTH,
      );
      const quote = requiredString(
        value.excerpt.quote,
        `${path}.excerpt.quote`,
        issues,
        MAX_EXCERPT_QUOTE_LENGTH,
      );
      if (attribution !== undefined && quote !== undefined) {
        excerpt = { attribution, quote };
      }
    }
  }
  if (!url || !retrievedAt) return undefined;
  return { url, retrievedAt, excerpt };
}

function readEvent(value: unknown, path: string, issues: string[]): StagedObservation["event"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    issues.push(`${path} must be an object.`);
    return undefined;
  }
  checkKeys(value, ["identityKey", "name", "startsAt", "endsAt"], path, issues);
  const identityKey = optionalIdentity(value.identityKey, `${path}.identityKey`, issues);
  const name = requiredString(value.name, `${path}.name`, issues, MAX_NAME_LENGTH);
  const startsAt = optionalTimestamp(value.startsAt, `${path}.startsAt`, issues);
  const endsAt = optionalTimestamp(value.endsAt, `${path}.endsAt`, issues);
  if (identityKey === undefined || !name || startsAt === undefined || endsAt === undefined) return undefined;
  return { identityKey, name, startsAt, endsAt };
}

function readProject(
  value: unknown,
  path: string,
  issues: string[],
): StagedObservation["project"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    issues.push(`${path} must be an object.`);
    return undefined;
  }
  checkKeys(value, ["identityKey", "name", "summary", "uncertainSameAs"], path, issues);
  const identityKey = optionalIdentity(value.identityKey, `${path}.identityKey`, issues);
  const name = requiredString(value.name, `${path}.name`, issues, MAX_NAME_LENGTH);
  const summary = optionalString(value.summary, `${path}.summary`, issues, MAX_STATEMENT_LENGTH);
  const uncertainSameAs = optionalIdentity(value.uncertainSameAs, `${path}.uncertainSameAs`, issues);
  if (identityKey === undefined || !name || summary === undefined || uncertainSameAs === undefined) {
    return undefined;
  }
  return { identityKey, name, summary, uncertainSameAs };
}

function readSubmission(
  value: unknown,
  path: string,
  issues: string[],
): StagedObservation["submission"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    issues.push(`${path} must be an object.`);
    return undefined;
  }
  checkKeys(value, ["identityKey", "eventIdentityKey", "projectIdentityKey", "submittedAt"], path, issues);
  const identityKey = requiredIdentity(value.identityKey, `${path}.identityKey`, issues);
  const eventIdentityKey = requiredIdentity(value.eventIdentityKey, `${path}.eventIdentityKey`, issues);
  const projectIdentityKey = requiredIdentity(value.projectIdentityKey, `${path}.projectIdentityKey`, issues);
  const submittedAt = optionalTimestamp(value.submittedAt, `${path}.submittedAt`, issues);
  if (!identityKey || !eventIdentityKey || !projectIdentityKey || submittedAt === undefined) return undefined;
  return { identityKey, eventIdentityKey, projectIdentityKey, submittedAt };
}

function readRepository(
  value: unknown,
  path: string,
  issues: string[],
): StagedObservation["repository"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    issues.push(`${path} must be an object.`);
    return undefined;
  }
  checkKeys(
    value,
    [
      "identityKey",
      "projectIdentityKey",
      "locator",
      "previousLocator",
      "rename",
      "inspectedRevision",
      "linkStatus",
    ],
    path,
    issues,
  );
  const identityKey = optionalIdentity(value.identityKey, `${path}.identityKey`, issues);
  const projectIdentityKey = requiredIdentity(value.projectIdentityKey, `${path}.projectIdentityKey`, issues);
  const locator = optionalLooseString(value.locator, `${path}.locator`, issues);
  const previousLocator = optionalLooseString(value.previousLocator, `${path}.previousLocator`, issues);
  const inspectedRevision = optionalRevision(value.inspectedRevision, `${path}.inspectedRevision`, issues);
  let rename: "asserted-same" | "uncertain" | null = null;
  if (value.rename === undefined || value.rename === null) {
    rename = null;
  } else if (value.rename === "asserted-same" || value.rename === "uncertain") {
    rename = value.rename;
  } else {
    issues.push(`${path}.rename must be "asserted-same" or "uncertain".`);
  }
  let linkStatus: "missing" | "broken" | "reported" | undefined;
  if (value.linkStatus === undefined || value.linkStatus === null) {
    linkStatus = locator ? "reported" : "missing";
  } else if (value.linkStatus === "missing" || value.linkStatus === "broken" || value.linkStatus === "reported") {
    linkStatus = value.linkStatus;
  } else {
    issues.push(`${path}.linkStatus must be "missing", "broken", or "reported".`);
  }
  if (linkStatus === "missing" && locator) {
    issues.push(`${path}.locator must be empty when linkStatus is missing. Ingest did not keep a missing locator.`);
  }
  if (linkStatus === "reported" && !locator) {
    issues.push(`${path}.locator is required when linkStatus is reported.`);
  }
  if (rename === "asserted-same" && !locator) {
    issues.push(`${path}.locator is required when a rename is asserted.`);
  }
  if (
    identityKey === undefined ||
    !projectIdentityKey ||
    locator === undefined ||
    previousLocator === undefined ||
    inspectedRevision === undefined ||
    !linkStatus
  ) {
    return undefined;
  }
  return {
    identityKey,
    projectIdentityKey,
    locator,
    previousLocator,
    rename,
    inspectedRevision,
    linkStatus,
  };
}

function readLicense(
  value: unknown,
  path: string,
  issues: string[],
): StagedObservation["license"] {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) {
    issues.push(`${path} must be an object.`);
    return null;
  }
  checkKeys(value, ["reportedText"], path, issues);
  const reportedText = optionalString(value.reportedText, `${path}.reportedText`, issues, MAX_NAME_LENGTH);
  if (reportedText === undefined) return null;
  return { reportedText };
}

function readClaims(value: unknown, path: string, issues: string[]): StagedClaim[] | undefined {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array.`);
    return undefined;
  }
  const claims: StagedClaim[] = [];
  const seen = new Set<string>();
  value.forEach((item, index) => {
    const claim = readClaim(item, `${path}[${index}]`, issues);
    if (!claim) return;
    if (seen.has(claim.identityKey)) {
      issues.push(`${path}[${index}].identityKey repeats a claim identity in this observation.`);
    }
    seen.add(claim.identityKey);
    claims.push(claim);
  });
  return claims;
}

function readClaim(value: unknown, path: string, issues: string[]): StagedClaim | undefined {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object.`);
    return undefined;
  }
  checkKeys(
    value,
    [
      "identityKey",
      "statement",
      "basis",
      "subject",
      "resolution",
      "conflictKey",
      "inspectedRevision",
      "testResult",
    ],
    path,
    issues,
  );
  const identityKey = requiredIdentity(value.identityKey, `${path}.identityKey`, issues);
  const statement = requiredString(value.statement, `${path}.statement`, issues, MAX_STATEMENT_LENGTH);
  let basis: ClaimBasis | undefined;
  if (typeof value.basis !== "string" || value.basis.trim() === "") {
    issues.push(`${path}.basis is required.`);
  } else if (!CLAIM_BASIS.includes(value.basis as ClaimBasis)) {
    issues.push(`${path}.basis must be source-reported, code-observed, test-observed, or inferred.`);
  } else {
    basis = value.basis as ClaimBasis;
  }
  let subject: EntityKind | undefined;
  if (typeof value.subject !== "string" || !ENTITY_KIND.includes(value.subject as EntityKind)) {
    issues.push(`${path}.subject must be event, project, submission, or repository.`);
  } else {
    subject = value.subject as EntityKind;
  }
  const resolution = optionalString(value.resolution, `${path}.resolution`, issues, MAX_STATEMENT_LENGTH);
  const conflictKey = optionalIdentity(value.conflictKey, `${path}.conflictKey`, issues);
  const inspectedRevision = optionalRevision(value.inspectedRevision, `${path}.inspectedRevision`, issues);
  let testResult: "passed" | "failed" | null | undefined = null;
  if (value.testResult === undefined || value.testResult === null) {
    testResult = null;
  } else if (value.testResult === "passed" || value.testResult === "failed") {
    testResult = value.testResult;
  } else {
    issues.push(`${path}.testResult must be "passed" or "failed" when set.`);
  }
  if (basis === "source-reported" && inspectedRevision) {
    issues.push(`${path}.inspectedRevision is recorded only when a repository was inspected.`);
  }
  if ((basis === "code-observed" || basis === "test-observed") && !inspectedRevision) {
    issues.push(`${path}.inspectedRevision is required for ${basis ?? "this"} claims. Ingest did not invent a commit id.`);
  }
  if (basis !== "test-observed" && testResult) {
    issues.push(`${path}.testResult is recorded only for test-observed claims.`);
  }
  if (
    !identityKey ||
    !statement ||
    !basis ||
    !subject ||
    resolution === undefined ||
    conflictKey === undefined ||
    inspectedRevision === undefined ||
    testResult === undefined
  ) {
    return undefined;
  }
  return {
    identityKey,
    statement,
    basis,
    subject,
    resolution,
    conflictKey,
    inspectedRevision,
    testResult,
  };
}

function optionalIdentity(value: unknown, path: string, issues: string[]): string | null | undefined {
  if (value === undefined || value === null) return null;
  return requiredIdentity(value, path, issues);
}

function requiredIdentity(value: unknown, path: string, issues: string[]): string | undefined {
  const text = requiredString(value, path, issues, MAX_NAME_LENGTH);
  if (text !== undefined && /\s/.test(text)) {
    issues.push(`${path} must be a single identity token.`);
  }
  return text;
}

function optionalTimestamp(value: unknown, path: string, issues: string[]): string | null | undefined {
  if (value === undefined || value === null) return null;
  const text = requiredString(value, path, issues, 40);
  if (text !== undefined && !isTimestamp(text)) {
    issues.push(`${path} must be an ISO-8601 UTC timestamp with millisecond precision.`);
  }
  return text;
}

function optionalLooseString(value: unknown, path: string, issues: string[]): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.trim() === "") {
    issues.push(`${path} must be a non-empty string when set.`);
    return undefined;
  }
  if (value !== value.trim() || value.length > MAX_URL_LENGTH) {
    issues.push(`${path} must be a trimmed string within the URL length cap.`);
  }
  return value;
}

function optionalRevision(value: unknown, path: string, issues: string[]): string | null | undefined {
  if (value === undefined || value === null) return null;
  const text = requiredString(value, path, issues, MAX_REVISION_LENGTH);
  if (text !== undefined && !isRevision(text)) {
    issues.push(`${path} must be a single revision token.`);
  }
  return text;
}
