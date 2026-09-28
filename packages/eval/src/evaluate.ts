import { realCorpusIds } from "./corpus.js";
import { MetricRefusalError, NotAGoldSetError } from "./errors.js";
import { isEmptyGoldSet } from "./gold.js";
import { FIXED_QUERIES, isFixedQueryId } from "./queries.js";
import { NOT_MEASURED, type CorpusRecord, type GoldSet, type QueryEvaluation } from "./types.js";

export type EvaluateInput = {
  gold?: GoldSet | null;
  corpus?: readonly CorpusRecord[] | null;
  retrievedByQueryId?: Readonly<Record<string, readonly string[]>> | null;
};

export function evaluateQueries(input: EvaluateInput = {}): QueryEvaluation[] {
  const gold = input.gold ?? null;
  if (gold?.synthetic === true) {
    throw new NotAGoldSetError("Synthetic fixtures are not a gold set.");
  }

  if (!hasRelevantJudgments(gold)) {
    return notMeasuredAll("Gold set is empty.");
  }

  const corpusIds = realCorpusIds(input.corpus);
  if (corpusIds.size === 0) {
    return notMeasuredAll("No real corpus is loaded.");
  }

  const judgments = new Map<string, readonly string[]>();
  for (const judgment of gold.judgments) {
    if (!isFixedQueryId(judgment.queryId)) {
      continue;
    }
    judgments.set(judgment.queryId, uniqueIds(judgment.relevantIds));
  }

  return FIXED_QUERIES.map((query) => {
    const relevantIds = judgments.get(query.id);
    if (relevantIds == null || relevantIds.length === 0) {
      return notMeasured(query, "This query has no gold judgment.");
    }
    const missingGoldId = relevantIds.find((id) => !corpusIds.has(id));
    if (missingGoldId != null) {
      return notMeasured(
        query,
        `Gold judgment cites ${missingGoldId}, which is not in the real corpus.`,
      );
    }

    const retrieved = input.retrievedByQueryId?.[query.id];
    if (retrieved == null) {
      return notMeasured(query, "No retrieval results were supplied for this query.");
    }
    const retrievedIds = uniqueIds(retrieved);
    if (retrievedIds.length === 0) {
      return notMeasured(
        query,
        "Retrieved set is empty, so precision is undefined. No precision or recall number is emitted.",
      );
    }
    const missingRetrievedId = retrievedIds.find((id) => !corpusIds.has(id));
    if (missingRetrievedId != null) {
      return notMeasured(
        query,
        `Retrieval cites ${missingRetrievedId}, which is not in the real corpus.`,
      );
    }

    const relevant = new Set(relevantIds);
    const hitCount = retrievedIds.filter((id) => relevant.has(id)).length;
    return {
      queryId: query.id,
      text: query.text,
      status: "MEASURED",
      precision: ratio(hitCount, retrievedIds.length),
      recall: ratio(hitCount, relevantIds.length),
      relevantCount: relevantIds.length,
      retrievedCount: retrievedIds.length,
      hitCount,
    };
  });
}

export function requirePrecisionAndRecall(result: QueryEvaluation): {
  precision: number;
  recall: number;
} {
  if (result.status !== "MEASURED") {
    throw new MetricRefusalError(
      "Refusing to emit a precision or recall number when the result is NOT MEASURED.",
    );
  }
  if (!Number.isFinite(result.precision) || !Number.isFinite(result.recall)) {
    throw new MetricRefusalError("Refusing to emit a non-finite precision or recall number.");
  }
  return { precision: result.precision, recall: result.recall };
}

function hasRelevantJudgments(gold: GoldSet | null): gold is GoldSet {
  return !isEmptyGoldSet(gold);
}

function notMeasuredAll(reason: string): QueryEvaluation[] {
  return FIXED_QUERIES.map((query) => notMeasured(query, reason));
}

function notMeasured(
  query: (typeof FIXED_QUERIES)[number],
  reason: string,
): QueryEvaluation {
  return {
    queryId: query.id,
    text: query.text,
    status: NOT_MEASURED,
    reason,
  };
}

function uniqueIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (trimmed === "" || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    unique.push(trimmed);
  }
  return unique;
}

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    throw new MetricRefusalError("Refusing to emit a metric with an empty denominator.");
  }
  const value = numerator / denominator;
  if (!Number.isFinite(value)) {
    throw new MetricRefusalError("Refusing to emit a non-finite metric.");
  }
  return value;
}
