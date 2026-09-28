import type { CatalogRecord, KnownOrUnknown } from "@hackathon-atlas/catalog-index";

export type DerivedFields = {
  countedInRealTotal: boolean;
  realityLabel: "Not a real project" | "Counted in the real index total";
  realityDetail: string;
  evidenceCount: number;
  submissionCount: number;
  repositoryCount: number;
  claimCount: number;
  knownSourceUrlCount: number;
};

export function deriveRecord(record: CatalogRecord): DerivedFields {
  const countedInRealTotal = record.synthetic === false;
  const urls = new Set<string>();
  for (const item of record.details.evidence) {
    if (item.sourceUrl?.status === "known") {
      urls.add(item.sourceUrl.value);
    }
  }
  for (const claim of record.details.claims) {
    if (claim.sourceUrl.status === "known") {
      urls.add(claim.sourceUrl.value);
    }
  }
  return {
    countedInRealTotal,
    realityLabel: countedInRealTotal ? "Counted in the real index total" : "Not a real project",
    realityDetail: countedInRealTotal
      ? "The index counts this record in the real total from the stored synthetic flag. This page repeats that flag and does not supply an event, a prize, or a source."
      : "The catalog file set synthetic to true. The index excludes this record from the real count.",
    evidenceCount: record.details.evidence.length,
    submissionCount: record.details.submissions.length,
    repositoryCount: record.details.repositories.length,
    claimCount: record.details.claims.length,
    knownSourceUrlCount: urls.size,
  };
}

export function knownEventIds(records: readonly CatalogRecord[]): string[] {
  const ids = new Set<string>();
  for (const record of records) {
    for (const submission of record.details.submissions) {
      if (submission.eventId.status === "known") {
        ids.add(submission.eventId.value);
      }
    }
  }
  return [...ids].sort();
}

export function formatKnown(value: KnownOrUnknown | undefined, missing: string): string {
  if (value === undefined) {
    return `Unknown. ${missing}`;
  }
  return value.status === "known" ? value.value : `Unknown. ${value.reason}`;
}

export function unknownReason(record: CatalogRecord, field: string): string {
  return (
    record.details.unknowns.find((item) => item.field === field)?.reason ??
    "This field was not recorded in the generated index."
  );
}
