import { MAX_REVISION_LENGTH } from "./types.js";
import type { RevisionPin } from "./types.js";

/**
 * Pin the revision string the caller supplied. Never derive a commit from
 * excerpts, filenames, or hashes found in text.
 */
export function pinRevision(revision: unknown): RevisionPin {
  if (typeof revision !== "string") {
    return { status: "unknown", reason: "The caller did not supply a revision." };
  }
  const value = revision.trim();
  if (value.length === 0) {
    return { status: "unknown", reason: "The caller supplied an empty revision." };
  }
  if (value.length > MAX_REVISION_LENGTH) {
    return {
      status: "unknown",
      reason: "The caller-supplied revision exceeds the length limit.",
    };
  }
  return { status: "known", value };
}

export function copyRevision(revision: RevisionPin): RevisionPin {
  if (revision.status === "known") {
    return { status: "known", value: revision.value };
  }
  return { status: "unknown", reason: revision.reason };
}
