import { ObservationInputError } from "./errors.js";
import { observeRepository } from "./observe.js";
import type { ObservationReport, ObserveRepositoryInput } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Load a synthetic observation fixture. Unlabeled fixtures are rejected.
 * Quotes in the fixture must say SYNTHETIC. They are not real README text.
 */
export function loadSyntheticObservation(input: unknown): ObservationReport {
  if (!isRecord(input) || input.synthetic !== true || input.datasetLabel !== "synthetic-fixtures") {
    throw new ObservationInputError("Fixture is not labeled synthetic.");
  }
  if (typeof input.fixtureWarning !== "string") {
    throw new ObservationInputError("Fixture is not labeled synthetic.");
  }
  if (!input.fixtureWarning.includes("SYNTHETIC FIXTURE") || !/not a real project/i.test(input.fixtureWarning)) {
    throw new ObservationInputError("Fixture is not labeled synthetic.");
  }
  if (Array.isArray(input.excerpts)) {
    for (const excerpt of input.excerpts) {
      if (!isRecord(excerpt) || typeof excerpt.quote !== "string" || !excerpt.quote.includes("SYNTHETIC")) {
        throw new ObservationInputError("Fixture quote is not labeled synthetic.");
      }
    }
  }
  return observeRepository(input as ObserveRepositoryInput);
}
