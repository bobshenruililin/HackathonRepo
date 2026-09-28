import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { buildSchemaIndex, getRecord, searchRecords } from "../src/index.js";

const catalogFile = fileURLToPath(new URL("../../../catalog/hackmit/catalog.json", import.meta.url));
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("HackMIT schema catalog", () => {
  it("indexes the real catalog and keeps synthetic fixtures out of the real count", () => {
    const dbPath = tempDb();
    const counts = buildSchemaIndex({ catalogFile, dbPath });
    expect(counts).toEqual({ real: 2075, synthetic: 0 });

    const hits = searchRecords(dbPath, "Pilot");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.synthetic === false)).toBe(true);
    const records = hits.filter((hit) => hit.title === "Pilot").map((hit) => getRecord(dbPath, hit.id));
    const record = records.find((item) =>
      item?.details.submissions.some(
        (submission) => submission.eventName.status === "known" && submission.eventName.value === "HackMIT 2019",
      ),
    );
    expect(record).toBeDefined();
    expect(
      record?.details.repositories.some(
        (item) => item.locator.status === "known" && item.locator.value === "https://github.com/the-flying-circus/hackmit-2019",
      ),
    ).toBe(true);
    expect(record?.details.claims.some((claim) => claim.statement.includes("Rev.ai Speech API Challenge"))).toBe(true);
  });
});

function tempDb(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "hackathon-atlas-schema-"));
  tempDirs.push(dir);
  return path.join(dir, "catalog.sqlite");
}
