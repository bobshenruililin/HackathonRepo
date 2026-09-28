import {
  countRecords,
  getRecord,
  listRecords,
  MissingIndexError,
  type CatalogRecord,
  type ListFilters,
} from "@hackathon-atlas/catalog-index";

import { resolveIndexPath } from "./index-path";

export type IndexSnapshot =
  | { status: "not-generated" }
  | {
      status: "generated";
      counts: { real: number; synthetic: number };
      records: CatalogRecord[];
      all: CatalogRecord[];
      searchError?: string;
    };

export function readIndex(filters: ListFilters = {}): IndexSnapshot {
  const indexPath = resolveIndexPath();
  try {
    const counts = countRecords(indexPath);
    try {
      return {
        status: "generated",
        counts,
        all: listRecords(indexPath),
        records: listRecords(indexPath, filters),
      };
    } catch (error) {
      return {
        status: "generated",
        counts,
        all: [],
        records: [],
        searchError: error instanceof Error ? error.message : "The generated index could not be searched.",
      };
    }
  } catch (error) {
    if (isMissingIndex(error)) {
      return { status: "not-generated" };
    }
    throw error;
  }
}

export function readOne(id: string): {
  snapshot: IndexSnapshot;
  record: CatalogRecord | null;
} {
  const indexPath = resolveIndexPath();
  const snapshot = readIndex();
  if (snapshot.status === "not-generated") {
    return { snapshot, record: null };
  }
  try {
    return { snapshot, record: getRecord(indexPath, id) };
  } catch (error) {
    return {
      snapshot: {
        ...snapshot,
        searchError: error instanceof Error ? error.message : "The generated index could not be read.",
      },
      record: null,
    };
  }
}

function isMissingIndex(error: unknown): boolean {
  return error instanceof MissingIndexError || (error instanceof Error && error.name === "MissingIndexError");
}
