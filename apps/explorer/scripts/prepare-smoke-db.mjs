import { buildIndex } from "@hackathon-atlas/catalog-index";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.resolve(
  appDir,
  "../../packages/catalog-index/fixtures/synthetic-not-a-real-project.json",
);
const catalogDir = path.join(appDir, ".data", "smoke-catalog");
const dbPath = process.env.CATALOG_INDEX_PATH
  ? path.resolve(process.env.CATALOG_INDEX_PATH)
  : path.join(appDir, ".data", "catalog.sqlite");

rmSync(catalogDir, { recursive: true, force: true });
mkdirSync(catalogDir, { recursive: true });
cpSync(fixture, path.join(catalogDir, "synthetic-not-a-real-project.json"));
writeFileSync(
  path.join(catalogDir, "synthetic-smoke-extra.json"),
  `${JSON.stringify(
    {
      id: "synthetic-smoke-extra-not-a-real-project",
      title: "SYNTHETIC SMOKE FIXTURE: Not a real hackathon project",
      summary: "Second labeled synthetic record created only for the browser smoke test.",
      synthetic: true,
      evidence: [
        {
          id: "evd_synthetic_smoke_source",
          kind: "source",
          synthetic: true,
          sourceUrl: "https://example.invalid/synthetic/smoke-source",
          retrievedAt: "2099-01-01T00:00:00.000Z",
          quote: "SYNTHETIC quote for the smoke fixture.",
          attribution: "SYNTHETIC smoke label",
        },
      ],
      submissions: [
        {
          id: "sub_synthetic_smoke",
          synthetic: true,
          eventId: { status: "known", value: "evt_synthetic_smoke" },
          eventName: {
            status: "unknown",
            reason: "No event name was recorded for this synthetic submission.",
          },
          submittedAt: {
            status: "unknown",
            reason: "No submission time was recorded for this synthetic submission.",
          },
        },
      ],
      repositories: [
        {
          id: "repo_synthetic_smoke_known",
          synthetic: true,
          locator: { status: "known", value: "https://example.invalid/synthetic/smoke-repo" },
        },
        {
          id: "repo_synthetic_smoke_unknown",
          synthetic: true,
          locator: {
            status: "unknown",
            reason: "No repository locator was recorded for this synthetic repository.",
          },
        },
      ],
      claims: [
        {
          id: "clm_synthetic_smoke",
          synthetic: true,
          statement: "This smoke fixture is labeled synthetic.",
          basis: "source-reported",
          reviewStatus: "unreviewed",
          evidenceIds: ["evd_synthetic_smoke_source"],
          sourceUrl: "https://example.invalid/synthetic/smoke-source",
          retrievedAt: "2099-01-01T00:00:00.000Z",
          observedAt: "2099-01-01T00:00:00.000Z",
          resolution: {
            status: "unknown",
            reason: "No resolution was recorded for this synthetic claim.",
          },
        },
      ],
    },
    null,
    2,
  )}\n`,
);

const counts = buildIndex({ catalogDir, dbPath });
if (counts.real !== 0 || counts.synthetic !== 2) {
  throw new Error(`Smoke index counts were real=${counts.real} synthetic=${counts.synthetic}`);
}
console.log(`Smoke index ${dbPath} real=${counts.real} synthetic=${counts.synthetic}`);
