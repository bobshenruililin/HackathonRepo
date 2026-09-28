/**
 * @license MIT
 * Copyright (c) 2026 Shen Ruililin
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildReport,
  cliArguments,
  defaultCliPath,
  defaultTaxonomyPath,
  runPrepareSearch,
  taxonomySection,
} from "./search.mjs";

const scriptPath = fileURLToPath(new URL("./search.mjs", import.meta.url));
const tempDirs = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("prepare-hackathon search", () => {
  it("forwards filters and keywords to the hackathon-atlas CLI without applying them here", () => {
    assert.deepEqual(cliArguments("/tmp/generated.sqlite", ["track=vision", "year=2024"], ["water", "sensor"]), [
      "search",
      "--index",
      "/tmp/generated.sqlite",
      "--filter",
      "track=vision",
      "--filter",
      "year=2024",
      "water",
      "sensor",
    ]);
    const source = readFileSync(scriptPath, "utf8");
    assert.doesNotMatch(source, /node:sqlite/);
    assert.doesNotMatch(source, /precision/);
    assert.doesNotMatch(source, /recall/);
  });

  it("leaves a missing filter column unknown and does not drop hits", async () => {
    const dbPath = writeIndex();
    const direct = spawnSync(
      process.execPath,
      [defaultCliPath(), "search", "--index", dbPath, "TESTONLYTOKEN"],
      { encoding: "utf8" },
    );
    assert.equal(direct.status, 0);
    const unfiltered = JSON.parse(direct.stdout);

    const result = await runPrepareSearch([
      "--index",
      dbPath,
      "--filter",
      "track=vision",
      "TESTONLYTOKEN",
    ]);
    assert.equal(result.code, 0);
    assert.match(result.stderr, /track was not applied/);
    assert.match(result.stderr, /Status: unknown/);

    const report = JSON.parse(result.stdout);
    const track = report.search.filters.find((filter) => filter.field === "track");
    assert.equal(track.status, "unknown");
    assert.equal(track.applied, false);
    assert.deepEqual(
      report.search.hits.map((hit) => hit.id),
      unfiltered.hits.map((hit) => hit.id),
    );
    assert.deepEqual(report.search.hitCounts, unfiltered.hitCounts);
    assert.equal(report.precedents.status, "NOT MEASURED");
    assert.equal(report.precedents.statement, "precedents are NOT MEASURED");
    assert.equal(report.tracks.status, "unknown");
    assert.equal(report.sponsors.status, "unknown");
    assert.equal(report.retrieval.status, "NOT MEASURED");
    assert.equal(Object.hasOwn(report.retrieval, "precision"), false);
    assert.equal(Object.hasOwn(report.retrieval, "recall"), false);
    assert.equal(report.taxonomy.status, "unknown");
    assert.equal(report.taxonomy.acceptedCount, 0);
    assert.equal(
      report.taxonomy.dimensions.every((dimension) => dimension.status === "unknown" && !("value" in dimension) && !("values" in dimension)),
      true,
    );
  });

  it("applies a column that exists and still does not apply a column that does not", async () => {
    const dbPath = writeIndex();
    const result = await runPrepareSearch([
      "--index",
      dbPath,
      "--filter",
      "synthetic=true",
      "--filter",
      "sponsor=Acme",
      "TESTONLYTOKEN",
    ]);
    assert.equal(result.code, 0);
    const report = JSON.parse(result.stdout);
    assert.deepEqual(
      report.search.filters.map((filter) => [filter.field, filter.status, filter.applied]),
      [
        ["synthetic", "applied", true],
        ["sponsor", "unknown", false],
      ],
    );
    assert.deepEqual(
      report.search.hits.map((hit) => hit.id),
      ["test-only-synthetic"],
    );
    assert.equal(report.search.hitCounts.real, 0);
    assert.equal(report.search.hitCounts.synthetic, 1);
    assert.equal(report.precedents.status, "NOT MEASURED");
    assert.equal(report.sponsors.status, "unknown");
    assert.doesNotMatch(JSON.stringify(report.precedents), /test-only/);
  });

  it("does not print a brief when the index is missing or the query is empty", async () => {
    const missing = await runPrepareSearch([
      "--index",
      path.join(tempDir(), "missing.sqlite"),
      "TESTONLYTOKEN",
    ]);
    assert.equal(missing.code, 1);
    assert.equal(missing.stdout, "");
    assert.match(missing.stderr, /Generated index does not exist/);

    const usage = await runPrepareSearch(["--index", path.join(tempDir(), "missing.sqlite")]);
    assert.equal(usage.code, 2);
    assert.equal(usage.stdout, "");
    assert.match(usage.stderr, /Search query must not be empty/);
  });

  it("prints help without searching", async () => {
    const result = await runPrepareSearch(["--help"]);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /unknown/);
    assert.match(result.stdout, /NOT MEASURED/);
    assert.equal(result.stderr, "");
  });

  it("keeps proposed taxonomy values unknown and reports an accepted value only on its dimension", async () => {
    const taxonomy = await import(pathToFileURL(defaultTaxonomyPath()).href);
    const empty = taxonomySection(taxonomy);
    assert.equal(empty.acceptedCount, 0);
    assert.deepEqual(
      empty.dimensions.map((dimension) => dimension.dimension),
      [...taxonomy.TAXONOMY_DIMENSIONS],
    );

    const proposed = taxonomy.proposeValue(taxonomy.createTaxonomyRegistry(), {
      dimension: "problem-domain",
      value: "sample-token",
      rationale: "Caller-supplied token for a later acceptance decision.",
      sourceRecordId: "evd_test_taxonomy_source_0001",
    });
    const proposedReport = taxonomySection(taxonomy, proposed);
    assert.equal(proposedReport.status, "unknown");
    assert.equal(proposedReport.acceptedCount, 0);

    const accepted = taxonomy.acceptValue(proposed, {
      dimension: "problem-domain",
      value: "sample-token",
    });
    const acceptedReport = taxonomySection(taxonomy, accepted);
    assert.equal(acceptedReport.acceptedCount, 1);
    const problemDomain = acceptedReport.dimensions.find((dimension) => dimension.dimension === "problem-domain");
    assert.deepEqual(problemDomain, {
      dimension: "problem-domain",
      status: "accepted",
      values: ["sample-token"],
    });
    const others = acceptedReport.dimensions.filter((dimension) => dimension.dimension !== "problem-domain");
    assert.equal(others.length, taxonomy.TAXONOMY_DIMENSIONS.length - 1);
    assert.equal(
      others.every((dimension) => dimension.status === "unknown"),
      true,
    );

    const search = {
      query: "TESTONLYTOKEN",
      indexPath: "/tmp/generated.sqlite",
      filters: [{ field: "award", value: "invented", status: "unknown", applied: false, reason: "absent" }],
      hitCounts: { status: "known", real: 0, synthetic: 0, reason: null },
      hits: [],
    };
    const report = buildReport(search, taxonomy, taxonomy.createTaxonomyRegistry());
    assert.equal(report.retrieval.status, "NOT MEASURED");
    assert.equal(Object.hasOwn(report, "precision"), false);
    assert.equal(report.tracks.status, "unknown");
    assert.equal(report.sponsors.status, "unknown");
    assert.equal(report.search, search);
  });

  it("runs the script executable against a temporary index", () => {
    const dbPath = writeIndex();
    const result = spawnSync(
      process.execPath,
      [scriptPath, "--index", dbPath, "--filter", "event=HackMIT", "TESTONLYTOKEN"],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0);
    const report = JSON.parse(result.stdout);
    assert.equal(report.search.filters[0].field, "event");
    assert.equal(report.search.filters[0].status, "unknown");
    assert.equal(report.search.filters[0].applied, false);
    assert.equal(report.search.hits.length, 2);
    assert.equal(report.precedents.statement, "precedents are NOT MEASURED");
    assert.equal(report.retrieval.status, "NOT MEASURED");
  });
});

function writeIndex() {
  const dbPath = path.join(tempDir(), "index.sqlite");
  const db = new DatabaseSync(dbPath);
  db.exec(`
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
    INSERT INTO records (id, title, summary, synthetic) VALUES
      (
        'test-only-nonsynthetic',
        'TEST ONLY water sensor',
        'TESTONLYTOKEN temporary unit-test input. Not a hackathon project.',
        0
      ),
      (
        'test-only-synthetic',
        'SYNTHETIC labeled fixture',
        'TESTONLYTOKEN labeled synthetic unit-test input. Not a precedent.',
        1
      );
    INSERT INTO records_fts(records_fts) VALUES('rebuild');
  `);
  db.close();
  return dbPath;
}

function tempDir() {
  const dir = mkdtempSync(path.join(tmpdir(), "prepare-hackathon-search-"));
  tempDirs.push(dir);
  return dir;
}
