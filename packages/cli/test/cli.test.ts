import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { buildIndex, countRecords, searchRecords } from "@hackathon-atlas/catalog-index";

import { HELP, runCli, searchIndex } from "../src/index.js";
import type { SearchResponse } from "../src/index.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const fixtureDir = fileURLToPath(new URL("../../catalog-index/fixtures/", import.meta.url));
const cliBin = path.join(packageRoot, "dist", "main.js");
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("package pins", () => {
  it("keeps TypeScript 7.0.2 and Vitest 5.0.2 and does not add a model or vector client", () => {
    const manifest = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(manifest.dependencies ?? {}).toEqual({});
    expect(manifest.devDependencies).toEqual({
      "@hackathon-atlas/catalog-index": "workspace:*",
      "@types/node": "24.19.0",
      typescript: "7.0.2",
      vitest: "5.0.2",
    });
  });
});

describe("synthetic fixture index", () => {
  it("does not count the committed synthetic fixture as real", () => {
    const dbPath = tempDb();
    expect(buildIndex({ catalogDir: fixtureDir, dbPath })).toEqual({ real: 0, synthetic: 1 });
    const result = searchIndex({
      indexPath: dbPath,
      query: "HackMIT",
      filters: [{ field: "event", value: "HackMIT" }],
    });
    expect(result.hitCounts).toEqual({
      status: "known",
      real: 0,
      synthetic: 1,
      reason: null,
    });
    expect(result.hits.map((hit) => hit.id)).toEqual(["synthetic-fixture-not-a-real-project"]);
    expect(result.hits[0]?.synthetic).toBe(true);
    expect(result.filters).toEqual([
      {
        field: "event",
        value: "HackMIT",
        status: "unknown",
        applied: false,
        reason: 'Generated index has no records column "event". Filter was not applied.',
      },
    ]);
    expect(result.hits.map((hit) => hit.id)).toEqual(searchRecords(dbPath, "HackMIT").map((hit) => hit.id));
  });
});

