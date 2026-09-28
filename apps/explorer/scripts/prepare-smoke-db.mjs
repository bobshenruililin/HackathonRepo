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
