import type { CorpusRecord } from "./types.js";

export function realCorpusIds(corpus: readonly CorpusRecord[] | null | undefined): Set<string> {
  const ids = new Set<string>();
  if (corpus == null) {
    return ids;
  }
  for (const record of corpus) {
    if (record.synthetic === true) {
      continue;
    }
    if (typeof record.id !== "string" || record.id.trim() === "") {
      continue;
    }
    ids.add(record.id.trim());
  }
  return ids;
}

export function realCorpusCount(corpus: readonly CorpusRecord[] | null | undefined): number {
  return realCorpusIds(corpus).size;
}
