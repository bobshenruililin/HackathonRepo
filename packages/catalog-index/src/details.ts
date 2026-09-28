import type {
  ClaimBasis,
  EvidenceKind,
  IndexedClaim,
  IndexedEvidence,
  IndexedRepository,
  IndexedSubmission,
  KnownOrUnknown,
  RecordDetails,
  ReviewStatus,
  UnknownField,
} from "./types.js";

const MAX_ID_LENGTH = 200;
const MAX_TEXT_LENGTH = 400;
const MAX_URL_LENGTH = 300;
const MAX_QUOTE_LENGTH = 240;
const MAX_REASON_LENGTH = 300;
const MAX_ATTRIBUTION_LENGTH = 120;
const MAX_PATH_LENGTH = 200;
const MAX_REVISION_LENGTH = 120;
const MAX_ITEMS = 50;

const CLAIM_BASIS: readonly ClaimBasis[] = [
  "source-reported",
  "code-observed",
  "test-observed",
  "inferred",
];
const REVIEW_STATUS: readonly ReviewStatus[] = ["unreviewed", "accepted", "rejected"];
const EVIDENCE_KINDS: readonly EvidenceKind[] = ["source", "code", "test"];

const FORBIDDEN_KEYS = new Set([
  "email",
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

const TOP_LEVEL_KEYS = new Set([
  "id",
  "title",
  "summary",
  "synthetic",
  "evidence",
  "submissions",
  "repositories",
  "claims",
]);

type ListRead<T> = {
  listed: boolean;
  items: T[];
};

export function assertCatalogFields(value: Record<string, unknown>, fileName: string): void {
  assertKeys(value, TOP_LEVEL_KEYS, fileName, fileName);
}

export function readTitle(value: Record<string, unknown>, fileName: string): string {
  return requiredPlainString(value.title, fileName, "title", MAX_TEXT_LENGTH);
}

export function readSummary(
  value: Record<string, unknown>,
  fileName: string,
): { column: string; source: KnownOrUnknown } {
  if (!Object.hasOwn(value, "summary")) {
    throw new Error(`${fileName} field summary must be a non-empty string`);
  }
  const raw = value.summary;
  if (typeof raw === "string") {
    if (raw.trim() === "") {
      throw new Error(`${fileName} field summary must be a non-empty string`);
    }
    const text = bounded(raw.trim(), fileName, "summary", MAX_TEXT_LENGTH);
    return { column: text, source: { status: "known", value: text } };
  }
  if (isObject(raw) && raw.status === "unknown") {
    const unknown = parseMaybe(raw, fileName, "summary", MAX_TEXT_LENGTH);
    return { column: "", source: unknown };
  }
  throw new Error(`${fileName} field summary must be a non-empty string`);
}

export function buildRecordDetails(
  value: Record<string, unknown>,
  fileName: string,
  input: {
    id: string;
    title: string;
    summary: KnownOrUnknown;
    synthetic: boolean;
    syntheticFlagRecorded: boolean;
  },
): { details: RecordDetails; searchText: string } {
  const evidence = readEvidence(value, fileName);
  const submissions = readSubmissions(value, fileName, input.id);
  const repositories = readRepositories(value, fileName, input.id);
  const claims = readClaims(value, fileName, input.id);
  const details: RecordDetails = {
    sourceFacts: {
      title: { status: "known", value: input.title },
      summary: input.summary,
      synthetic: input.syntheticFlagRecorded
        ? { status: "known", value: input.synthetic ? "true" : "false" }
        : {
            status: "unknown",
            reason: "The catalog file did not include a synthetic flag.",
          },
    },
    evidence: evidence.items,
    submissions: submissions.items,
    repositories: repositories.items,
    claims: claims.items,
    unknowns: [],
  };
  details.unknowns = collectUnknowns(details, {
    evidence: evidence.listed,
    submissions: submissions.listed,
    repositories: repositories.listed,
    claims: claims.listed,
  });
  return { details, searchText: buildSearchText(details) };
}

export function parseStoredDetails(json: string): RecordDetails {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Generated index details are not valid JSON: ${message}`);
  }
  if (!isObject(parsed)) {
    throw new Error("Generated index details are not an object");
  }
  const sourceFacts = parsed.sourceFacts;
  if (!isObject(sourceFacts)) {
    throw new Error("Generated index details are missing source facts");
  }
  const details: RecordDetails = {
    sourceFacts: {
      title: storedMaybe(sourceFacts.title, "title"),
      summary: storedMaybe(sourceFacts.summary, "summary"),
      synthetic: storedMaybe(sourceFacts.synthetic, "synthetic"),
    },
    evidence: storedArray(parsed.evidence, "evidence").map((item) => storedEvidence(item)),
    submissions: storedArray(parsed.submissions, "submissions").map((item) => storedSubmission(item)),
    repositories: storedArray(parsed.repositories, "repositories").map((item) =>
      storedRepository(item),
    ),
    claims: storedArray(parsed.claims, "claims").map((item) => storedClaim(item)),
    unknowns: storedArray(parsed.unknowns, "unknowns").map((item) => storedUnknown(item)),
  };
  return details;
}

function readEvidence(value: Record<string, unknown>, fileName: string): ListRead<IndexedEvidence> {
  return readList(value, "evidence", fileName, (item, index) => {
    const path = `evidence[${index}]`;
    const record = objectItem(item, fileName, path, evidenceKeys());
    const kind = requiredEnum(record.kind, EVIDENCE_KINDS, fileName, `${path}.kind`);
    const evidence: IndexedEvidence = {
      id: requiredPlainString(record.id, fileName, `${path}.id`, MAX_ID_LENGTH),
      kind,
      synthetic: requiredBoolean(record, "synthetic", fileName, path),
    };
    if (kind === "source") {
      rejectPresent(
        record,
        ["repositoryId", "inspectedRevision", "path", "result", "observedAt"],
        fileName,
        path,
      );
      const excerpt = readExcerpt(record, fileName, path);
      evidence.sourceUrl = optionalMaybe(record, "sourceUrl", fileName, path, MAX_URL_LENGTH);
      evidence.retrievedAt = optionalMaybe(record, "retrievedAt", fileName, path, MAX_TEXT_LENGTH);
      evidence.quote = excerpt.quote;
      evidence.attribution = excerpt.attribution;
    } else {
      rejectPresent(
        record,
        ["sourceUrl", "retrievedAt", "quote", "attribution", "excerpt"],
        fileName,
        path,
      );
      evidence.repositoryId = optionalMaybe(record, "repositoryId", fileName, path, MAX_ID_LENGTH);
      evidence.inspectedRevision = optionalMaybe(
        record,
        "inspectedRevision",
        fileName,
        path,
        MAX_REVISION_LENGTH,
      );
      evidence.observedAt = optionalMaybe(record, "observedAt", fileName, path, MAX_TEXT_LENGTH);
      if (kind === "code") {
        rejectPresent(record, ["result"], fileName, path);
        evidence.path = optionalMaybe(record, "path", fileName, path, MAX_PATH_LENGTH);
      } else {
        rejectPresent(record, ["path"], fileName, path);
        evidence.result = optionalResult(record, fileName, path);
      }
    }
    return evidence;
  });
}

function readExcerpt(
  record: Record<string, unknown>,
  fileName: string,
  path: string,
): { quote: KnownOrUnknown; attribution: KnownOrUnknown } {
  const hasExcerpt = Object.hasOwn(record, "excerpt");
  const hasFlat = Object.hasOwn(record, "quote") || Object.hasOwn(record, "attribution");
  if (hasExcerpt && hasFlat) {
    throw new Error(`${fileName} ${path} uses both excerpt and quote`);
  }
  if (!hasExcerpt) {
    return {
      quote: optionalMaybe(record, "quote", fileName, path, MAX_QUOTE_LENGTH),
      attribution: optionalMaybe(record, "attribution", fileName, path, MAX_ATTRIBUTION_LENGTH),
    };
  }
  if (!isObject(record.excerpt)) {
    throw new Error(`${fileName} ${path}.excerpt must be an object`);
  }
  assertKeys(record.excerpt, new Set(["kind", "attribution", "quote"]), fileName, `${path}.excerpt`);
  if (record.excerpt.kind !== "third-party-excerpt") {
    throw new Error(`${fileName} ${path}.excerpt.kind must be third-party-excerpt`);
  }
  return {
    quote: optionalMaybe(record.excerpt, "quote", fileName, `${path}.excerpt`, MAX_QUOTE_LENGTH),
    attribution: optionalMaybe(
      record.excerpt,
      "attribution",
      fileName,
      `${path}.excerpt`,
      MAX_ATTRIBUTION_LENGTH,
    ),
  };
}

function readSubmissions(
  value: Record<string, unknown>,
  fileName: string,
  projectId: string,
): ListRead<IndexedSubmission> {
  return readList(value, "submissions", fileName, (item, index) => {
    const path = `submissions[${index}]`;
    const record = objectItem(
      item,
      fileName,
      path,
      new Set(["id", "synthetic", "eventId", "eventName", "submittedAt", "projectId"]),
    );
    assertSameProject(record, projectId, fileName, path);
    return {
      id: requiredPlainString(record.id, fileName, `${path}.id`, MAX_ID_LENGTH),
      synthetic: requiredBoolean(record, "synthetic", fileName, path),
      eventId: optionalMaybe(record, "eventId", fileName, path, MAX_ID_LENGTH),
      eventName: optionalMaybe(record, "eventName", fileName, path, MAX_TEXT_LENGTH),
      submittedAt: optionalMaybe(record, "submittedAt", fileName, path, MAX_TEXT_LENGTH),
    };
  });
}

function readRepositories(
  value: Record<string, unknown>,
  fileName: string,
  projectId: string,
): ListRead<IndexedRepository> {
  return readList(value, "repositories", fileName, (item, index) => {
    const path = `repositories[${index}]`;
    const record = objectItem(
      item,
      fileName,
      path,
      new Set(["id", "synthetic", "locator", "projectId"]),
    );
    assertSameProject(record, projectId, fileName, path);
    return {
      id: requiredPlainString(record.id, fileName, `${path}.id`, MAX_ID_LENGTH),
      synthetic: requiredBoolean(record, "synthetic", fileName, path),
      locator: optionalMaybe(record, "locator", fileName, path, MAX_URL_LENGTH),
    };
  });
}

function readClaims(
  value: Record<string, unknown>,
  fileName: string,
  projectId: string,
): ListRead<IndexedClaim> {
  return readList(value, "claims", fileName, (item, index) => {
    const path = `claims[${index}]`;
    const record = objectItem(
      item,
      fileName,
      path,
      new Set([
        "id",
        "synthetic",
        "statement",
        "basis",
        "reviewStatus",
        "evidenceIds",
        "sourceUrl",
        "retrievedAt",
        "observedAt",
        "resolution",
        "subject",
      ]),
    );
    assertClaimSubject(record, projectId, fileName, path);
    if (!Object.hasOwn(record, "statement")) {
      throw new Error(`${fileName} ${path}.statement must be a non-empty string`);
    }
    return {
      id: requiredPlainString(record.id, fileName, `${path}.id`, MAX_ID_LENGTH),
      synthetic: requiredBoolean(record, "synthetic", fileName, path),
      statement: requiredPlainString(record.statement, fileName, `${path}.statement`, MAX_TEXT_LENGTH),
      basis: requiredEnum(record.basis, CLAIM_BASIS, fileName, `${path}.basis`),
      reviewStatus: requiredEnum(record.reviewStatus, REVIEW_STATUS, fileName, `${path}.reviewStatus`),
      evidenceIds: readEvidenceIds(record, fileName, path),
      sourceUrl: optionalMaybe(record, "sourceUrl", fileName, path, MAX_URL_LENGTH),
      retrievedAt: optionalMaybe(record, "retrievedAt", fileName, path, MAX_TEXT_LENGTH),
      observedAt: optionalMaybe(record, "observedAt", fileName, path, MAX_TEXT_LENGTH),
      resolution: optionalMaybe(record, "resolution", fileName, path, MAX_TEXT_LENGTH),
    };
  });
}

function readEvidenceIds(
  record: Record<string, unknown>,
  fileName: string,
  path: string,
): IndexedClaim["evidenceIds"] {
  if (!Object.hasOwn(record, "evidenceIds")) {
    return {
      status: "unknown",
      reason: "The catalog file did not include evidenceIds.",
    };
  }
  const raw = record.evidenceIds;
  if (!Array.isArray(raw)) {
    throw new Error(`${fileName} ${path}.evidenceIds must be an array`);
  }
  if (raw.length > MAX_ITEMS) {
    throw new Error(`${fileName} ${path}.evidenceIds exceeds ${MAX_ITEMS} items`);
  }
  const ids = raw.map((item, index) =>
    requiredPlainString(item, fileName, `${path}.evidenceIds[${index}]`, MAX_ID_LENGTH),
  );
  return { status: "known", value: ids };
}

function collectUnknowns(
  details: RecordDetails,
  listed: {
    evidence: boolean;
    submissions: boolean;
    repositories: boolean;
    claims: boolean;
  },
): UnknownField[] {
  const unknowns: UnknownField[] = [];
  if (details.sourceFacts.summary.status === "unknown") {
    unknowns.push({ field: "summary", reason: details.sourceFacts.summary.reason });
  }
  if (details.sourceFacts.synthetic.status === "unknown") {
    unknowns.push({ field: "synthetic", reason: details.sourceFacts.synthetic.reason });
  }
  if (details.evidence.length === 0) {
    unknowns.push({
      field: "evidence",
      reason: listed.evidence
        ? "The catalog file included an empty evidence list."
        : "The catalog file did not include evidence.",
    });
  }
  if (details.submissions.length === 0) {
    unknowns.push({
      field: "submissions",
      reason: listed.submissions
        ? "The catalog file included an empty submissions list."
        : "The catalog file did not include submissions.",
    });
  }
  if (details.repositories.length === 0) {
    unknowns.push({
      field: "repositories",
      reason: listed.repositories
        ? "The catalog file included an empty repositories list."
        : "The catalog file did not include repositories.",
    });
  }
  if (details.claims.length === 0) {
    unknowns.push({
      field: "claims",
      reason: listed.claims
        ? "The catalog file included an empty claims list."
        : "The catalog file did not include claims.",
    });
    unknowns.push({
      field: "basis",
      reason: "No claim basis was recorded for this record.",
    });
    unknowns.push({
      field: "reviewStatus",
      reason: "No review status was recorded for this record.",
    });
  }
  const hasSourceUrl =
    details.evidence.some((item) => item.sourceUrl?.status === "known") ||
    details.claims.some((item) => item.sourceUrl.status === "known");
  if (!hasSourceUrl) {
    unknowns.push({
      field: "sourceUrl",
      reason: "No source URL was recorded for this record.",
    });
  }
  const hasEvent = details.submissions.some((item) => item.eventId.status === "known");
  if (!hasEvent) {
    unknowns.push({
      field: "event",
      reason:
        details.submissions.length === 0
          ? "No event was recorded for this record."
          : "No submission recorded a known event.",
    });
  }
  const hasLocator = details.repositories.some((item) => item.locator.status === "known");
  if (!hasLocator) {
    unknowns.push({
      field: "repositoryLocator",
      reason:
        details.repositories.length === 0
          ? "No repository locator was recorded for this record."
          : "No repository recorded a known locator.",
    });
  }
  return unknowns;
}

function buildSearchText(details: RecordDetails): string {
  const parts: string[] = [];
  const push = (value: KnownOrUnknown | undefined): void => {
    if (value?.status === "known") {
      parts.push(value.value);
    }
  };
  for (const item of details.evidence) {
    parts.push(item.id);
    push(item.sourceUrl);
    push(item.quote);
    push(item.attribution);
    push(item.repositoryId);
    push(item.inspectedRevision);
    push(item.path);
    push(item.result);
  }
  for (const item of details.submissions) {
    parts.push(item.id);
    push(item.eventId);
    push(item.eventName);
  }
  for (const item of details.repositories) {
    parts.push(item.id);
    push(item.locator);
  }
  for (const item of details.claims) {
    parts.push(item.id, item.statement, item.basis, item.reviewStatus);
    if (item.evidenceIds.status === "known") {
      parts.push(item.evidenceIds.value.join("\n"));
    }
    push(item.sourceUrl);
    push(item.resolution);
  }
  return parts.join("\n");
}

function readList<T>(
  value: Record<string, unknown>,
  key: "evidence" | "submissions" | "repositories" | "claims",
  fileName: string,
  mapItem: (item: unknown, index: number) => T,
): ListRead<T> {
  if (!Object.hasOwn(value, key)) {
    return { listed: false, items: [] };
  }
  const raw = value[key];
  if (!Array.isArray(raw)) {
    throw new Error(`${fileName} field ${key} must be an array`);
  }
  if (raw.length > MAX_ITEMS) {
    throw new Error(`${fileName} field ${key} exceeds ${MAX_ITEMS} items`);
  }
  const items = raw.map((item, index) => mapItem(item, index));
  assertUniqueIds(items, fileName, key);
  return { listed: true, items };
}

function assertUniqueIds(items: readonly unknown[], fileName: string, label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (!isObject(item) || typeof item.id !== "string") {
      continue;
    }
    if (seen.has(item.id)) {
      throw new Error(`${fileName} duplicate ${label} id: ${item.id}`);
    }
    seen.add(item.id);
  }
}

function objectItem(
  item: unknown,
  fileName: string,
  path: string,
  allowed: ReadonlySet<string>,
): Record<string, unknown> {
  if (!isObject(item)) {
    throw new Error(`${fileName} ${path} must be an object`);
  }
  assertKeys(item, allowed, fileName, path);
  return item;
}

function assertSameProject(
  record: Record<string, unknown>,
  projectId: string,
  fileName: string,
  path: string,
): void {
  if (!Object.hasOwn(record, "projectId")) {
    return;
  }
  const value = requiredPlainString(record.projectId, fileName, `${path}.projectId`, MAX_ID_LENGTH);
  if (value !== projectId) {
    throw new Error(`${fileName} ${path}.projectId does not match the project record`);
  }
}

function assertClaimSubject(
  record: Record<string, unknown>,
  projectId: string,
  fileName: string,
  path: string,
): void {
  if (!Object.hasOwn(record, "subject")) {
    return;
  }
  if (!isObject(record.subject)) {
    throw new Error(`${fileName} ${path}.subject must be an object`);
  }
  assertKeys(record.subject, new Set(["entity", "id"]), fileName, `${path}.subject`);
  if (record.subject.entity !== "project" || record.subject.id !== projectId) {
    throw new Error(`${fileName} ${path}.subject must be this project record`);
  }
}

function optionalResult(
  record: Record<string, unknown>,
  fileName: string,
  path: string,
): KnownOrUnknown {
  if (!Object.hasOwn(record, "result")) {
    return { status: "unknown", reason: "The catalog file did not include result." };
  }
  const parsed = parseMaybe(record.result, fileName, `${path}.result`, 20);
  if (parsed.status === "known" && parsed.value !== "passed" && parsed.value !== "failed") {
    throw new Error(`${fileName} ${path}.result must be passed, failed, or unknown`);
  }
  return parsed;
}

function optionalMaybe(
  record: Record<string, unknown>,
  key: string,
  fileName: string,
  path: string,
  maxLength: number,
): KnownOrUnknown {
  if (!Object.hasOwn(record, key)) {
    return { status: "unknown", reason: `The catalog file did not include ${key}.` };
  }
  return parseMaybe(record[key], fileName, `${path}.${key}`, maxLength);
}

function parseMaybe(value: unknown, fileName: string, path: string, maxLength: number): KnownOrUnknown {
  if (typeof value === "string") {
    return { status: "known", value: bounded(value.trim(), fileName, path, maxLength) };
  }
  if (!isObject(value)) {
    throw new Error(`${fileName} ${path} must be a string or a known or unknown value`);
  }
  if (value.status === "known") {
    assertKeys(value, new Set(["status", "value"]), fileName, path);
    if (typeof value.value !== "string") {
      throw new Error(`${fileName} ${path}.value must be a non-empty string`);
    }
    return { status: "known", value: bounded(value.value.trim(), fileName, `${path}.value`, maxLength) };
  }
  if (value.status === "unknown") {
    assertKeys(value, new Set(["status", "reason"]), fileName, path);
    if (typeof value.reason !== "string") {
      throw new Error(`${fileName} ${path}.reason must be a non-empty string`);
    }
    return {
      status: "unknown",
      reason: bounded(value.reason.trim(), fileName, `${path}.reason`, MAX_REASON_LENGTH),
    };
  }
  throw new Error(`${fileName} ${path}.status must be known or unknown`);
}

function requiredBoolean(
  record: Record<string, unknown>,
  field: string,
  fileName: string,
  path: string,
): boolean {
  const raw = record[field];
  if (!Object.hasOwn(record, field) || typeof raw !== "boolean") {
    throw new Error(`${fileName} ${path}.${field} must be a boolean`);
  }
  return raw;
}

function rejectPresent(
  record: Record<string, unknown>,
  keys: readonly string[],
  fileName: string,
  path: string,
): void {
  for (const key of keys) {
    if (Object.hasOwn(record, key)) {
      throw new Error(`${fileName} ${path}.${key} does not apply to this evidence kind`);
    }
  }
}

function requiredEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fileName: string,
  path: string,
): T {
  if (typeof value === "string" && allowed.includes(value as T)) {
    return value as T;
  }
  throw new Error(`${fileName} ${path} must be one of ${allowed.join(", ")}`);
}

function requiredPlainString(value: unknown, fileName: string, path: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fileName} ${path} must be a non-empty string`);
  }
  return bounded(value.trim(), fileName, path, maxLength);
}

