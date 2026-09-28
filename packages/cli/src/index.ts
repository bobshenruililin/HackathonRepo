/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

export { findAnalogues } from "./analogues-command.js";
export { HELP, runCli } from "./cli.js";
export type { CliIo } from "./cli.js";
export { CliUsageError } from "./errors.js";
export { searchIndex } from "./search-index.js";
export type {
  AnaloguesOptions,
  AnaloguesResponse,
  AnaloguesSubject,
  FilterRequest,
  FilterResult,
  HitCounts,
  PrintedAnalogue,
  SearchHit,
  SearchOptions,
  SearchResponse,
} from "./types.js";
