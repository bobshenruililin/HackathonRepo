import { createHash } from "node:crypto";

import type {
  ClaimId,
  EventId,
  EvidenceId,
  ProjectId,
  RepositoryId,
  SubmissionId,
} from "@hackathon-atlas/schema";

type PrefixMap = {
  evt_: EventId;
  prj_: ProjectId;
  sub_: SubmissionId;
  repo_: RepositoryId;
  evd_: EvidenceId;
  clm_: ClaimId;
};

export function stableId<P extends keyof PrefixMap>(prefix: P, material: string): PrefixMap[P] {
  const digest = createHash("sha256").update(`${prefix}${material}`).digest("hex").slice(0, 24);
  return `${prefix}${digest}` as PrefixMap[P];
}

export function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
