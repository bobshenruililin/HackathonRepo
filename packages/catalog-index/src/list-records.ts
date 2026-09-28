import { existsSync } from "node:fs";

import { MissingIndexError } from "./errors.js";
import { matchesFilters } from "./filters.js";
import { assertGeneratedIndex, openDatabase } from "./sqlite.js";
import { mapStoredRow, matchingIds, selectRecords } from "./stored-record.js";
import type { CatalogRecord, ListFilters } from "./types.js";

export function listRecords(dbPath: string, filters: ListFilters = {}): CatalogRecord[] {
  if (!existsSync(dbPath)) {
    throw new MissingIndexError(dbPath);
  }
  const db = openDatabase(dbPath, true);
  try {
    assertGeneratedIndex(db);
    const query = filters.query?.trim() ?? "";
    const ids = query === "" ? null : matchingIds(db, query);
    return selectRecords(db)
      .filter((row) => ids === null || ids.has(row.id))
      .map((row) => mapStoredRow(row))
      .filter((record) => matchesFilters(record, filters));
  } finally {
    db.close();
  }
}
