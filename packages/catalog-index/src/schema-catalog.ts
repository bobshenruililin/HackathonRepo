import { readFileSync } from "node:fs";

import { recordFromObject } from "./load-catalog.js";
import type { CatalogRecord } from "./types.js";

/**
 * Reads one schema 0.1.0 catalog document and projects each project into an
 * index record. The catalog file stays the canonical source. This projection
 * is only an index input.
 */
export function loadSchemaCatalog(catalogFile: string): CatalogRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(catalogFile, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${catalogFile} is not valid JSON: ${message}`);
  }
  if (!isObject(parsed)) {
    throw new Error(`${catalogFile} must be a catalog object`);
  }
  if (parsed.schemaVersion !== "0.1.0" || parsed.authoritative !== true) {
    throw new Error(`${catalogFile} is not a schema 0.1.0 canonical catalog`);
  }
  const events = new Map<string, string>();
  for (const event of requiredArray(parsed.events, "events")) {
    if (!isObject(event) || typeof event.id !== "string" || typeof event.name !== "string") {
      throw new Error(`${catalogFile} has an event without an id and name`);
    }
    events.set(event.id, event.name);
  }
  const submissions = groupByProject(requiredArray(parsed.submissions, "submissions"));
  const repositories = groupByProject(requiredArray(parsed.repositories, "repositories"));
  const evidence = new Map<string, Record<string, unknown>>();
  for (const item of requiredArray(parsed.evidence, "evidence")) {
    if (isObject(item) && typeof item.id === "string") evidence.set(item.id, item);
  }
  const claims = new Map<string, Record<string, unknown>[]>();
  for (const item of requiredArray(parsed.claims, "claims")) {
    if (!isObject(item) || !isObject(item.subject)) continue;
    if (item.subject.entity !== "project" || typeof item.subject.id !== "string") continue;
    const list = claims.get(item.subject.id) ?? [];
    list.push(item);
    claims.set(item.subject.id, list);
  }

  const records: CatalogRecord[] = [];
  for (const project of requiredArray(parsed.projects, "projects")) {
    if (!isObject(project) || typeof project.id !== "string" || typeof project.name !== "string") {
      throw new Error(`${catalogFile} has a project without an id and name`);
    }
    const projectClaims = claims.get(project.id) ?? [];
    const evidenceIds = new Set<string>();
    for (const claim of projectClaims) {
      if (!Array.isArray(claim.evidenceIds)) continue;
      for (const id of claim.evidenceIds) {
        if (typeof id === "string") evidenceIds.add(id);
      }
    }
    const projectedEvidence = [...evidenceIds]
      .map((id) => evidence.get(id))
      .filter((item): item is Record<string, unknown> => item !== undefined)
      .map(indexEvidence)
      .filter((item): item is Record<string, unknown> => item !== null);
    const projected = {
      id: project.id,
      title: project.name,
      summary: indexSummary(project.summary),
      synthetic: project.synthetic === true,
      submissions: (submissions.get(project.id) ?? []).map((item) => projectSubmission(item, events)),
      repositories: (repositories.get(project.id) ?? []).map(projectRepository),
      evidence: projectedEvidence,
      claims: projectClaims.map(projectClaim),
    };
    records.push(recordFromObject(projected, project.id));
  }
  return records;
}

function projectSubmission(
  item: Record<string, unknown>,
  events: ReadonlyMap<string, string>,
): Record<string, unknown> {
  const eventId = typeof item.eventId === "string" ? item.eventId : "";
  const eventName = events.get(eventId);
  return {
    id: item.id,
    synthetic: item.synthetic === true,
    projectId: item.projectId,
    eventId: eventId === "" ? { status: "unknown", reason: "No event id was staged." } : { status: "known", value: eventId },
    eventName:
      eventName === undefined
        ? { status: "unknown", reason: "The catalog has no event name for this submission." }
        : { status: "known", value: eventName },
    submittedAt: item.submittedAt,
  };
}

function projectRepository(item: Record<string, unknown>): Record<string, unknown> {
  return {
    id: item.id,
    synthetic: item.synthetic === true,
    projectId: item.projectId,
    locator: item.locator,
  };
}

function projectClaim(item: Record<string, unknown>): Record<string, unknown> {
  return {
    id: item.id,
    synthetic: item.synthetic === true,
    statement: item.statement,
    basis: item.basis,
    reviewStatus: item.reviewStatus,
    evidenceIds: item.evidenceIds,
    sourceUrl: item.sourceUrl,
    retrievedAt: item.retrievedAt,
    observedAt: item.observedAt,
    resolution: item.resolution,
    subject: item.subject,
  };
}

function indexEvidence(item: Record<string, unknown>): Record<string, unknown> | null {
  if (item.kind === "source") {
    return {
      id: item.id,
      kind: "source",
      synthetic: item.synthetic === true,
      sourceUrl: item.sourceUrl,
      retrievedAt: item.retrievedAt,
      ...(isObject(item.excerpt) ? { excerpt: item.excerpt } : {}),
    };
  }
  if (item.kind === "code") {
    return {
      id: item.id,
      kind: "code",
      synthetic: item.synthetic === true,
      repositoryId: item.repositoryId,
      inspectedRevision: item.inspectedRevision,
      observedAt: item.observedAt,
      path: item.path,
    };
  }
  return null;
}

function groupByProject(items: readonly unknown[]): Map<string, Record<string, unknown>[]> {
  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const item of items) {
    if (!isObject(item) || typeof item.projectId !== "string") continue;
    const list = grouped.get(item.projectId) ?? [];
    list.push(item);
    grouped.set(item.projectId, list);
  }
  return grouped;
}

function requiredArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Catalog field ${label} must be an array`);
  return value;
}

function indexSummary(value: unknown): unknown {
  if (isObject(value) && value.status === "known" && typeof value.value === "string" && value.value.trim() !== "") {
    return value.value.trim();
  }
  if (isObject(value) && value.status === "unknown" && typeof value.reason === "string" && value.reason.trim() !== "") {
    return { status: "unknown", reason: value.reason };
  }
  return { status: "unknown", reason: "No summary was staged for this project." };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
