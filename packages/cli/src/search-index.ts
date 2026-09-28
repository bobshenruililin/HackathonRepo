/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { CliUsageError } from "./errors.js";
import type {
  FilterRequest,
  FilterResult,
  HitCounts,
  SearchHit,
  SearchOptions,
  SearchResponse,
} from "./types.js";

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const REQUIRED_COLUMNS = ["id", "title", "summary"] as const;

type ColumnInfo = {
  name: string;
  type: string;
};

type BoundFilter = {
  field: string;
  value: string | number;
};

export function searchIndex(options: SearchOptions): SearchResponse {
  const query = options.query.trim();
  if (query === "") {
    throw new CliUsageError("Search query must not be empty");
  }
  const indexPath = path.resolve(options.indexPath);
  if (!existsSync(indexPath)) {
    throw new Error(`Generated index does not exist: ${indexPath}`);
  }

  const requested = normalizeFilters(options.filters);
  const db = openReadOnly(indexPath);
  try {
    assertGeneratedIndex(db);
    const columns = listRecordColumns(db);
    for (const name of REQUIRED_COLUMNS) {
      if (!columns.has(name)) {
        throw new Error("Database is not a generated FTS5 catalog index");
      }
    }

    const filters: FilterResult[] = [];
    const applied: BoundFilter[] = [];
    for (const filter of requested) {
      const column = columns.get(filter.field);
      if (column === undefined) {
        filters.push({
          field: filter.field,
          value: filter.value,
          status: "unknown",
          applied: false,
          reason: `Generated index has no records column "${filter.field}". Filter was not applied.`,
        });
        continue;
      }
      applied.push({
        field: filter.field,
        value: bindFilterValue(column, filter.value),
      });
      filters.push({
        field: filter.field,
        value: filter.value,
        status: "applied",
        applied: true,
        reason: null,
      });
    }

    const syntheticColumn = columns.get("synthetic");
    const hits = runSearch(db, query, applied, syntheticColumn !== undefined);
    return {
      query,
      indexPath,
      filters,
      hitCounts: countHits(hits, syntheticColumn !== undefined),
      hits,
    };
  } finally {
    db.close();
  }
}

function normalizeFilters(filters: readonly FilterRequest[]): FilterRequest[] {
  const seen = new Set<string>();
  const normalized: FilterRequest[] = [];
  for (const filter of filters) {
    if (!IDENTIFIER.test(filter.field)) {
      throw new CliUsageError(
        `Filter field must be an identifier of letters, digits, and underscores: ${filter.field}`,
      );
    }
    if (filter.value.trim() === "") {
      throw new CliUsageError(`Filter ${filter.field} must not have an empty value`);
    }
    if (seen.has(filter.field)) {
      throw new CliUsageError(`Filter ${filter.field} was provided more than once`);
    }
    seen.add(filter.field);
    normalized.push({ field: filter.field, value: filter.value });
  }
  return normalized;
}

function bindFilterValue(column: ColumnInfo, value: string): string | number {
  if (column.name === "synthetic") {
    return parseSyntheticFlag(value);
  }
  if (column.type.toUpperCase().includes("INT")) {
    if (!/^-?\d+$/.test(value.trim())) {
      throw new CliUsageError(`Filter ${column.name} expects an integer`);
    }
    return Number(value.trim());
  }
  return value;
}

function parseSyntheticFlag(value: string): 0 | 1 {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") {
    return 1;
  }
  if (normalized === "false" || normalized === "0") {
    return 0;
  }
  throw new CliUsageError("Filter synthetic expects true, false, 1, or 0");
}

function openReadOnly(indexPath: string): DatabaseSync {
  try {
    return new DatabaseSync(indexPath, { readOnly: true, timeout: 5_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to open generated index: ${message}`);
  }
}

function assertGeneratedIndex(db: DatabaseSync): void {
  const rows = db
    .prepare(`SELECT name FROM sqlite_master WHERE name IN ('records', 'records_fts')`)
    .all() as Array<{ name: string }>;
  const names = new Set(rows.map((row) => row.name));
  if (!names.has("records") || !names.has("records_fts")) {
    throw new Error("Database is not a generated FTS5 catalog index");
  }
}

function listRecordColumns(db: DatabaseSync): Map<string, ColumnInfo> {
  const rows = db.prepare("PRAGMA table_info(records)").all() as Array<{
    name: string;
    type: string;
  }>;
  const columns = new Map<string, ColumnInfo>();
  for (const row of rows) {
    columns.set(row.name, { name: row.name, type: row.type });
  }
  return columns;
}

function runSearch(
  db: DatabaseSync,
  query: string,
  filters: readonly BoundFilter[],
  includeSynthetic: boolean,
): SearchHit[] {
  const clauses = ["records_fts MATCH ?"];
  const params: Array<string | number> = [query];
  for (const filter of filters) {
    clauses.push(`records.${quoteIdentifier(filter.field)} = ?`);
    params.push(filter.value);
  }
  const syntheticSelect = includeSynthetic
    ? "records.synthetic AS synthetic"
    : "NULL AS synthetic";
  const sql = `SELECT records.id AS id,
                      records.title AS title,
                      records.summary AS summary,
                      ${syntheticSelect}
               FROM records_fts
               JOIN records ON records.rowid = records_fts.rowid
               WHERE ${clauses.join(" AND ")}
               ORDER BY records.id`;
  let rows: Array<{
    id: string;
    title: string;
    summary: string;
    synthetic: number | null;
  }>;
  try {
    rows = db.prepare(sql).all(...params) as Array<{
      id: string;
      title: string;
      summary: string;
      synthetic: number | null;
    }>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Search query failed: ${message}`);
  }
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    synthetic: syntheticFlag(row.synthetic, includeSynthetic),
  }));
}

function syntheticFlag(value: number | null, includeSynthetic: boolean): boolean | null {
  if (!includeSynthetic) {
    return null;
  }
  if (value === 1) {
    return true;
  }
  if (value === 0) {
    return false;
  }
  throw new Error("Generated index returned an unexpected synthetic flag");
}

function countHits(hits: readonly SearchHit[], syntheticKnown: boolean): HitCounts {
  if (!syntheticKnown) {
    return {
      status: "unknown",
      real: null,
      synthetic: null,
      reason:
        "Generated index has no records column \"synthetic\". Matching rows were not counted as real.",
    };
  }
  let real = 0;
  let synthetic = 0;
  for (const hit of hits) {
    if (hit.synthetic === true) {
      synthetic += 1;
    } else if (hit.synthetic === false) {
      real += 1;
    } else {
      throw new Error("Generated index returned an unexpected synthetic flag");
    }
  }
  return { status: "known", real, synthetic, reason: null };
}

function quoteIdentifier(name: string): string {
  if (!IDENTIFIER.test(name)) {
    throw new CliUsageError(
      `Filter field must be an identifier of letters, digits, and underscores: ${name}`,
    );
  }
  return `"${name}"`;
}
