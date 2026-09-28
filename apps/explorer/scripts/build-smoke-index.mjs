import { buildIndex } from "@hackathon-atlas/catalog-index";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(appDir, "../../packages/catalog-index/fixtures");
const dbPath = process.env.CATALOG_INDEX_PATH
  ? path.resolve(process.env.CATALOG_INDEX_PATH)
  : path.join(appDir, ".data", "catalog.sqlite");

const counts = buildIndex({ catalogDir, dbPath });
console.log(`Generated index ${dbPath} real=${counts.real} synthetic=${counts.synthetic}`);
