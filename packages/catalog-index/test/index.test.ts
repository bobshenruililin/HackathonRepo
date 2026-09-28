import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  buildIndex,
  countRecords,
  getRecord,
  listRecords,
  MissingIndexError,
  searchRecords,
} from "../src/index.js";

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

describe("listRecords", () => {
  it("keeps an empty filter match for unknown fields and excludes a chosen known value", () => {
    const dbPath = tempDb();
    buildIndex({ catalogDir: fixtureDir, dbPath });
    const all = listRecords(dbPath);
    expect(all).toHaveLength(1);
    expect(all[0]?.synthetic).toBe(true);
    expect(all[0]?.details.evidence).toEqual([]);
    expect(all[0]?.details.unknowns.map((item) => item.field)).toEqual(
      expect.arrayContaining(["evidence", "submissions", "repositories", "basis", "event", "sourceUrl"]),
    );
    expect(listRecords(dbPath, { query: "" })).toHaveLength(1);
    expect(listRecords(dbPath, { basis: "" })).toHaveLength(1);
    expect(listRecords(dbPath, { basis: "unknown" }).map((record) => record.id)).toEqual([
      "synthetic-fixture-not-a-real-project",
    ]);
    expect(listRecords(dbPath, { basis: "source-reported" })).toEqual([]);
    expect(listRecords(dbPath, { repository: "unknown" })).toHaveLength(1);
    expect(listRecords(dbPath, { repository: "known" })).toEqual([]);
    expect(getRecord(dbPath, "synthetic-fixture-not-a-real-project")?.synthetic).toBe(true);
    expect(getRecord(dbPath, "missing-record")).toBeNull();
  });

  it("round-trips labeled synthetic evidence without counting it as real", () => {
    const catalogDir = tempDir();
    writeFileSync(
      path.join(catalogDir, "enriched.json"),
      JSON.stringify({
        id: "synthetic-test-enriched",
        title: "SYNTHETIC TEST ONLY enriched record",
        summary: "Labeled synthetic unit-test input. Not a hackathon project.",
        synthetic: true,
        evidence: [
          {
            id: "evd_test_source",
            kind: "source",
            synthetic: true,
            sourceUrl: "https://example.invalid/synthetic/test-source",
            retrievedAt: "2099-01-01T00:00:00.000Z",
            quote: "PAPERTOKEN synthetic quote",
            attribution: "SYNTHETIC test label",
          },
        ],
        submissions: [
          {
            id: "sub_test",
            synthetic: true,
            eventId: { status: "known", value: "evt_synthetic_test" },
            eventName: { status: "unknown", reason: "No event name was recorded." },
            submittedAt: { status: "unknown", reason: "No submission time was recorded." },
          },
        ],
        repositories: [
          {
            id: "repo_test",
            synthetic: true,
            locator: { status: "known", value: "https://example.invalid/synthetic/test-repo" },
          },
        ],
        claims: [
          {
            id: "clm_test",
            synthetic: true,
            statement: "The fixture quote contains PAPERTOKEN.",
            basis: "source-reported",
            reviewStatus: "unreviewed",
            evidenceIds: ["evd_test_source"],
            sourceUrl: "https://example.invalid/synthetic/test-source",
          },
        ],
      }),
    );
    writeFileSync(
      path.join(catalogDir, "unlabeled.json"),
      JSON.stringify({
        id: "test-only-unlabeled-record",
        title: "TEST ONLY unlabeled record",
        summary: "Temporary unit-test input. Not a hackathon project.",
      }),
    );
    const dbPath = path.join(catalogDir, "index.sqlite");
    expect(buildIndex({ catalogDir, dbPath })).toEqual({ real: 1, synthetic: 1 });
    expect(searchRecords(dbPath, "PAPERTOKEN").map((hit) => hit.id)).toEqual(["synthetic-test-enriched"]);
    expect(searchRecords(dbPath, "SYNTHETIC").every((hit) => hit.synthetic)).toBe(true);
    const enriched = getRecord(dbPath, "synthetic-test-enriched");
    expect(enriched?.details.evidence[0]?.quote).toEqual({
      status: "known",
      value: "PAPERTOKEN synthetic quote",
    });
    expect(enriched?.details.submissions[0]?.eventId).toEqual({
      status: "known",
      value: "evt_synthetic_test",
    });
    expect(listRecords(dbPath, { basis: "source-reported" }).map((record) => record.id)).toEqual([
      "synthetic-test-enriched",
    ]);
    expect(listRecords(dbPath, { basis: "unknown" }).map((record) => record.id)).toEqual([
      "test-only-unlabeled-record",
    ]);
    expect(listRecords(dbPath, { eventId: "evt_synthetic_test" }).map((record) => record.synthetic)).toEqual([
      true,
    ]);
    expect(listRecords(dbPath, { repository: "known" }).every((record) => record.synthetic)).toBe(true);
    expect(countRecords(dbPath)).toEqual({ real: 1, synthetic: 1 });
  });

  it("leaves an unknown summary unknown and does not index the reason", () => {
    const catalogDir = tempDir();
    writeFileSync(
      path.join(catalogDir, "unknown-summary.json"),
      JSON.stringify({
        id: "test-only-unknown-summary",
        title: "TEST ONLY unknown summary",
        summary: { status: "unknown", reason: "No summary was supplied for this unit-test record." },
        synthetic: true,
      }),
    );
    const dbPath = path.join(catalogDir, "index.sqlite");
    buildIndex({ catalogDir, dbPath });
    const record = getRecord(dbPath, "test-only-unknown-summary");
    expect(record?.summary).toBe("");
    expect(record?.details.sourceFacts.summary).toEqual({
      status: "unknown",
      reason: "No summary was supplied for this unit-test record.",
    });
    expect(searchRecords(dbPath, "supplied")).toEqual([]);
  });

  it("rejects a forbidden personal-data field", () => {
    const catalogDir = tempDir();
    writeFileSync(
      path.join(catalogDir, "forbidden.json"),
      JSON.stringify({
        id: "test-only-forbidden",
        title: "TEST ONLY forbidden field",
        summary: "Temporary unit-test input.",
        synthetic: true,
        evidence: [
          {
            id: "evd_forbidden",
            kind: "source",
            synthetic: true,
            email: "person@example.invalid",
          },
        ],
      }),
    );
    expect(() => buildIndex({ catalogDir, dbPath: path.join(catalogDir, "index.sqlite") })).toThrow(
      /not allowed/,
    );
  });

  it("filters award and track claims without treating them as a project count", () => {
    const catalogDir = tempDir();
    writeFileSync(
      path.join(catalogDir, "award.json"),
      JSON.stringify({
        id: "synthetic-award-track",
        title: "SYNTHETIC TEST ONLY award track",
        summary: "Labeled synthetic unit-test input. Not a hackathon project.",
        synthetic: true,
        claims: [
          {
            id: "clm_award",
            synthetic: true,
            statement: "The gallery card states the award label Winner.",
            basis: "source-reported",
            reviewStatus: "unreviewed",
          },
          {
            id: "clm_track",
            synthetic: true,
            statement: "The gallery card names the track Beginner.",
            basis: "source-reported",
            reviewStatus: "unreviewed",
          },
        ],
      }),
    );
    writeFileSync(
      path.join(catalogDir, "plain.json"),
      JSON.stringify({
        id: "synthetic-no-award",
        title: "SYNTHETIC TEST ONLY no award",
        summary: "Labeled synthetic unit-test input. Not a hackathon project.",
        synthetic: true,
        claims: [
          {
            id: "clm_plain",
            synthetic: true,
            statement: "The staged project name is Synthetic.",
            basis: "source-reported",
            reviewStatus: "unreviewed",
          },
        ],
      }),
    );
    const dbPath = path.join(catalogDir, "index.sqlite");
    expect(buildIndex({ catalogDir, dbPath })).toEqual({ real: 0, synthetic: 2 });
    expect(listRecords(dbPath, { award: "known" }).map((record) => record.id)).toEqual([
      "synthetic-award-track",
    ]);
    expect(listRecords(dbPath, { award: "unknown" }).map((record) => record.id)).toEqual([
      "synthetic-no-award",
    ]);
    expect(listRecords(dbPath, { track: "Beginner" }).map((record) => record.id)).toEqual([
      "synthetic-award-track",
    ]);
    expect(listRecords(dbPath, { track: "unknown" }).map((record) => record.id)).toEqual([
      "synthetic-no-award",
    ]);
    expect(countRecords(dbPath)).toEqual({ real: 0, synthetic: 2 });
  });

  it("throws when the generated index is missing", () => {
    const dbPath = path.join(tempDir(), "missing.sqlite");
    expect(() => listRecords(dbPath)).toThrow(MissingIndexError);
    expect(() => getRecord(dbPath, "any")).toThrow(MissingIndexError);
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
