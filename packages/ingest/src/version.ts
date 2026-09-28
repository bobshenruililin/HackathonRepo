/** Ingest pipeline version. Replay is idempotent for this version and the same staged inputs. */
export const INGEST_PIPELINE_VERSION = "0.1.0" as const;

export type IngestPipelineVersion = typeof INGEST_PIPELINE_VERSION;
