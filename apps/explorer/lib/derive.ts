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
      ? "The index counts this record in the real total from the stored synthetic flag. Event, prize, and source text below are whatever the index stored."
      : "The catalog file set synthetic to true. The index excludes this record from the real count.",
    evidenceCount: record.details.evidence.length,
    submissionCount: record.details.submissions.length,
    repositoryCount: record.details.repositories.length,
    claimCount: record.details.claims.length,
    knownSourceUrlCount: urls.size,
  };
}

export type EventOption = {
  id: string;
  label: string;
};

export function knownEventIds(records: readonly CatalogRecord[]): string[] {
  return knownEventOptions(records).map((option) => option.id);
}

export function knownEventOptions(records: readonly CatalogRecord[]): EventOption[] {
  const names = new Map<string, string>();
  for (const record of records) {
    for (const submission of record.details.submissions) {
      if (submission.eventId.status !== "known") continue;
      const id = submission.eventId.value;
      const name = submission.eventName.status === "known" ? submission.eventName.value : "";
      const current = names.get(id);
      if (current === undefined || (current === "" && name !== "")) {
        names.set(id, name);
      }
    }
  }
  return [...names.entries()]
    .map(([id, name]) => ({
      id,
      label: name === "" ? `Unknown event name (${id})` : name,
    }))
    .sort((left, right) => left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
}

export function eventLabels(record: CatalogRecord): string[] {
  const labels: string[] = [];
  for (const submission of record.details.submissions) {
    if (submission.eventName.status === "known") {
      labels.push(submission.eventName.value);
    } else if (submission.eventId.status === "known") {
      labels.push(`Unknown event name (${submission.eventId.value})`);
    }
  }
  return labels;
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
