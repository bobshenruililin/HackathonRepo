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

  it("keeps code-observed dependency claims on the five matched repositories", () => {
    const dbPath = tempDb();
    buildSchemaIndex({ catalogFile, dbPath });

    const eco = searchRecords(dbPath, "EcoAI").find((hit) => hit.title === "EcoAI");
    expect(eco).toBeDefined();
    const ecoRecord = getRecord(dbPath, eco?.id ?? "");
    expect(
      ecoRecord?.details.claims.some((claim) =>
        claim.statement.startsWith("Flask is code-observed as a framework at revision cf5f0dbf89bba5adc93f079618d2e8b0d28a72a4."),
      ),
    ).toBe(true);

    const heart = searchRecords(dbPath, "HeartFrame").find((hit) => hit.title === "HeartFrame");
    expect(heart).toBeDefined();
    const heartRecord = getRecord(dbPath, heart?.id ?? "");
    expect(
      heartRecord?.details.claims.some((claim) =>
        claim.statement.includes(
          "streamlit is code-observed as a library at revision 27202cb64499714be972b2a9ee078b7568fd63c3.",
        ),
      ),
    ).toBe(true);
    expect(
      heartRecord?.details.claims.some((claim) => /award|prize|winner/i.test(claim.statement)),
    ).toBe(false);
  });

  it("keeps later code-observed dependency claims on Kami, Spidey Sense, and Eve", () => {
    const dbPath = tempDb();
    buildSchemaIndex({ catalogFile, dbPath });

    const kami = searchRecords(dbPath, "Kami").find((hit) => hit.title === "Kami");
    expect(kami).toBeDefined();
    const kamiRecord = getRecord(dbPath, kami?.id ?? "");
    expect(
      kamiRecord?.details.claims.some((claim) =>
        claim.statement.startsWith(
          "matter-js is code-observed as a library at revision 32db1c23e80d2fcb1c348e90bc64100b1f3f48d2.",
        ),
      ),
    ).toBe(true);

    const spideyHits = searchRecords(dbPath, "Spidey Sense").filter((hit) => hit.title === "Spidey Sense");
    expect(spideyHits.length).toBeGreaterThan(1);
    const spideyRecords = spideyHits.map((hit) => getRecord(dbPath, hit.id));
    expect(
      spideyRecords.some((record) =>
        record?.details.claims.some((claim) =>
          claim.statement.startsWith(
            "faster-whisper is code-observed as a library at revision b331076b7aaed4830c866f06439ba758c08f2759.",
          ),
        ),
      ),
    ).toBe(true);

    const eve = searchRecords(dbPath, "Eve").find((hit) => hit.title === "Eve");
    expect(eve).toBeDefined();
    const eveRecord = getRecord(dbPath, eve?.id ?? "");
    expect(
      eveRecord?.details.claims.some((claim) =>
        claim.statement.startsWith(
          "react is code-observed as a framework at revision fee307dd0c750f6977b937add8e8f80d6ba17c97.",
        ),
      ),
    ).toBe(true);
  });
});

function tempDb(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "hackathon-atlas-schema-"));
  tempDirs.push(dir);
  return path.join(dir, "catalog.sqlite");
}