function bounded(value: string, fileName: string, path: string, maxLength: number): string {
  if (value === "") {
    throw new Error(`${fileName} ${path} must be a non-empty string`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fileName} ${path} exceeds ${maxLength} characters`);
  }
  return value;
}

function assertKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  fileName: string,
  path: string,
): void {
  for (const key of Object.keys(value)) {
    const normalized = key.toLowerCase().replace(/[_-]/g, "");
    if (FORBIDDEN_KEYS.has(normalized)) {
      throw new Error(`${fileName} ${path}.${key} is not allowed in the index`);
    }
    if (!allowed.has(key)) {
      throw new Error(`${fileName} ${path}.${key} is unexpected`);
    }
  }
}

function evidenceKeys(): Set<string> {
  return new Set([
    "id",
    "kind",
    "synthetic",
    "sourceUrl",
    "retrievedAt",
    "quote",
    "attribution",
    "excerpt",
    "repositoryId",
    "inspectedRevision",
    "path",
    "result",
    "observedAt",
  ]);
}

function storedMaybe(value: unknown, field: string): KnownOrUnknown {
  if (!isObject(value)) {
    throw new Error(`Generated index source fact ${field} is missing`);
  }
  if (value.status === "known" && typeof value.value === "string") {
    return { status: "known", value: value.value };
  }
  if (value.status === "unknown" && typeof value.reason === "string") {
    return { status: "unknown", reason: value.reason };
  }
  throw new Error(`Generated index source fact ${field} is invalid`);
}

function storedArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Generated index ${field} is missing`);
  }
  return value;
}

