import { TaxonomyError } from "./errors.js";
import { acceptValue, createTaxonomyRegistry, proposeValue } from "./registry.js";
import type { DimensionAssignment, TaxonomyRegistry } from "./types.js";

/**
 * Source-reported HackMIT gallery track labels. A track name is not an
 * inferred product fact. Other dimensions stay unaccepted.
 */
const TRACKS = [
  {
    value: "education",
    sourceRecordId: "clm_00768ae88abf319e3138a36d",
    rationale:
      "The gallery card names the track Education. This accepted value is that source-reported track label, not an inferred product domain.",
  },
  {
    value: "healthcare",
    sourceRecordId: "clm_01d60e9dc49024e403be85ee",
    rationale:
      "The gallery card names the track Healthcare. This accepted value is that source-reported track label, not an inferred product domain.",
  },
  {
    value: "sustainability",
    sourceRecordId: "clm_009fb40c2b9f2453c13bac7b",
    rationale:
      "The gallery card names the track Sustainability. This accepted value is that source-reported track label, not an inferred product domain.",
  },
  {
    value: "entertainment",
    sourceRecordId: "clm_006be899a6138630600218a3",
    rationale:
      "The gallery card names the track Entertainment. This accepted value is that source-reported track label, not an inferred product domain.",
  },
  {
    value: "interactive-media",
    sourceRecordId: "clm_0200108b11c2c8b1fe7373f1",
    rationale:
      "The gallery card names the track Interactive Media. This accepted value is that source-reported track label, not an inferred product domain.",
  },
] as const;

type HackmitTrackValue = (typeof TRACKS)[number]["value"];

/**
 * Exact gallery-card sentences. A prize title, a sponsor challenge, or any
 * other track label is not an assignment.
 */
const GALLERY_TRACK_STATEMENT = {
  "The gallery card names the track Education.": "education",
  "The gallery card names the track Healthcare.": "healthcare",
  "The gallery card names the track Sustainability.": "sustainability",
  "The gallery card names the track Entertainment.": "entertainment",
  "The gallery card names the track Interactive Media.": "interactive-media",
} as const satisfies Record<string, HackmitTrackValue>;

export function hackmitTrackTaxonomy(): TaxonomyRegistry {
  let registry = createTaxonomyRegistry();
  for (const track of TRACKS) {
    registry = proposeValue(registry, {
      dimension: "problem-domain",
      value: track.value,
      rationale: track.rationale,
      sourceRecordId: track.sourceRecordId,
    });
    registry = acceptValue(registry, {
      dimension: "problem-domain",
      value: track.value,
    });
  }
  return registry;
}

/**
 * Assigns problem-domain only from an exact gallery track sentence.
 * Beginner, General, NO TRACK, Music, Finance, prize titles, and sponsor
 * challenges stay unknown. Two different exact tracks stay unknown.
 * This function does not propose or accept taxonomy values.
 */
export function assignHackmitTrackFromClaims(
  claims: readonly { readonly statement: string }[],
): DimensionAssignment {
  if (!Array.isArray(claims)) {
    throw new TaxonomyError("invalid-assignment", "Track assignment reads a list of claim statements.");
  }

  let assigned: HackmitTrackValue | undefined;
  for (const claim of claims) {
    if (!isClaim(claim) || typeof claim.statement !== "string") {
      continue;
    }
    const value = trackForExactStatement(claim.statement);
    if (value === undefined) {
      continue;
    }
    if (assigned !== undefined && assigned !== value) {
      return Object.freeze({ status: "unknown" });
    }
    assigned = value;
  }

  if (assigned === undefined) {
    return Object.freeze({ status: "unknown" });
  }
  return Object.freeze({ status: "value", value: assigned });
}

function trackForExactStatement(statement: string): HackmitTrackValue | undefined {
  if (!Object.hasOwn(GALLERY_TRACK_STATEMENT, statement)) {
    return undefined;
  }
  return GALLERY_TRACK_STATEMENT[statement as keyof typeof GALLERY_TRACK_STATEMENT];
}

function isClaim(value: unknown): value is { statement: string } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
