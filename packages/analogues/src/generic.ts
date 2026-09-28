/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

/**
 * Track or challenge labels that do not name a specific track or challenge.
 * "General", "NO TRACK", and the exact label "Beginner" are recorded labels
 * of this kind. "Beginner" is not an accepted problem-domain value.
 */
const GENERIC_DIRECT = new Set([
  "beginner",
  "general",
  "no track",
  "none",
  "n/a",
  "na",
  "unknown",
  "unspecified",
  "other",
  "winner",
  "winners",
  "open",
  "main",
  "overall",
  "miscellaneous",
  "misc",
  "any",
  "all",
  "default",
  "hackathon",
  "prize",
  "award",
  "awards",
]);

/**
 * Words that can appear in a technology list and still not identify a mechanism.
 * Named libraries and frameworks are not in this set.
 */
const GENERIC_TECHNOLOGY = new Set([
  "ai",
  "ml",
  "machine-learning",
  "artificial-intelligence",
  "artificial intelligence",
  "machine learning",
  "web",
  "app",
  "application",
  "software",
  "api",
  "tool",
  "tools",
  "platform",
  "library",
  "framework",
  "technology",
  "technologies",
  "tech",
  "code",
  "data",
  "cloud",
  "mobile",
  "frontend",
  "backend",
  "server",
  "client",
  "ui",
  "ux",
  "hackathon",
  "project",
  "program",
  "service",
  "model",
  "algorithm",
  "computer",
  "internet",
  "website",
  "site",
  "stack",
  "hardware",
  "device",
  "language",
  "unknown",
  "general",
  "misc",
  "miscellaneous",
  "other",
  "github",
  "winner",
  "prize",
  "award",
]);

/** Hosts that many unrelated demos share. The host alone is not an analogue. */
const GENERIC_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "example.com",
  "example.org",
  "example.net",
  "example.invalid",
  "youtube.com",
  "youtu.be",
  "m.youtube.com",
  "music.youtube.com",
  "drive.google.com",
  "docs.google.com",
  "google.com",
  "loom.com",
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "github.com",
  "gist.github.com",
  "gitlab.com",
  "devpost.com",
  "canva.com",
  "dropbox.com",
  "notion.so",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "medium.com",
]);

export function normalizeToken(value: string): string {
  return value.trim().replace(/\s+/g, " ").replace(/\.$/, "").toLowerCase();
}

export function isGenericDirect(value: string): boolean {
  return GENERIC_DIRECT.has(normalizeToken(value));
}

export function isGenericTechnology(value: string): boolean {
  return GENERIC_TECHNOLOGY.has(normalizeToken(value));
}

export function isGenericDemoHost(host: string): boolean {
  const normalized = host.toLowerCase();
  if (GENERIC_HOSTS.has(normalized)) return true;
  if (normalized === "zoom.us" || normalized.endsWith(".zoom.us")) return true;
  if (normalized === "youtube.com" || normalized.endsWith(".youtube.com")) return true;
  if (normalized === "youtu.be" || normalized.endsWith(".youtu.be")) return true;
  return false;
}
