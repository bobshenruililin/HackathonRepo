import { MAX_NAME_LENGTH } from "./types.js";

function isDependencyName(name: string): boolean {
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return false;
  if (looksLikeSecret(name)) return false;
  return /^[@A-Za-z0-9][A-Za-z0-9._+#/@-]{0,119}$/.test(name);
}

function looksLikeSecret(name: string): boolean {
  return (
    /AKIA[0-9A-Z]{16}/.test(name) ||
    name.includes("BEGIN") ||
    /^(?:ghp_|github_pat_|sk-|xox[baprs]-)/.test(name)
  );
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

/** Dependency names from a package.json excerpt. Scripts and the package name are ignored. */
export function readPackageJsonDependencies(quote: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(quote) as unknown;
  } catch {
    return [];
  }
  const record = asRecord(parsed);
  if (!record) return [];
  const names: string[] = [];
  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const block = asRecord(record[field]);
    if (!block) continue;
    for (const key of Object.keys(block)) {
      if (isDependencyName(key)) names.push(key);
    }
  }
  return names;
}

export function readRequirements(quote: string): string[] {
  const names: string[] = [];
  for (const raw of quote.split(/\r?\n/)) {
    const withoutComment = raw.split("#")[0] ?? "";
    const line = withoutComment.trim();
    if (line.length === 0 || line.startsWith("-")) continue;
    if (line.includes("://")) continue;
    const spec = line.split(/[<=>!~;\[]/)[0] ?? "";
    const name = spec.trim();
    if (/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) && isDependencyName(name)) names.push(name);
  }
  return names;
}

export function readGoMod(quote: string): { modulePath: string | undefined; dependencies: string[] } {
  let modulePath: string | undefined;
  const dependencies: string[] = [];
  let inRequire = false;
  for (const raw of quote.split(/\r?\n/)) {
    const line = raw.replace(/\/\/.*$/, "").trim();
    if (line.length === 0) continue;
    if (line.startsWith("module ")) {
      const path = line.slice("module ".length).trim().split(/\s+/)[0];
      if (path) modulePath = path;
      continue;
    }
    if (line.startsWith("go ") || line.startsWith("toolchain ")) continue;
    if (line.startsWith("exclude ") || line.startsWith("replace ") || line.startsWith("retract ")) {
      continue;
    }
    if (line === "require (" || /^require\s+\($/.test(line)) {
      inRequire = true;
      continue;
    }
    if (inRequire && line === ")") {
      inRequire = false;
      continue;
    }
    if (line.startsWith("require ")) {
      const path = line.slice("require ".length).trim().split(/\s+/)[0];
      if (path && path !== modulePath && isDependencyName(path)) dependencies.push(path);
      continue;
    }
    if (inRequire) {
      const path = line.split(/\s+/)[0];
      if (path && path !== modulePath && isDependencyName(path)) dependencies.push(path);
    }
  }
  return { modulePath, dependencies };
}

const CARGO_DEPENDENCY_SECTIONS = new Set([
  "dependencies",
  "dev-dependencies",
  "build-dependencies",
]);

export function readCargoToml(quote: string): string[] {
  const names: string[] = [];
  let section = "";
  for (const raw of quote.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (line.length === 0) continue;
    const sectionMatch = /^\[([^\]]+)\]$/.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1]?.trim() ?? "";
      continue;
    }
    if (!CARGO_DEPENDENCY_SECTIONS.has(section)) continue;
    const dep = /^([A-Za-z0-9_-]+)\s*=/.exec(line);
    const name = dep?.[1];
    if (name && isDependencyName(name)) names.push(name);
  }
  return names;
}

function requirementNamesFromQuoted(line: string): string[] {
  const names: string[] = [];
  for (const match of line.matchAll(/"([^"]+)"|'([^']+)'/g)) {
    const raw = match[1] ?? match[2] ?? "";
    const spec = raw.split(/[<=>!~;\[]/)[0] ?? "";
    const name = spec.trim();
    if (/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) && name.toLowerCase() !== "python" && isDependencyName(name)) {
      names.push(name);
    }
  }
  return names;
}

export function readPyproject(quote: string): string[] {
  const names: string[] = [];
  let section = "";
  let collectingProjectDependencies = false;
  for (const raw of quote.split(/\r?\n/)) {
    const line = raw.split("#")[0]?.trim() ?? "";
    if (line.length === 0) continue;
    const sectionMatch = /^\[([^\]]+)\]$/.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1]?.trim() ?? "";
      collectingProjectDependencies = false;
      continue;
    }
    if (section === "project" && /^dependencies\s*=\s*\[/.test(line)) {
      names.push(...requirementNamesFromQuoted(line));
      collectingProjectDependencies = !line.includes("]");
      continue;
    }
    if (section === "project" && collectingProjectDependencies) {
      names.push(...requirementNamesFromQuoted(line));
      if (line.includes("]")) collectingProjectDependencies = false;
      continue;
    }
    if (section === "project.optional-dependencies" || section.startsWith("project.optional-dependencies.")) {
      names.push(...requirementNamesFromQuoted(line));
      continue;
    }
    if (section.startsWith("tool.poetry.") && section.endsWith(".dependencies")) {
      const dep = /^([A-Za-z0-9][A-Za-z0-9._-]*)\s*=/.exec(line);
      const name = dep?.[1];
      if (name && name.toLowerCase() !== "python" && isDependencyName(name)) names.push(name);
    }
  }
  return names;
}
