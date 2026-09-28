/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

export const ANALOGUE_ERROR_CODES = ["invalid-catalog", "invalid-mode", "invalid-project-id"] as const;

export type AnalogueErrorCode = (typeof ANALOGUE_ERROR_CODES)[number];

export class AnalogueError extends Error {
  readonly code: AnalogueErrorCode;

  constructor(code: AnalogueErrorCode, message: string) {
    super(message);
    this.name = "AnalogueError";
    this.code = code;
  }
}
