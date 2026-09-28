/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

import { isGenericDemoHost, isGenericDirect, isGenericTechnology, normalizeToken } from "./generic.js";
import type { AnalogueMode } from "./types.js";

export type ExtractedValue = {
  readonly key: string;
  readonly display: string;
  readonly generic: boolean;
};

export type Extraction = {
  readonly values: readonly ExtractedValue[];
  readonly unknown: boolean;
};

function dedupe(values: readonly ExtractedValue[]): ExtractedValue[] {
  const seen = new Set<string>();
  const unique: ExtractedValue[] = [];
  for (const value of values) {
    if (seen.has(value.key)) continue;
    seen.add(value.key);
    unique.push(value);
  }
  return unique;
}

function textValue(raw: string, generic: boolean): ExtractedValue | null {
  const display = raw.trim().replace(/\s+/g, " ").replace(/\.$/, "").trim();
  const key = normalizeToken(display);
  if (key.length < 2) return null;
  return { key, display, generic };
}

function directValue(raw: string): ExtractedValue | null {
  return textValue(raw, isGenericDirect(raw));
}

function technologyValue(raw: string): ExtractedValue | null {
  return textValue(raw, isGenericTechnology(raw));
}

function isAwardStatement(statement: string): boolean {
  return (
    /\baward label\b/i.test(statement) ||
    /\bstates winner\b/i.test(statement) ||
    /^\s*winner\s*[.!]?$/i.test(statement)
  );
}

/**
 * The technology token is the text before this phrase.
 * The role, the revision, and the manifest path are not tokens.
 */
const CODE_OBSERVED_PHRASE = /\bis code-observed as a (?:library|framework|language)\b/i;

const CODE_OBSERVED_METADATA = new Set([
  "code-observed",
  "library",
  "framework",
  "language",
  "revision",
  "manifest",
  "path",
]);

function hasListedTechnologyWording(statement: string): boolean {
  return /\b(built with|dependenc|gallery technolog)/i.test(statement);
}

function statesUnknown(statement: string, mode: AnalogueMode): boolean {
  if (!/\bunknown\b/i.test(statement)) return false;
  if (mode === "direct") return /\b(track|challenge)\b/i.test(statement);
  if (mode === "mechanism") return hasListedTechnologyWording(statement) || CODE_OBSERVED_PHRASE.test(statement);
  return /\bdemo url\b/i.test(statement);
}

function codeObservedToken(statement: string): string | null {
  const match = statement.match(CODE_OBSERVED_PHRASE);
  if (!match || match.index === undefined) return null;
  const raw = statement.slice(0, match.index).trim();
  if (raw.length === 0) return null;
  if (CODE_OBSERVED_METADATA.has(normalizeToken(raw))) return null;
  return raw;
}

function challengeItems(body: string): string[] {
  return body
    .trim()
    .replace(/\.$/, "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function extractDirect(statement: string): Extraction {
  if (statesUnknown(statement, "direct")) return { values: [], unknown: true };
  if (isAwardStatement(statement)) return { values: [], unknown: false };

  const values: Array<ExtractedValue | null> = [];
  const preferences = statement.match(/\bnames challenge preferences\s*:\s*([\s\S]+)$/i);
  if (preferences?.[1]) {
    for (const item of challengeItems(preferences[1])) values.push(directValue(item));
  }

  const namedTrack = statement.match(/\bnames the track\s+([\s\S]+)$/i);
  if (namedTrack?.[1]) values.push(directValue(namedTrack[1]));

  if (!preferences && !namedTrack) {
    const labeled = statement.match(/^\s*(track|challenge)\s*:\s*(.+?)\s*\.?\s*$/i);
    if (labeled?.[2]) values.push(directValue(labeled[2]));
    for (const match of statement.matchAll(
      /\b([A-Z][A-Za-z0-9+&/#-]{1,40}(?:\s+[A-Z][A-Za-z0-9+&/#-]{1,40}){0,5})\s+(track|challenge)\b/g,
    )) {
      if (match[1]) values.push(directValue(match[1]));
    }
  }

  return { values: dedupe(values.filter((value): value is ExtractedValue => value !== null)), unknown: false };
}

function splitList(span: string): string[] {
  return span
    .split(/\s*(?:,|;|\band\b)\s*/i)
    .map((part) => part.trim().replace(/^["'`]|["'`]$/g, "").trim())
    .filter((part) => part.length > 0);
}

function extractMechanism(statement: string): Extraction {
  if (statesUnknown(statement, "mechanism")) return { values: [], unknown: true };
  const technologyWording = hasListedTechnologyWording(statement);
  const observed = codeObservedToken(statement);
  if (isAwardStatement(statement) && !technologyWording && observed === null) return { values: [], unknown: false };
  if (!technologyWording && observed === null) return { values: [], unknown: false };

  const values: Array<ExtractedValue | null> = [];
  const patterns = [
    /\bbuilt with(?:\s+tags)?\s*:\s*([^.]+)/gi,
    /\bdependenc(?:y|ies)\s*:\s*([^.]+)/gi,
    /\bgallery technolog(?:y|ies)\s*:\s*([^.]+)/gi,
  ];
  for (const pattern of patterns) {
    for (const match of statement.matchAll(pattern)) {
      const span = match[1] ?? "";
      for (const item of splitList(span)) values.push(technologyValue(item));
    }
  }
  if (observed) values.push(technologyValue(observed));
  return { values: dedupe(values.filter((value): value is ExtractedValue => value !== null)), unknown: false };
}

function demoHost(rawUrl: string): ExtractedValue | null {
  const cleaned = rawUrl.replace(/[),.;]+$/g, "");
  let url: URL;
  try {
    url = new URL(cleaned);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  let host = url.hostname.toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  if (host.length < 2) return null;
  if (!host.includes(".") && host !== "localhost") return null;
  return { key: host, display: host, generic: isGenericDemoHost(host) };
}

function extractDemo(statement: string): Extraction {
  if (statesUnknown(statement, "demo")) return { values: [], unknown: true };
  const values: Array<ExtractedValue | null> = [];
  for (const match of statement.matchAll(/\bdemo URL\s*:\s*(https?:\/\/[^\s<>"')\]]+)/gi)) {
    if (match[1]) values.push(demoHost(match[1]));
  }
  return { values: dedupe(values.filter((value): value is ExtractedValue => value !== null)), unknown: false };
}

export function extractSharedText(statement: string, mode: AnalogueMode): Extraction {
  if (mode === "direct") return extractDirect(statement);
  if (mode === "mechanism") return extractMechanism(statement);
  return extractDemo(statement);
}
