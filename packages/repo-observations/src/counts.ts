import type { ObservationCounts, ObservationReport } from "./types.js";

/** Sum observation counts. Real project count stays 0. Synthetic reports do not add real observations. */
export function countObservationReports(reports: readonly ObservationReport[]): ObservationCounts {
  let realObservations = 0;
  let syntheticObservations = 0;
  for (const report of reports) {
    if (report.synthetic) {
      syntheticObservations += report.observations.length;
      continue;
    }
    realObservations += report.counts.realObservations;
  }
  return { realProjects: 0, realObservations, syntheticObservations };
}