function storedEvidence(value: unknown): IndexedEvidence {
  if (!isObject(value) || typeof value.id !== "string" || typeof value.synthetic !== "boolean") {
    throw new Error("Generated index evidence is invalid");
  }
  if (value.kind !== "source" && value.kind !== "code" && value.kind !== "test") {
    throw new Error("Generated index evidence kind is invalid");
  }
  return {
    id: value.id,
    kind: value.kind,
    synthetic: value.synthetic,
    sourceUrl: optionalStoredMaybe(value.sourceUrl),
    retrievedAt: optionalStoredMaybe(value.retrievedAt),
    observedAt: optionalStoredMaybe(value.observedAt),
    quote: optionalStoredMaybe(value.quote),
    attribution: optionalStoredMaybe(value.attribution),
    repositoryId: optionalStoredMaybe(value.repositoryId),
    inspectedRevision: optionalStoredMaybe(value.inspectedRevision),
    path: optionalStoredMaybe(value.path),
    result: optionalStoredMaybe(value.result),
  };
}

function storedSubmission(value: unknown): IndexedSubmission {
  if (!isObject(value) || typeof value.id !== "string" || typeof value.synthetic !== "boolean") {
    throw new Error("Generated index submission is invalid");
  }
  return {
    id: value.id,
    synthetic: value.synthetic,
    eventId: storedMaybe(value.eventId, "eventId"),
    eventName: storedMaybe(value.eventName, "eventName"),
    submittedAt: storedMaybe(value.submittedAt, "submittedAt"),
  };
}

