import type { DatabaseSync } from "node:sqlite";

import { parseStoredDetails } from "./details.js";
import type { CatalogRecord } from "./types.js";

export type StoredRow = {
  id: string;
  title: string;
  summary: string;
  synthetic: number;
  search_text: string;
  details_json: string;
};

const SELECT_RECORD = `SELECT id, title, summary, synthetic, search_text, details_json FROM records`;

export function selectRecords(db: DatabaseSync): StoredRow[] {
  return db.prepare(`${SELECT_RECORD} ORDER BY id`).all() as StoredRow[];
}

export function selectRecord(db: DatabaseSync, id: string): StoredRow | undefined {
  return db.prepare(`${SELECT_RECORD} WHERE id = ?`).get(id) as StoredRow | undefined;
}

export function matchingIds(db: DatabaseSync, query: string): Set<string> {
  const rows = db
    .prepare(
      `SELECT records.id AS id
       FROM records_fts
       JOIN records ON records.rowid = records_fts.rowid
       WHERE records_fts MATCH ?`,
    )
    .all(query) as Array<{ id: string }>;
  return new Set(rows.map((row) => row.id));
}

export function mapStoredRow(row: StoredRow): CatalogRecord {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    synthetic: row.synthetic === 1,
    searchText: row.search_text,
    details: parseStoredDetails(row.details_json),
  };
}
