/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

import type { AnalogueMode } from "@hackathon-atlas/analogues";

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

export type AnaloguesSubject =
  | { readonly kind: "project"; readonly projectId: string }
  | { readonly kind: "title"; readonly title: string };

export type AnaloguesOptions = {
  readonly catalogPath: string;
  readonly mode: AnalogueMode;
  readonly subject: AnaloguesSubject;
};

export type PrintedAnalogue = {
  readonly projectId: string;
  readonly synthetic: boolean;
  readonly shared: readonly string[];
};

export type AnaloguesResponse = {
  readonly status: "matched" | "no-match" | "unknown";
  readonly reason?: string;
  readonly analogues: readonly PrintedAnalogue[];
};
