export type FilterRequest = {
  field: string;
  value: string;
};

export type FilterResult = {
  field: string;
  value: string;
  status: "applied" | "unknown";
  applied: boolean;
  reason: string | null;
};

export type HitCounts = {
  status: "known" | "unknown";
  real: number | null;
  synthetic: number | null;
  reason: string | null;
};

export type SearchHit = {
  id: string;
  title: string;
  summary: string;
  synthetic: boolean | null;
};

export type SearchResponse = {
  query: string;
  indexPath: string;
  filters: FilterResult[];
  hitCounts: HitCounts;
  hits: SearchHit[];
};

export type SearchOptions = {
  indexPath: string;
  query: string;
  filters: readonly FilterRequest[];
};
