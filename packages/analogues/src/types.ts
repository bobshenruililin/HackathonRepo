/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

export const CATALOG_SCHEMA_VERSION = "0.1.0" as const;

export const ANALOGUE_MODES = ["direct", "mechanism", "demo"] as const;

export type AnalogueMode = (typeof ANALOGUE_MODES)[number];

export type AnalogueCitation = {
  readonly projectId: string;
  readonly claimId: string;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
};

export type SharedEvidence = {
  readonly text: string;
  readonly claims: readonly AnalogueCitation[];
};

export type Analogue = {
  readonly projectId: string;
  readonly synthetic: boolean;
  readonly shared: readonly SharedEvidence[];
};

export type AnalogueRetrieval = {
  readonly projectId: string;
  readonly mode: AnalogueMode;
  readonly analogues: readonly Analogue[];
  readonly realAnalogueCount: number;
} & (
  | {
      readonly status: "unknown" | "no-match";
      readonly reason: string;
    }
  | {
      readonly status: "matched";
    }
);
