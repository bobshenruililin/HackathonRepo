import { existsSync } from "node:fs";
import type { DatabaseSync } from "node:sqlite";

import { MissingIndexError } from "./errors.js";
import { assertGeneratedIndex, openDatabase } from "./sqlite.js";
import type { RecordCounts } from "./types.js";

export function countRecords(dbPath: string): RecordCounts {
  if (!existsSync(dbPath)) {
    throw new MissingIndexError(dbPath);
  }
  const db = openDatabase(dbPath, true);
  try {
    assertGeneratedIndex(db);
    return readCounts(db);
  } finally {
    db.close();
  }
}

export function readCounts(db: DatabaseSync): RecordCounts {
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN synthetic = 0 THEN 1 ELSE 0 END), 0) AS real_count,
         COALESCE(SUM(CASE WHEN synthetic = 1 THEN 1 ELSE 0 END), 0) AS synthetic_count
       FROM records`,
    )
    .get() as { real_count: number; synthetic_count: number } | undefined;
  if (
    row === undefined ||
    typeof row.real_count !== "number" ||
    typeof row.synthetic_count !== "number"
  ) {
    throw new Error("Generated index returned an unexpected count row");
  }
  return { real: row.real_count, synthetic: row.synthetic_count };
}
