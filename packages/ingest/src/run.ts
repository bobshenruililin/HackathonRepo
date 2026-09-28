import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { countRealProjects, type Catalog } from "@hackathon-atlas/schema";

import { IngestError } from "./errors.ts";
import { contentHash, stableStringify } from "./hash.ts";
import { compareText } from "./ids.ts";
import { materialize } from "./materialize.ts";
import type { IngestOptions, IngestResult, StagedObservation } from "./types.ts";
import { validateObservation } from "./validate-observation.ts";
import { INGEST_PIPELINE_VERSION } from "./version.ts";

type AcceptedObservation = {
  observationId: string;
  contentHash: string;
};

type Checkpoint = {
  pipelineVersion: typeof INGEST_PIPELINE_VERSION;
  authority: "ingest-checkpoint";
  authoritative: false;
  contentHash: "sha256-canonical-json";
  accepted: AcceptedObservation[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function runIngest(options: IngestOptions): IngestResult & { catalog: Catalog } {
  if (options.maxNew !== undefined && (!Number.isInteger(options.maxNew) || options.maxNew < 0)) {
    throw new IngestError("maxNew must be a non-negative integer.");
  }
  const observations = readStaging(options.stagingDir);
  const hashes = new Map(observations.map((observation) => [observation.observationId, contentHash(observation)]));
  const checkpointPath = path.join(options.outputDir, "checkpoint.json");
  const catalogPath = path.join(options.outputDir, "catalog.json");
  const existing = readCheckpoint(checkpointPath);
  const resumed = existing !== null;

  const acceptedById = new Map<string, AcceptedObservation>();
  if (existing) {
    for (const entry of existing.accepted) {
      if (!hashes.has(entry.observationId)) {
        throw new IngestError(
          `Accepted observation ${entry.observationId} is missing from staging. Ingest did not drop it.`,
        );
      }
      acceptedById.set(entry.observationId, {
        observationId: entry.observationId,
        contentHash: hashes.get(entry.observationId) ?? entry.contentHash,
      });
    }
  }

  const pending = observations.filter((observation) => !acceptedById.has(observation.observationId));
  const limit = options.maxNew ?? pending.length;
  const appliedThisRun = pending.slice(0, limit).map((observation) => observation.observationId);
  for (const observationId of appliedThisRun) {
    acceptedById.set(observationId, {
      observationId,
      contentHash: hashes.get(observationId) ?? "",
    });
  }

  const accepted = [...acceptedById.values()].sort((left, right) =>
    compareText(left.observationId, right.observationId),
  );
  const acceptedObservations = accepted.map((entry) => {
    const observation = observations.find((item) => item.observationId === entry.observationId);
    if (!observation) {
      throw new IngestError(`Accepted observation ${entry.observationId} is missing from staging.`);
    }
    return observation;
  });

  const catalog = materialize(acceptedObservations);
  mkdirSync(options.outputDir, { recursive: true });
  const checkpoint: Checkpoint = {
    pipelineVersion: INGEST_PIPELINE_VERSION,
    authority: "ingest-checkpoint",
    authoritative: false,
    contentHash: "sha256-canonical-json",
    accepted,
  };
  writeAtomic(catalogPath, catalog);
  writeAtomic(checkpointPath, checkpoint);

  return {
    pipelineVersion: INGEST_PIPELINE_VERSION,
    catalogPath,
    checkpointPath,
    catalog,
    acceptedCount: accepted.length,
    appliedThisRun,
    pendingCount: pending.length - appliedThisRun.length,
    resumed,
    realProjectCount: countRealProjects(catalog),
    syntheticProjectCount: catalog.projects.filter((project) => project.synthetic).length,
  };
}

function readStaging(stagingDir: string): StagedObservation[] {
  if (!existsSync(stagingDir)) {
    throw new IngestError(`Staging directory does not exist: ${stagingDir}`);
  }
  let names: string[];
  try {
    names = readdirSync(stagingDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort((left, right) => compareText(left, right));
  } catch {
    throw new IngestError(`Staging path is not a directory: ${stagingDir}`);
  }
  const observations: StagedObservation[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const filePath = path.join(stagingDir, name);
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    } catch {
      throw new IngestError(`${name} is not valid JSON.`);
    }
    const observation = validateObservation(parsed, name);
    if (seen.has(observation.observationId)) {
      throw new IngestError(`Duplicate observation id ${observation.observationId}. Ingest did not apply it twice.`);
    }
    seen.add(observation.observationId);
    observations.push(observation);
  }
  observations.sort((left, right) => compareText(left.observationId, right.observationId));
  return observations;
}

function readCheckpoint(filePath: string): Checkpoint | null {
  if (!existsSync(filePath)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  } catch {
    throw new IngestError("Ingest checkpoint is not valid JSON.");
  }
  if (!isRecord(parsed) || parsed.authority !== "ingest-checkpoint" || parsed.authoritative !== false) {
    throw new IngestError("Ingest checkpoint is not an ingest checkpoint.");
  }
  if (parsed.pipelineVersion !== INGEST_PIPELINE_VERSION) return null;
  if (parsed.contentHash !== "sha256-canonical-json" || !Array.isArray(parsed.accepted)) {
    throw new IngestError("Ingest checkpoint is missing accepted observations.");
  }
  const accepted: AcceptedObservation[] = [];
  for (const entry of parsed.accepted) {
    if (!isRecord(entry) || typeof entry.observationId !== "string" || typeof entry.contentHash !== "string") {
      throw new IngestError("Ingest checkpoint has an invalid accepted entry.");
    }
    accepted.push({ observationId: entry.observationId, contentHash: entry.contentHash });
  }
  return {
    pipelineVersion: INGEST_PIPELINE_VERSION,
    authority: "ingest-checkpoint",
    authoritative: false,
    contentHash: "sha256-canonical-json",
    accepted,
  };
}

function writeAtomic(filePath: string, value: unknown): void {
  const temporary = `${filePath}.tmp`;
  writeFileSync(temporary, stableStringify(value), "utf8");
  renameSync(temporary, filePath);
}
