import { readFileSync } from "node:fs";

import { NotAGoldSetError } from "./errors.js";
import { isFixedQueryId } from "./queries.js";
import type { GoldJudgment, GoldSet } from "./types.js";

export function loadGoldSetFile(filePath: string): GoldSet {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new NotAGoldSetError(`Gold set file is not usable JSON: ${message}`);
  }
  return parseGoldSet(parsed);
}

export function parseGoldSet(value: unknown): GoldSet {
  if (!isRecord(value)) {
    throw new NotAGoldSetError("Gold set must be a JSON object.");
  }
  if (value.synthetic === true) {
    throw new NotAGoldSetError("Synthetic fixtures are not a gold set.");
  }
  if (value.synthetic !== false) {
    throw new NotAGoldSetError(
      "Gold set must set synthetic to false. An unlabeled fixture is not a gold set.",
    );
  }
  if (!Array.isArray(value.judgments)) {
    throw new NotAGoldSetError("Gold set judgments must be an array.");
  }

  const judgments = value.judgments.map((judgment, index) => parseJudgment(judgment, index));
  assertUniqueQueryIds(judgments);
  return { synthetic: false, judgments };
}

export function isEmptyGoldSet(gold: GoldSet | null | undefined): boolean {
  if (gold == null || gold.synthetic !== false || gold.judgments.length === 0) {
    return true;
  }
  return gold.judgments.every((judgment) => judgment.relevantIds.length === 0);
}

function parseJudgment(value: unknown, index: number): GoldJudgment {
  if (!isRecord(value)) {
    throw new NotAGoldSetError(`Gold judgment ${index} must be an object.`);
  }
  if (typeof value.queryId !== "string" || value.queryId.trim() === "") {
    throw new NotAGoldSetError(`Gold judgment ${index} needs a non-empty queryId.`);
  }
  if (!Array.isArray(value.relevantIds)) {
    throw new NotAGoldSetError(`Gold judgment ${index} relevantIds must be an array.`);
  }
  const relevantIds = value.relevantIds.map((id, idIndex) => {
    if (typeof id !== "string" || id.trim() === "") {
      throw new NotAGoldSetError(
        `Gold judgment ${index} relevantIds[${idIndex}] must be a non-empty string.`,
      );
    }
    return id.trim();
  });
  return { queryId: value.queryId.trim(), relevantIds };
}

function assertUniqueQueryIds(judgments: readonly GoldJudgment[]): void {
  const seen = new Set<string>();
  for (const judgment of judgments) {
    if (seen.has(judgment.queryId)) {
      throw new NotAGoldSetError(`Duplicate gold judgment for query ${judgment.queryId}.`);
    }
    seen.add(judgment.queryId);
    if (!isFixedQueryId(judgment.queryId) && judgment.relevantIds.length > 0) {
      throw new NotAGoldSetError(
        `Gold judgment cites unknown query ${judgment.queryId}. The harness does not add queries.`,
      );
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
