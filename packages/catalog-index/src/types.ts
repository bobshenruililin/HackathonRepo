export type CatalogRecord = {
  id: string;
  title: string;
  summary: string;
  synthetic: boolean;
};

export type RecordCounts = {
  real: number;
  synthetic: number;
};

export type SearchHit = {
  id: string;
  title: string;
  summary: string;
  synthetic: boolean;
};

export type BuildIndexOptions = {
  catalogDir: string;
  dbPath: string;
};
