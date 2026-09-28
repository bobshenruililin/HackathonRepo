/**
 * @license MIT
 * Copyright (c) 2026 Shen Ruililin
 *
 * Local search for the prepare-hackathon skill.
 * Invokes the hackathon-atlas search CLI against a caller-supplied index.
 * Does not query SQLite, apply missing columns, or invent precedents.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const skillDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(skillDir, "../../..");

export const HELP = `node .cursor/skills/prepare-hackathon/search.mjs --index <generated.sqlite> [--filter field=value] <keywords>

Run hackathon-atlas search against a generated SQLite index the caller supplies.

A filter whose records column is absent stays status "unknown" and is not applied.
Taxonomy dimensions with no accepted value stay unknown.
Precedents and retrieval stay NOT MEASURED. This command does not run a labeled evaluation.
`;

export function defaultCliPath() {
  return path.join(repoRoot, "packages/cli/dist/main.js");
}

export function defaultTaxonomyPath() {
  return path.join(repoRoot, "packages/taxonomy/dist/index.js");
}

export function cliArguments(indexPath, filters, positionals) {
  const args = ["search", "--index", indexPath];
  for (const filter of filters) {
    args.push("--filter", filter);
  }
  args.push(...positionals);
  return args;
}

export function taxonomySection(taxonomyApi, registry = taxonomyApi.createTaxonomyRegistry()) {
  const accepted = taxonomyApi.listAccepted(registry);
  const byDimension = new Map();
  for (const item of accepted) {
    const values = byDimension.get(item.dimension) ?? [];
    values.push(item.value);
    byDimension.set(item.dimension, values);
  }

  const dimensions = taxonomyApi.TAXONOMY_DIMENSIONS.map((dimension) => {
    const values = byDimension.get(dimension);
    if (values === undefined || values.length === 0) {
      return { dimension, status: "unknown" };
    }
    return { dimension, status: "accepted", values: [...values] };
  });

  if (accepted.length === 0) {
    return {
      status: "unknown",
      acceptedCount: 0,
      reason: "The catalog has no accepted taxonomy values.",
      dimensions,
    };
  }

  return {
    status: "known",
    acceptedCount: accepted.length,
    reason: "Listed values are accepted. Dimensions with no accepted value stay unknown.",
    dimensions,
  };
}

export function buildReport(search, taxonomyApi, registry) {
  assertSearchPayload(search);
  return {
    search,
    taxonomy: taxonomySection(taxonomyApi, registry),
    precedents: {
      status: "NOT MEASURED",
      statement: "precedents are NOT MEASURED",
      reason:
        "Search hits are not accepted catalog records and do not cite evidence. Synthetic hits are excluded and are not precedents.",
    },
    tracks: {
      status: "unknown",
      reason: "This search does not supply tracks.",
    },
    sponsors: {
      status: "unknown",
      reason: "This search does not supply sponsors.",
    },
    retrieval: {
      status: "NOT MEASURED",
      reason: "This command does not run a labeled evaluation.",
    },
  };
}

export async function runPrepareSearch(argv, options = {}) {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        index: { type: "string", short: "i" },
        filter: { type: "string", short: "f", multiple: true },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return usage(message);
  }

  if (parsed.values.help === true) {
    return { code: 0, stdout: HELP, stderr: "" };
  }

  const indexPath = parsed.values.index;
  if (typeof indexPath !== "string" || indexPath.trim() === "") {
    return usage("search requires --index <generated.sqlite>");
  }

  const positionals = parsed.positionals;
  if (positionals.join(" ").trim() === "") {
    return usage("Search query must not be empty");
  }

  const filters = readFilters(parsed.values.filter);
  const cliPath = options.cliPath ?? defaultCliPath();
  const taxonomyPath = options.taxonomyPath ?? defaultTaxonomyPath();

  let taxonomyApi;
  try {
    taxonomyApi = await loadTaxonomy(taxonomyPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { code: 1, stdout: "", stderr: `error: ${message}\n` };
  }

  if (!existsSync(cliPath)) {
    return {
      code: 1,
      stdout: "",
      stderr: `error: hackathon-atlas CLI is not built (${cliPath}). Run: pnpm --filter @hackathon-atlas/cli build\n`,
    };
  }

  const child = spawnSync(process.execPath, [cliPath, ...cliArguments(indexPath, filters, positionals)], {
    encoding: "utf8",
  });
  if (child.error) {
    return { code: 1, stdout: "", stderr: `error: ${child.error.message}\n` };
  }

  const stderr = child.stderr ?? "";
  if (child.status !== 0) {
    return { code: child.status === null ? 1 : child.status, stdout: "", stderr };
  }

  let search;
  try {
    search = JSON.parse(child.stdout);
    assertSearchPayload(search);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { code: 1, stdout: "", stderr: `${stderr}error: ${message}\n` };
  }

  const report = buildReport(search, taxonomyApi, options.registry);
  return { code: 0, stdout: `${JSON.stringify(report, null, 2)}\n`, stderr };
}

function readFilters(value) {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => typeof item === "string");
}

function usage(message) {
  return { code: 2, stdout: "", stderr: `error: ${message}\n${HELP}` };
}

async function loadTaxonomy(taxonomyPath) {
  if (!existsSync(taxonomyPath)) {
    throw new Error(
      `Taxonomy package is not built (${taxonomyPath}). Run: pnpm --filter @hackathon-atlas/taxonomy build`,
    );
  }
  const taxonomyApi = await import(pathToFileURL(taxonomyPath).href);
  if (
    typeof taxonomyApi.createTaxonomyRegistry !== "function" ||
    typeof taxonomyApi.listAccepted !== "function" ||
    !Array.isArray(taxonomyApi.TAXONOMY_DIMENSIONS)
  ) {
    throw new Error("Taxonomy package did not export the accepted-value registry.");
  }
  return taxonomyApi;
}

function assertSearchPayload(search) {
  if (search === null || typeof search !== "object" || Array.isArray(search)) {
    throw new Error("Search CLI returned unexpected JSON.");
  }
  if (!Array.isArray(search.filters) || !Array.isArray(search.hits)) {
    throw new Error("Search CLI returned unexpected JSON.");
  }
  for (const filter of search.filters) {
    if (filter.status === "unknown" && filter.applied !== false) {
      throw new Error(`Filter ${filter.field} is unknown and must not be applied.`);
    }
  }
}

function isDirectRun() {
  const entry = process.argv[1];
  if (entry === undefined) {
    return false;
  }
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  const result = await runPrepareSearch(process.argv.slice(2));
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.code;
}
