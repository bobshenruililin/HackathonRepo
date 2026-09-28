import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { buildIndex, countRecords, MissingIndexError, searchRecords } from "../src/index.js";

const fixtureDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("synthetic fixture", () => {
  it("is the only catalog file and is labeled synthetic", () => {
    const files = readdirSync(fixtureDir)
      .filter((name) => name.endsWith(".json"))
      .sort();
    expect(files).toEqual(["synthetic-not-a-real-project.json"]);
    const fixture = JSON.parse(
      readFileSync(path.join(fixtureDir, files[0] ?? ""), "utf8"),
    ) as { synthetic?: unknown; title?: unknown };
    expect(fixture.synthetic).toBe(true);
    expect(fixture.title).toMatch(/SYNTHETIC FIXTURE/i);
    expect(fixture.title).toMatch(/not a real/i);
  });

  it("does not increase the real count", () => {
    const dbPath = tempDb();
    expect(buildIndex({ catalogDir: fixtureDir, dbPath })).toEqual({
      real: 0,
      synthetic: 1,
    });
    expect(countRecords(dbPath)).toEqual({ real: 0, synthetic: 1 });
    const hits = searchRecords(dbPath, "SYNTHETIC");
    expect(hits.map((hit) => hit.id)).toEqual(["synthetic-fixture-not-a-real-project"]);
    expect(hits[0]?.synthetic).toBe(true);
  });

  it("does not duplicate rows when the index is rebuilt", () => {
    const dbPath = tempDb();
    buildIndex({ catalogDir: fixtureDir, dbPath });
    buildIndex({ catalogDir: fixtureDir, dbPath });
    expect(countRecords(dbPath)).toEqual({ real: 0, synthetic: 1 });
  });
});

describe("countRecords", () => {
  it("counts unlabeled records as real and labeled records as synthetic", () => {
    const catalogDir = tempDir();
    writeFileSync(
      path.join(catalogDir, "unlabeled.json"),
      JSON.stringify({
        id: "test-only-unlabeled-record",
        title: "TEST ONLY unlabeled record",
        summary: "Temporary unit-test input. Not a hackathon project.",
      }),
    );
    writeFileSync(
      path.join(catalogDir, "synthetic.json"),
      JSON.stringify({
        id: "test-only-synthetic-record",
        title: "SYNTHETIC TEST RECORD",
        summary: "Labeled synthetic unit-test input. Not a hackathon project.",
        synthetic: true,
      }),
    );
    const dbPath = path.join(catalogDir, "index.sqlite");
    expect(buildIndex({ catalogDir, dbPath })).toEqual({ real: 1, synthetic: 1 });
    expect(countRecords(dbPath)).toEqual({ real: 1, synthetic: 1 });
    expect(searchRecords(dbPath, "unlabeled").map((hit) => hit.synthetic)).toEqual([false]);
    expect(searchRecords(dbPath, "SYNTHETIC").every((hit) => hit.synthetic)).toBe(true);
  });

  it("returns zero for an empty catalog", () => {
    const catalogDir = tempDir();
    const dbPath = path.join(catalogDir, "index.sqlite");
    expect(buildIndex({ catalogDir, dbPath })).toEqual({ real: 0, synthetic: 0 });
    expect(searchRecords(dbPath, "anything")).toEqual([]);
  });

  it("throws when the generated index is missing", () => {
    const dbPath = path.join(tempDir(), "missing.sqlite");
    expect(() => countRecords(dbPath)).toThrow(MissingIndexError);
  });

  it("rejects a non-boolean synthetic flag", () => {
    const catalogDir = tempDir();
    writeFileSync(
      path.join(catalogDir, "bad.json"),
      JSON.stringify({
        id: "bad-synthetic-flag",
        title: "TEST ONLY bad flag",
        summary: "Temporary unit-test input.",
        synthetic: "true",
      }),
    );
    expect(() => buildIndex({ catalogDir, dbPath: path.join(catalogDir, "index.sqlite") })).toThrow(
      /synthetic must be a boolean/,
    );
  });
});

function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "catalog-index-"));
  tempDirs.push(dir);
  return dir;
}

function tempDb(): string {
  return path.join(tempDir(), "index.sqlite");
}
