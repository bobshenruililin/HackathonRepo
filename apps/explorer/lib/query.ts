import type { ListFilters } from "@hackathon-atlas/catalog-index";

const BASIS = new Set(["", "unknown", "source-reported", "code-observed", "test-observed", "inferred"]);
const REVIEW = new Set(["", "unknown", "unreviewed", "accepted", "rejected"]);
const REPOSITORY = new Set(["", "unknown", "known"]);

export type ExplorerQuery = {
  filters: ListFilters;
  keywordInput: string;
  keywordNote?: string;
  basis: string;
  reviewStatus: string;
  eventId: string;
  repository: string;
};

export function toFtsQuery(raw: string): { query: string; note?: string } {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { query: "" };
  }
  const tokens = trimmed.match(/[A-Za-z0-9_]+/g);
  if (tokens === null || tokens.length === 0) {
    return {
      query: "",
      note: "The keyword had no searchable terms, so the keyword constraint was not applied.",
    };
  }
  return { query: tokens.map((token) => `"${token}"`).join(" AND ") };
}

export function readExplorerQuery(
  params: Record<string, string | string[] | undefined>,
): ExplorerQuery {
  const keywordInput = first(params.q);
  const keyword = toFtsQuery(keywordInput);
  const basis = allowed(first(params.basis), BASIS);
  const reviewStatus = allowed(first(params.reviewStatus), REVIEW);
  const repository = allowed(first(params.repository), REPOSITORY);
  const eventRaw = first(params.eventId).trim();
  const eventId = /^[A-Za-z0-9_-]{0,200}$/.test(eventRaw) ? eventRaw : "";
  return {
    filters: {
      query: keyword.query,
      basis: basis as ListFilters["basis"],
      reviewStatus: reviewStatus as ListFilters["reviewStatus"],
      repository: repository as ListFilters["repository"],
      eventId,
    },
    keywordInput,
    keywordNote: keyword.note,
    basis,
    reviewStatus,
    eventId,
    repository,
  };
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function allowed(value: string, options: ReadonlySet<string>): string {
  return options.has(value) ? value : "";
}
