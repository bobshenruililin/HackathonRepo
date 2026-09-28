import { realCorpusCount } from "./corpus.js";
import { NotAGoldSetError } from "./errors.js";
import { evaluateQueries, type EvaluateInput } from "./evaluate.js";
import { isEmptyGoldSet } from "./gold.js";
import { NOT_MEASURED, type EvalBundle } from "./types.js";

export function buildBundle(input: EvaluateInput = {}): EvalBundle {
  if (input.gold?.synthetic === true) {
    throw new NotAGoldSetError("Synthetic fixtures are not a gold set.");
  }
  const queries = evaluateQueries(input);
  const measured = queries.every((query) => query.status === "MEASURED");
  return {
    bundle: "hackathon-atlas-eval",
    version: 1,
    status: measured ? "MEASURED" : NOT_MEASURED,
    goldSet: isEmptyGoldSet(input.gold) ? "empty" : "present",
    realCorpusCount: realCorpusCount(input.corpus),
    syntheticFixturesAreGoldSet: false,
    queries,
  };
}

export function buildUnevaluatedBundle(): EvalBundle {
  return buildBundle({ gold: null, corpus: [], retrievedByQueryId: null });
}