describe("searchIndex", () => {
  it("splits hit counts by the stored synthetic flag and ignores a missing filter column", () => {
    const dbPath = indexWithFlags();
    const unfiltered = searchIndex({ indexPath: dbPath, query: "TESTONLYTOKEN", filters: [] });
    expect(unfiltered.hitCounts).toEqual({ status: "known", real: 1, synthetic: 1, reason: null });
    expect(unfiltered.hits.map((hit) => [hit.id, hit.synthetic])).toEqual([
      ["test-only-synthetic-false", false],
      ["test-only-synthetic-true", true],
    ]);

    const filtered = searchIndex({
      indexPath: dbPath,
      query: "TESTONLYTOKEN",
      filters: [
        { field: "synthetic", value: "true" },
        { field: "year", value: "2024" },
      ],
    });
    expect(filtered.filters.map((filter) => [filter.field, filter.status, filter.applied])).toEqual([
      ["synthetic", "applied", true],
      ["year", "unknown", false],
    ]);
    expect(filtered.hitCounts).toEqual({ status: "known", real: 0, synthetic: 1, reason: null });
    expect(filtered.hits.map((hit) => hit.id)).toEqual(["test-only-synthetic-true"]);
  });

  it("applies a column that exists and still no-ops a column that does not", () => {
    const dbPath = indexWithFlags();
    const db = new DatabaseSync(dbPath);
    db.exec("ALTER TABLE records ADD COLUMN event TEXT");
    db.prepare("UPDATE records SET event = ? WHERE id = ?").run(
      "TESTONLY",
      "test-only-synthetic-false",
    );
    db.close();

    const result = searchIndex({
      indexPath: dbPath,
      query: "TESTONLYTOKEN",
      filters: [
        { field: "event", value: "TESTONLY" },
        { field: "award", value: "invented" },
      ],
    });
    expect(result.filters.find((filter) => filter.field === "event")).toMatchObject({
      status: "applied",
      applied: true,
    });
    expect(result.filters.find((filter) => filter.field === "award")).toMatchObject({
      status: "unknown",
      applied: false,
    });
    expect(result.hits.map((hit) => hit.id)).toEqual(["test-only-synthetic-false"]);
    expect(result.hitCounts).toEqual({ status: "known", real: 1, synthetic: 0, reason: null });
  });

  it("does not count rows as real when the synthetic column is absent", () => {
    const dbPath = tempDb();
    writeIndexWithoutSyntheticColumn(dbPath);
    const result = searchIndex({
      indexPath: dbPath,
      query: "TEST ONLY",
      filters: [{ field: "track", value: "unknown-track" }],
    });
    expect(result.hitCounts).toEqual({
      status: "unknown",
      real: null,
      synthetic: null,
      reason:
        'Generated index has no records column "synthetic". Matching rows were not counted as real.',
    });
    expect(result.hits).toEqual([
      {
        id: "test-only-no-synthetic-column",
        title: "TEST ONLY no synthetic column",
        summary: "Temporary unit-test input. Not a hackathon project.",
        synthetic: null,
      },
    ]);
    expect(result.filters[0]).toMatchObject({ field: "track", status: "unknown", applied: false });
  });

  it("binds filter values and does not treat them as SQL", () => {
    const dbPath = indexWithFlags();
    const result = searchIndex({
      indexPath: dbPath,
      query: "TESTONLYTOKEN",
      filters: [{ field: "title", value: "TEST ONLY ' OR '1'='1" }],
    });
    expect(result.filters[0]?.applied).toBe(true);
    expect(result.hits).toEqual([]);
    expect(result.hitCounts).toEqual({ status: "known", real: 0, synthetic: 0, reason: null });
    expect(countRecords(dbPath)).toEqual({ real: 1, synthetic: 1 });
  });

  it("rejects an unsafe filter field before querying", () => {
    const dbPath = indexWithFlags();
    expect(() =>
      searchIndex({
        indexPath: dbPath,
        query: "TESTONLYTOKEN",
        filters: [{ field: "id;drop", value: "x" }],
      }),
    ).toThrow(/identifier/);
    expect(countRecords(dbPath)).toEqual({ real: 1, synthetic: 1 });
  });

  it("throws when the generated index is missing", () => {
    const dbPath = path.join(tempDir(), "missing.sqlite");
    expect(() => searchIndex({ indexPath: dbPath, query: "token", filters: [] })).toThrow(
      /Generated index does not exist/,
    );
    expect(existsSync(dbPath)).toBe(false);
  });

  it("rejects a database that is not a generated FTS5 index", () => {
    const dbPath = tempDb();
    const db = new DatabaseSync(dbPath);
    db.exec("CREATE TABLE other (id TEXT)");
    db.close();
    expect(() => searchIndex({ indexPath: dbPath, query: "token", filters: [] })).toThrow(
      /not a generated FTS5 catalog index/,
    );
  });
});

