import type { FixedQueryId } from "./queries.js";

export const NOT_MEASURED = "NOT MEASURED";

export type GoldJudgment = {
  queryId: string;
  relevantIds: readonly string[];
};

export type GoldSet = {
  synthetic: boolean;
  judgments: readonly GoldJudgment[];
};

export type CorpusRecord = {
  id: string;
  synthetic?: boolean;
};

export type NotMeasuredResult = {
  queryId: FixedQueryId;
  text: string;
  status: typeof NOT_MEASURED;
  reason: string;
};

export type MeasuredResult = {
  queryId: FixedQueryId;
  text: string;
  status: "MEASURED";
  precision: number;
  recall: number;
  relevantCount: number;
  retrievedCount: number;
  hitCount: number;
};

export type QueryEvaluation = NotMeasuredResult | MeasuredResult;

export type EvalBundle = {
  bundle: "hackathon-atlas-eval";
  version: 1;
  status: typeof NOT_MEASURED | "MEASURED";
  goldSet: "empty" | "present";
  realCorpusCount: number;
  syntheticFixturesAreGoldSet: false;
  queries: QueryEvaluation[];
};
