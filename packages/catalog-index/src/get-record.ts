import { existsSync } from "node:fs";

import { MissingIndexError } from "./errors.js";
import { assertGeneratedIndex, openDatabase } from "./sqlite.js";
import { mapStoredRow, selectRecord } from "./stored-record.js";
import type { CatalogRecord } from "./types.js";

export function getRecord(dbPath: string, id: string): CatalogRecord | null {
  if (id.trim() === "") {
    return null;
  }
  if (!existsSync(dbPath)) {
    throw new MissingIndexError(dbPath);
  }
  const db = openDatabase(dbPath, true);
  try {
    assertGeneratedIndex(db);
    const row = selectRecord(db, id);
    return row === undefined ? null : mapStoredRow(row);
  } finally {
    db.close();
  }
}
