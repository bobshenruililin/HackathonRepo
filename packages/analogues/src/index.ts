/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

export { parseCatalog } from "./catalog.js";
export type { CatalogClaim, CatalogProject, ParsedCatalog } from "./catalog.js";
export { ANALOGUE_ERROR_CODES, AnalogueError } from "./errors.js";
export type { AnalogueErrorCode } from "./errors.js";
export { retrieveAnalogues } from "./retrieve.js";
export { ANALOGUE_MODES, CATALOG_SCHEMA_VERSION } from "./types.js";
export type { Analogue, AnalogueCitation, AnalogueMode, AnalogueRetrieval, SharedEvidence } from "./types.js";
