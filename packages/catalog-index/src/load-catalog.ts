import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { assertCatalogFields, buildRecordDetails, readSummary, readTitle } from "./details.js";
import type { CatalogRecord } from "./types.js";

export function loadCatalog(catalogDir: string): CatalogRecord[] {
  let stats;
  try {
    stats = statSync(catalogDir);
  } catch {
    throw new Error(`Catalog directory does not exist: ${catalogDir}`);
  }
  if (!stats.isDirectory()) {
    throw new Error(`Catalog path is not a directory: ${catalogDir}`);
  }

  const fileNames = readdirSync(catalogDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  const records = fileNames.map((fileName) =>
    parseRecord(path.join(catalogDir, fileName), fileName),
  );
  assertUniqueIds(records);
  return records;
}

function parseRecord(filePath: string, fileName: string): CatalogRecord {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${fileName} is not valid JSON: ${message}`);
  }
  if (!isJsonObject(parsed)) {
    throw new Error(`${fileName} must be a JSON object`);
  }

  assertCatalogFields(parsed, fileName);
  const id = requiredString(parsed, "id", fileName);
  const title = readTitle(parsed, fileName);
  const summary = readSummary(parsed, fileName);
  const syntheticFlagRecorded = Object.hasOwn(parsed, "synthetic");
  const synthetic = optionalBoolean(parsed, "synthetic", fileName);
  const built = buildRecordDetails(parsed, fileName, {
    id,
    title,
    summary: summary.source,
    synthetic,
    syntheticFlagRecorded,
  });
  return {
    id,
    title,
    summary: summary.column,
    synthetic,
    searchText: built.searchText,
    details: built.details,
  };
}

function requiredString(
  value: Record<string, unknown>,
  field: "id",
  fileName: string,
): string {
  const raw = value[field];
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new Error(`${fileName} field ${field} must be a non-empty string`);
  }
  return raw.trim();
}

function optionalBoolean(
  value: Record<string, unknown>,
  field: "synthetic",
  fileName: string,
): boolean {
  if (!Object.hasOwn(value, field)) {
    return false;
  }
  const raw = value[field];
  if (typeof raw !== "boolean") {
    throw new Error(`${fileName} field ${field} must be a boolean`);
  }
  return raw;
}

function assertUniqueIds(records: readonly CatalogRecord[]): void {
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) {
      throw new Error(`Duplicate catalog id: ${record.id}`);
    }
    seen.add(record.id);
  }
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
