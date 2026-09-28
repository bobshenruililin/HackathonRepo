import { existsSync } from "node:fs";

import { MissingIndexError } from "./errors.js";
import { assertGeneratedIndex, openDatabase } from "./sqlite.js";
import type { SearchHit } from "./types.js";

export function searchRecords(dbPath: string, query: string): SearchHit[] {
  if (query.trim() === "") {
    throw new Error("Search query must not be empty");
  }
  if (!existsSync(dbPath)) {
    throw new MissingIndexError(dbPath);
  }
  const db = openDatabase(dbPath, true);
  try {
    assertGeneratedIndex(db);
    const rows = db
      .prepare(
        `SELECT records.id AS id,
                records.title AS title,
                records.summary AS summary,
                records.synthetic AS synthetic
         FROM records_fts
         JOIN records ON records.rowid = records_fts.rowid
         WHERE records_fts MATCH ?
         ORDER BY records.id`,
      )
      .all(query) as Array<{
      id: string;
      title: string;
      summary: string;
      synthetic: number;
    }>;
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      synthetic: row.synthetic === 1,
    }));
  } finally {
    db.close();
  }
}
