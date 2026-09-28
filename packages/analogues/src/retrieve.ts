/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

import { parseCatalog, projectIdForClaim, type CatalogClaim, type ParsedCatalog } from "./catalog.js";
import { AnalogueError } from "./errors.js";
import { extractSharedText } from "./extract.js";
import { ANALOGUE_MODES, type Analogue, type AnalogueCitation, type AnalogueMode, type AnalogueRetrieval, type SharedEvidence } from "./types.js";

type Hit = {
  readonly projectId: string;
  readonly synthetic: boolean;
  readonly key: string;
  readonly display: string;
  readonly generic: boolean;
  readonly unknown: boolean;
  readonly citation: AnalogueCitation;
};

function isMode(value: string): value is AnalogueMode {
  return (ANALOGUE_MODES as readonly string[]).includes(value);
}

function absentReason(mode: AnalogueMode): string {
  if (mode === "direct") return "No track or challenge was named for this project.";
  if (mode === "mechanism") return "No technology-bearing claim was named for this project.";
  return "No demo URL was stated for this project.";
}

function emptyResult(
  projectId: string,
  mode: AnalogueMode,
  status: "unknown" | "no-match",
  reason: string,
): AnalogueRetrieval {
  return {
    status,
    projectId,
    mode,
    reason,
    analogues: [],
    realAnalogueCount: 0,
  };
}

function claimUsable(catalog: ParsedCatalog, claim: CatalogClaim): boolean {
  if (claim.reviewStatus === "rejected") return false;
  if (claim.basis === "inferred") return false;
  if (claim.evidenceIds.length === 0) return false;
  return claim.evidenceIds.every((id) => catalog.evidenceIds.has(id));
}

function hitsFor(catalog: ParsedCatalog, mode: AnalogueMode): Hit[] {
  const hits: Hit[] = [];
  for (const claim of catalog.claims) {
    if (!claimUsable(catalog, claim)) continue;
    const projectId = projectIdForClaim(catalog, claim);
    if (!projectId) continue;
    const project = catalog.projects.get(projectId);
    if (!project) continue;
    const extracted = extractSharedText(claim.statement, mode);
    const citation: AnalogueCitation = {
      projectId,
      claimId: claim.id,
      statement: claim.statement,
      evidenceIds: claim.evidenceIds,
    };
    if (extracted.unknown) {
      hits.push({
        projectId,
        synthetic: project.synthetic,
        key: "",
        display: "",
        generic: false,
        unknown: true,
        citation,
      });
      continue;
    }
    for (const value of extracted.values) {
      hits.push({
        projectId,
        synthetic: project.synthetic,
        key: value.key,
        display: value.display,
        generic: value.generic,
        unknown: false,
        citation,
      });
    }
  }
  return hits;
}

function byClaimId(left: AnalogueCitation, right: AnalogueCitation): number {
  return left.claimId.localeCompare(right.claimId);
}

function sharedEvidence(queryHits: readonly Hit[], otherHits: readonly Hit[]): SharedEvidence[] {
  const keys = [...new Set(otherHits.map((hit) => hit.key))].sort((left, right) => left.localeCompare(right));
  return keys.map((key) => {
    const queryDisplay = queryHits.find((hit) => hit.key === key)?.display;
    const text = queryDisplay && queryDisplay.length > 0 ? queryDisplay : key;
    const claims = [
      ...queryHits.filter((hit) => hit.key === key).map((hit) => hit.citation).sort(byClaimId),
      ...otherHits.filter((hit) => hit.key === key).map((hit) => hit.citation).sort(byClaimId),
    ];
    return { text, claims };
  });
}

/**
 * Deterministic analogue retrieval.
 * `direct` shares a named track or challenge.
 * `mechanism` shares a dependency, Built With tag, gallery technology, or code-observed technology token.
 * `demo` shares a demo URL host.
 * Generic shared text and award labels do not match. Unknown stays unknown.
 */
export function retrieveAnalogues(catalog: unknown, projectId: string, mode: string): AnalogueRetrieval {
  if (typeof projectId !== "string" || projectId.trim() === "") {
    throw new AnalogueError("invalid-project-id", "Project id must be a non-empty string.");
  }
  if (!isMode(mode)) {
    throw new AnalogueError("invalid-mode", "Mode must be direct, mechanism, or demo.");
  }

  const parsed = parseCatalog(catalog);
  if (!parsed.projects.has(projectId)) {
    return emptyResult(projectId, mode, "unknown", "The project id is not in the catalog.");
  }

  const hits = hitsFor(parsed, mode);
  const mine = hits.filter((hit) => hit.projectId === projectId);
  const specific = mine.filter((hit) => !hit.generic && !hit.unknown);
  const generic = mine.filter((hit) => hit.generic);
  const unknown = mine.filter((hit) => hit.unknown);

  if (specific.length === 0) {
    if (generic.length > 0) {
      return emptyResult(projectId, mode, "no-match", "The shared text is too generic to justify an analogue.");
    }
    if (unknown.length > 0) {
      return emptyResult(projectId, mode, "unknown", "The catalog states this value is unknown.");
    }
    return emptyResult(projectId, mode, "unknown", absentReason(mode));
  }

  const keys = new Set(specific.map((hit) => hit.key));
  const grouped = new Map<string, Hit[]>();
  for (const hit of hits) {
    if (hit.projectId === projectId || hit.generic || hit.unknown || !keys.has(hit.key)) continue;
    const group = grouped.get(hit.projectId) ?? [];
    group.push(hit);
    grouped.set(hit.projectId, group);
  }

  if (grouped.size === 0) {
    return emptyResult(projectId, mode, "no-match", "No other project shares a specific value for this mode.");
  }

  const analogues: Analogue[] = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([otherId, otherHits]) => {
      const project = parsed.projects.get(otherId);
      return {
        projectId: otherId,
        synthetic: project?.synthetic ?? true,
        shared: sharedEvidence(specific, otherHits),
      };
    });

  return {
    status: "matched",
    projectId,
    mode,
    analogues,
    realAnalogueCount: analogues.filter((analogue) => !analogue.synthetic).length,
  };
}
