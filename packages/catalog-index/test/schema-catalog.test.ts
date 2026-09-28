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
    expect(counts).toEqual({ real: 2180, synthetic: 0 });

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

  it("keeps a named Devpost prize and a Blueprint project attached to the right event", () => {
    const dbPath = tempDb();
    buildSchemaIndex({ catalogFile, dbPath });

    const windowShare = searchRecords(dbPath, "Window Share").find((hit) => hit.title === "Window Share");
    expect(windowShare).toBeDefined();
    const winner = getRecord(dbPath, windowShare?.id ?? "");
    expect(
      winner?.details.submissions.some(
        (submission) => submission.eventName.status === "known" && submission.eventName.value === "HackMIT 2016",
      ),
    ).toBe(true);
    expect(
      winner?.details.repositories.some(
        (item) => item.locator.status === "known" && item.locator.value === "https://github.com/sbower213/windowshare",
      ),
    ).toBe(true);
    expect(winner?.details.claims.some((claim) => claim.statement.includes("Winner First Place"))).toBe(true);

    const potato = searchRecords(dbPath, "Hot Potato").find((hit) => hit.title === "2-Player Hot Potato");
    expect(potato).toBeDefined();
    const blueprint = getRecord(dbPath, potato?.id ?? "");
    expect(
      blueprint?.details.submissions.some(
        (submission) => submission.eventName.status === "known" && submission.eventName.value === "Blueprint 2025",
      ),
    ).toBe(true);
    expect(
      blueprint?.details.repositories.some(
        (item) =>
          item.locator.status === "known" &&
          item.locator.value === "https://github.com/vedant-a-joshi/mit-blueprint-25-submission",
      ),
    ).toBe(true);

    const travel = searchRecords(dbPath, "TravelAR").find((hit) => hit.title === "TravelAR");
    expect(travel).toBeDefined();
    const travelRecord = getRecord(dbPath, travel?.id ?? "");
    expect(
      travelRecord?.details.submissions.some(
        (submission) => submission.eventName.status === "known" && submission.eventName.value === "HackMIT 2017",
      ),
    ).toBe(true);
    expect(
      travelRecord?.details.repositories.some(
        (item) => item.locator.status === "known" && item.locator.value === "https://github.com/averylamp/travelar",
      ),
    ).toBe(true);
    expect(
      travelRecord?.details.claims.some((claim) => claim.statement.includes("Best Use of Amadeus APIs")),
    ).toBe(true);
  });
});

function tempDb(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "hackathon-atlas-schema-"));
  tempDirs.push(dir);
  return path.join(dir, "catalog.sqlite");
}