describe("runCli", () => {
  it("prints help without searching", () => {
    const result = capture(["--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe(HELP);
    expect(result.stdout).toMatch(/unknown/);
    expect(result.stdout).toMatch(/vector database/);
    expect(result.stderr).toBe("");
  });

  it("returns JSON for a keyword search and labels unknown filters on stderr", () => {
    const dbPath = indexWithFlags();
    const result = capture([
      "search",
      "--index",
      dbPath,
      "--filter",
      "synthetic=false",
      "--filter",
      "event=HackMIT",
      "TESTONLYTOKEN",
    ]);
    expect(result.code).toBe(0);
    expect(result.stderr).toMatch(/event was not applied/);
    expect(result.stderr).toMatch(/Status: unknown/);
    const body = parseStdout(result.stdout);
    expect(body.query).toBe("TESTONLYTOKEN");
    expect(body.indexPath).toBe(path.resolve(dbPath));
    expect(body.hitCounts).toEqual({ status: "known", real: 1, synthetic: 0, reason: null });
    expect(body.hits.map((hit) => hit.id)).toEqual(["test-only-synthetic-false"]);
    expect(body.hits[0]?.title).toBe("TEST ONLY synthetic flag false");
    expect(body.hits[0]?.summary).toMatch(/Not a hackathon project/);
  });

  it("exits 2 on a usage error and exits 1 when the index is missing", () => {
    expect(capture(["search", "--index", tempDb(), "   "]).code).toBe(2);
    const missing = capture(["search", "--index", path.join(tempDir(), "missing.sqlite"), "token"]);
    expect(missing.code).toBe(1);
    expect(missing.stderr).toMatch(/Generated index does not exist/);
    expect(missing.stdout).toBe("");
  });

  it("rejects a repeated filter and a non-boolean synthetic value", () => {
    const dbPath = indexWithFlags();
    expect(capture(["search", "--index", dbPath, "--filter", "year=1", "--filter", "year=2", "token"]).code).toBe(
      2,
    );
    expect(capture(["search", "--index", dbPath, "--filter", "synthetic=maybe", "token"]).code).toBe(2);
  });

  it("runs the built executable against a temporary index", () => {
    expect(existsSync(cliBin)).toBe(true);
    const dbPath = indexWithFlags();
    const result = spawnSync(
      process.execPath,
      [cliBin, "search", "--index", dbPath, "--filter", "award=none", "TESTONLYTOKEN"],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    const body = parseStdout(result.stdout);
    expect(body.hitCounts).toEqual({ status: "known", real: 1, synthetic: 1, reason: null });
    expect(body.filters[0]).toMatchObject({ field: "award", status: "unknown", applied: false });
    expect(result.stderr).toMatch(/Synthetic hits are labeled synthetic/);
  });
});

function capture(argv: readonly string[]): { code: number; stdout: string; stderr: string } {
  let stdout = "";
  let stderr = "";
  const code = runCli(argv, {
    stdout: (chunk) => {
      stdout += chunk;
    },
    stderr: (chunk) => {
      stderr += chunk;
    },
  });
  return { code, stdout, stderr };
}

function parseStdout(stdout: string): SearchResponse {
  return JSON.parse(stdout) as SearchResponse;
}

function indexWithFlags(): string {
  const catalogDir = tempDir();
  writeFileSync(
    path.join(catalogDir, "flag-false.json"),
    JSON.stringify({
      id: "test-only-synthetic-false",
      title: "TEST ONLY synthetic flag false",
      summary: "TESTONLYTOKEN temporary unit-test input. Not a hackathon project.",
      synthetic: false,
    }),
  );
  writeFileSync(
    path.join(catalogDir, "flag-true.json"),
    JSON.stringify({
      id: "test-only-synthetic-true",
      title: "SYNTHETIC TEST RECORD",
      summary: "TESTONLYTOKEN labeled synthetic unit-test input. Not a hackathon project.",
      synthetic: true,
    }),
  );
  const dbPath = path.join(catalogDir, "index.sqlite");
  expect(buildIndex({ catalogDir, dbPath })).toEqual({ real: 1, synthetic: 1 });
  return dbPath;
}

function writeIndexWithoutSyntheticColumn(dbPath: string): void {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE records (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL
    ) STRICT;
    CREATE VIRTUAL TABLE records_fts USING fts5(
      title,
      summary,
      content='records',
      content_rowid='rowid'
    );
    INSERT INTO records (id, title, summary) VALUES (
      'test-only-no-synthetic-column',
      'TEST ONLY no synthetic column',
      'Temporary unit-test input. Not a hackathon project.'
    );
    INSERT INTO records_fts(records_fts) VALUES('rebuild');
  `);
  db.close();
}

function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "catalog-cli-"));
  tempDirs.push(dir);
  return dir;
}

function tempDb(): string {
  return path.join(tempDir(), "index.sqlite");
}