function storedRepository(value: unknown): IndexedRepository {
  if (!isObject(value) || typeof value.id !== "string" || typeof value.synthetic !== "boolean") {
    throw new Error("Generated index repository is invalid");
  }
  return {
    id: value.id,
    synthetic: value.synthetic,
    locator: storedMaybe(value.locator, "locator"),
  };
}

function storedClaim(value: unknown): IndexedClaim {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    typeof value.synthetic !== "boolean" ||
    typeof value.statement !== "string"
  ) {
    throw new Error("Generated index claim is invalid");
  }
  if (!isClaimBasis(value.basis) || !isReviewStatus(value.reviewStatus)) {
    throw new Error("Generated index claim basis or review status is invalid");
  }
  return {
    id: value.id,
    synthetic: value.synthetic,
    statement: value.statement,
    basis: value.basis,
    reviewStatus: value.reviewStatus,
    evidenceIds: storedEvidenceIds(value.evidenceIds),
    sourceUrl: storedMaybe(value.sourceUrl, "sourceUrl"),
    retrievedAt: storedMaybe(value.retrievedAt, "retrievedAt"),
    observedAt: storedMaybe(value.observedAt, "observedAt"),
    resolution: storedMaybe(value.resolution, "resolution"),
  };
}

function storedEvidenceIds(value: unknown): IndexedClaim["evidenceIds"] {
  if (!isObject(value)) {
    throw new Error("Generated index evidenceIds is missing");
  }
  if (value.status === "unknown" && typeof value.reason === "string") {
    return { status: "unknown", reason: value.reason };
  }
  if (value.status === "known" && Array.isArray(value.value) && value.value.every((item) => typeof item === "string")) {
    return { status: "known", value: value.value };
  }
  throw new Error("Generated index evidenceIds is invalid");
}

function storedUnknown(value: unknown): UnknownField {
  if (!isObject(value) || typeof value.field !== "string" || typeof value.reason !== "string") {
    throw new Error("Generated index unknown is invalid");
  }
  return { field: value.field, reason: value.reason };
}

function optionalStoredMaybe(value: unknown): KnownOrUnknown | undefined {
  if (value === undefined) {
    return undefined;
  }
  return storedMaybe(value, "field");
}

function isClaimBasis(value: unknown): value is ClaimBasis {
  return typeof value === "string" && CLAIM_BASIS.includes(value as ClaimBasis);
}

function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && REVIEW_STATUS.includes(value as ReviewStatus);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
