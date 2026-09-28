/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parseCatalog, retrieveAnalogues, type AnalogueRetrieval } from "@hackathon-atlas/analogues";

import { CliUsageError } from "./errors.js";
import type { AnaloguesOptions, AnaloguesResponse, PrintedAnalogue } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readCatalog(catalogPath: string): unknown {
  const resolved = path.resolve(catalogPath);
  if (!existsSync(resolved)) {
    throw new Error(`Catalog file does not exist: ${resolved}`);
  }
  let text: string;
  try {
    text = readFileSync(resolved, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Catalog file could not be read: ${resolved}. ${message}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Catalog file is not valid JSON: ${resolved}`);
  }
}

function projectIdsNamed(catalog: unknown, title: string): string[] {
  parseCatalog(catalog);
  if (!isRecord(catalog) || !Array.isArray(catalog.projects)) {
    return [];
  }
  const ids: string[] = [];
  for (const row of catalog.projects) {
    if (!isRecord(row)) continue;
    if (typeof row.id !== "string" || typeof row.name !== "string") continue;
    if (row.name === title) ids.push(row.id);
  }
  return ids;
}

function present(result: AnalogueRetrieval): AnaloguesResponse {
  const analogues: PrintedAnalogue[] = result.analogues.map((analogue) => ({
    projectId: analogue.projectId,
    synthetic: analogue.synthetic,
    shared: analogue.shared.map((item) => item.text),
  }));
  if (result.status === "matched") {
    return { status: "matched", analogues };
  }
  return { status: result.status, reason: result.reason, analogues };
}

/**
 * Read one caller-supplied catalog JSON file and call `retrieveAnalogues`.
 * This function does not open a SQLite index and does not fetch.
 * Unknown stays unknown.
 */
export function findAnalogues(options: AnaloguesOptions): AnaloguesResponse {
  const catalog = readCatalog(options.catalogPath);
  if (options.subject.kind === "title") {
    const ids = projectIdsNamed(catalog, options.subject.title);
    if (ids.length > 1) {
      throw new CliUsageError(`Title matches more than one project: ${ids.join(", ")}`);
    }
    const projectId = ids[0];
    if (projectId === undefined) {
      return {
        status: "unknown",
        reason: "No project has that exact name.",
        analogues: [],
      };
    }
    return present(retrieveAnalogues(catalog, projectId, options.mode));
  }
  return present(retrieveAnalogues(catalog, options.subject.projectId, options.mode));
}
