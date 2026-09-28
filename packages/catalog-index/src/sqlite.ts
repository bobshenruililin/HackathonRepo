import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const SCHEMA = `
CREATE TABLE records (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  synthetic INTEGER NOT NULL CHECK (synthetic IN (0, 1))
) STRICT;

CREATE VIRTUAL TABLE records_fts USING fts5(
  title,
  summary,
  content='records',
  content_rowid='rowid'
);
`;

export function resetDatabaseFile(dbPath: string): void {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  rmSync(dbPath, { force: true });
  rmSync(`${dbPath}-wal`, { force: true });
  rmSync(`${dbPath}-shm`, { force: true });
}

export function openDatabase(dbPath: string, readOnly: boolean): DatabaseSync {
  return new DatabaseSync(dbPath, { readOnly, timeout: 5_000 });
}

export function createSchema(db: DatabaseSync): void {
  assertFts5(db);
  db.exec(SCHEMA);
}

export function rebuildFts(db: DatabaseSync): void {
  db.exec("INSERT INTO records_fts(records_fts) VALUES('rebuild')");
  db.exec("INSERT INTO records_fts(records_fts) VALUES('integrity-check')");
}

export function assertGeneratedIndex(db: DatabaseSync): void {
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE name IN ('records', 'records_fts')`,
    )
    .all() as Array<{ name: string }>;
  const names = new Set(rows.map((row) => row.name));
  if (!names.has("records") || !names.has("records_fts")) {
    throw new Error("Database is not a generated FTS5 catalog index");
  }
}

function assertFts5(db: DatabaseSync): void {
  const row = db
    .prepare(
      "SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled",
    )
    .get() as { enabled: number } | undefined;
  if (row?.enabled !== 1) {
    throw new Error("This Node.js build does not include SQLite FTS5");
  }
}
