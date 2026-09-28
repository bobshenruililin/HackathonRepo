import { countRecords, MissingIndexError } from "@hackathon-atlas/catalog-index";

import { resolveIndexPath } from "./index-path";

export type GeneratedCounts =
  | { status: "generated"; real: number; synthetic: number }
  | { status: "not-generated" };

export function readGeneratedCounts(indexPath = resolveIndexPath()): GeneratedCounts {
  try {
    const counts = countRecords(indexPath);
    return { status: "generated", real: counts.real, synthetic: counts.synthetic };
  } catch (error) {
    if (isMissingIndex(error)) {
      return { status: "not-generated" };
    }
    throw error;
  }
}

function isMissingIndex(error: unknown): boolean {
  return error instanceof MissingIndexError || (error instanceof Error && error.name === "MissingIndexError");
}
