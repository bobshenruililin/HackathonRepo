/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

import { AnalogueError } from "./errors.js";
import { CATALOG_SCHEMA_VERSION } from "./types.js";

const CLAIM_BASES = new Set(["source-reported", "code-observed", "test-observed", "inferred"]);
const REVIEW_STATUSES = new Set(["unreviewed", "accepted", "rejected"]);
const SUBJECT_ENTITIES = new Set(["event", "project", "submission", "repository"]);

export type CatalogProject = {
  readonly id: string;
  readonly synthetic: boolean;
};

export type CatalogClaim = {
  readonly id: string;
  readonly statement: string;
  readonly basis: string;
  readonly reviewStatus: string;
  readonly evidenceIds: readonly string[];
  readonly subject: {
    readonly entity: string;
    readonly id: string;
  };
};

export type ParsedCatalog = {
  readonly projects: ReadonlyMap<string, CatalogProject>;
  readonly submissionProject: ReadonlyMap<string, string>;
  readonly repositoryProject: ReadonlyMap<string, string>;
  readonly evidenceIds: ReadonlySet<string>;
  readonly claims: readonly CatalogClaim[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function fail(message: string): never {
  throw new AnalogueError("invalid-catalog", message);
}

function requiredArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) fail(`Catalog field ${field} must be an array.`);
  return value;
}

function requiredString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") fail(`${path} must be a non-empty string.`);
  return value;
}

function stringList(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) fail(`${path} must be an array of non-empty strings.`);
  const items: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || item === "") fail(`${path} must be an array of non-empty strings.`);
    items.push(item);
  }
  return items;
}

function readResolution(value: unknown, path: string): void {
  if (!isRecord(value)) fail(`${path}.resolution must be an object.`);
  if (value.status === "known") {
    if (typeof value.value !== "string") fail(`${path}.resolution.value must be a string.`);
    return;
  }
  if (value.status === "unknown") {
    if (typeof value.reason !== "string") fail(`${path}.resolution.reason must be a string.`);
    return;
  }
  fail(`${path}.resolution.status must be known or unknown.`);
}

/**
 * Read the catalog JSON shape ingest writes. This function does not fetch
 * and does not open a catalog directory.
 */
export function parseCatalog(input: unknown): ParsedCatalog {
  if (!isRecord(input)) fail("Catalog must be a JSON object.");
  if (input.schemaVersion !== CATALOG_SCHEMA_VERSION) {
    fail(`Catalog schemaVersion must be ${CATALOG_SCHEMA_VERSION}.`);
  }

  requiredArray(input.events, "events");
  const projectRows = requiredArray(input.projects, "projects");
  const submissionRows = requiredArray(input.submissions, "submissions");
  const repositoryRows = requiredArray(input.repositories, "repositories");
  const evidenceRows = requiredArray(input.evidence, "evidence");
  const claimRows = requiredArray(input.claims, "claims");

  const projects = new Map<string, CatalogProject>();
  for (const [index, row] of projectRows.entries()) {
    if (!isRecord(row)) fail(`projects[${index}] must be an object.`);
    const id = requiredString(row.id, `projects[${index}].id`);
    if (typeof row.synthetic !== "boolean") fail(`projects[${index}].synthetic must be a boolean.`);
    if (projects.has(id)) fail(`Duplicate project id ${id}.`);
    projects.set(id, { id, synthetic: row.synthetic });
  }

  const submissionProject = new Map<string, string>();
  for (const [index, row] of submissionRows.entries()) {
    if (!isRecord(row)) fail(`submissions[${index}] must be an object.`);
    const id = requiredString(row.id, `submissions[${index}].id`);
    const projectId = requiredString(row.projectId, `submissions[${index}].projectId`);
    if (!projects.has(projectId)) fail(`submissions[${index}] cites a missing project.`);
    if (submissionProject.has(id)) fail(`Duplicate submission id ${id}.`);
    submissionProject.set(id, projectId);
  }

  const repositoryProject = new Map<string, string>();
  for (const [index, row] of repositoryRows.entries()) {
    if (!isRecord(row)) fail(`repositories[${index}] must be an object.`);
    const id = requiredString(row.id, `repositories[${index}].id`);
    const projectId = requiredString(row.projectId, `repositories[${index}].projectId`);
    if (!projects.has(projectId)) fail(`repositories[${index}] cites a missing project.`);
    if (repositoryProject.has(id)) fail(`Duplicate repository id ${id}.`);
    repositoryProject.set(id, projectId);
  }

  const evidenceIds = new Set<string>();
  for (const [index, row] of evidenceRows.entries()) {
    if (!isRecord(row)) fail(`evidence[${index}] must be an object.`);
    const id = requiredString(row.id, `evidence[${index}].id`);
    if (evidenceIds.has(id)) fail(`Duplicate evidence id ${id}.`);
    evidenceIds.add(id);
  }

  const claims: CatalogClaim[] = [];
  const claimIds = new Set<string>();
  for (const [index, row] of claimRows.entries()) {
    const path = `claims[${index}]`;
    if (!isRecord(row)) fail(`${path} must be an object.`);
    const id = requiredString(row.id, `${path}.id`);
    if (claimIds.has(id)) fail(`Duplicate claim id ${id}.`);
    claimIds.add(id);
    const statement = requiredString(row.statement, `${path}.statement`);
    const basis = requiredString(row.basis, `${path}.basis`);
    if (!CLAIM_BASES.has(basis)) fail(`${path}.basis is not a schema 0.1.0 claim basis.`);
    const reviewStatus = requiredString(row.reviewStatus, `${path}.reviewStatus`);
    if (!REVIEW_STATUSES.has(reviewStatus)) fail(`${path}.reviewStatus is not a schema 0.1.0 review status.`);
    const evidenceIds = stringList(row.evidenceIds, `${path}.evidenceIds`);
    if (!isRecord(row.subject)) fail(`${path}.subject must be an object.`);
    const entity = requiredString(row.subject.entity, `${path}.subject.entity`);
    if (!SUBJECT_ENTITIES.has(entity)) fail(`${path}.subject.entity is not a schema 0.1.0 entity.`);
    const subjectId = requiredString(row.subject.id, `${path}.subject.id`);
    readResolution(row.resolution, path);
    claims.push({
      id,
      statement,
      basis,
      reviewStatus,
      evidenceIds,
      subject: { entity, id: subjectId },
    });
  }

  return {
    projects,
    submissionProject,
    repositoryProject,
    evidenceIds,
    claims,
  };
}

export function projectIdForClaim(catalog: ParsedCatalog, claim: CatalogClaim): string | null {
  if (claim.subject.entity === "project") {
    return catalog.projects.has(claim.subject.id) ? claim.subject.id : null;
  }
  if (claim.subject.entity === "submission") {
    return catalog.submissionProject.get(claim.subject.id) ?? null;
  }
  if (claim.subject.entity === "repository") {
    return catalog.repositoryProject.get(claim.subject.id) ?? null;
  }
  return null;
}
