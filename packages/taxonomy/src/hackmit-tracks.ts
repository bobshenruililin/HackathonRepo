import { acceptValue, createTaxonomyRegistry, proposeValue } from "./registry.js";
import type { TaxonomyRegistry } from "./types.js";

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
