import { ObservationInputError } from "./errors.js";
import {
  readCargoToml,
  readGoMod,
  readPackageJsonDependencies,
  readPyproject,
  readRequirements,
} from "./manifests.js";
import { classifyPath, languageForPath } from "./paths.js";
import { copyRevision, pinRevision } from "./revision.js";
import {
  AWARD_NOT_INFERRED_REASON,
  MAX_EXCERPT_QUOTE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PATH_LENGTH,
  type FileListing,
  type ObservationBasis,
  type ObservationReport,
  type ObserveRepositoryInput,
  type TechnologyObservation,
  type TechnologyRole,
  type TextExcerpt,
} from "./types.js";

/**
 * Dependency names that are frameworks only when a manifest lists them.
 * README prose does not promote a name into this role.
 */
const FRAMEWORK_DEPENDENCIES = new Set([
  "react",
  "vue",
  "svelte",
  "next",
  "nuxt",
  "angular",
  "@angular/core",
  "express",
  "fastify",
  "fastapi",
  "flask",
  "django",
  "gin",
  "rails",
  "laravel",
  "spring",
]);

const ROLE_RANK: Record<TechnologyRole, number> = {
  unknown: 0,
  library: 1,
  framework: 2,
  language: 3,
};

const BASIS_RANK: Record<ObservationBasis, number> = {
  unknown: 0,
  "source-reported": 1,
  "code-observed": 2,
};

type Draft = {
  name: string;
  role: TechnologyRole;
  basis: ObservationBasis;
  evidencePaths: Set<string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readPath(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new ObservationInputError(`${label} must be a non-empty string.`);
  }
  const path = value.trim();
  if (path.length === 0) {
    throw new ObservationInputError(`${label} must be a non-empty string.`);
  }
  if (path.length > MAX_PATH_LENGTH) {
    throw new ObservationInputError(`${label} exceeds ${MAX_PATH_LENGTH} characters.`);
  }
  return path;
}

function readFiles(value: unknown): FileListing[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new ObservationInputError("files must be an array.");
  return value.map((item, index) => {
    if (!isRecord(item)) throw new ObservationInputError(`files[${index}] must be an object.`);
    return { path: readPath(item.path, `files[${index}].path`) };
  });
}

function readExcerpts(value: unknown): TextExcerpt[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new ObservationInputError("excerpts must be an array.");
  return value.map((item, index) => {
    if (!isRecord(item)) throw new ObservationInputError(`excerpts[${index}] must be an object.`);
    if (typeof item.quote !== "string") {
      throw new ObservationInputError(`excerpts[${index}].quote must be a string.`);
    }
    if (item.quote.length > MAX_EXCERPT_QUOTE_LENGTH) {
      throw new ObservationInputError(
        `excerpts[${index}].quote exceeds ${MAX_EXCERPT_QUOTE_LENGTH} characters.`,
      );
    }
    return { path: readPath(item.path, `excerpts[${index}].path`), quote: item.quote };
  });
}

function readTechnologyNames(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new ObservationInputError("technologyNames must be an array.");
  return value.map((item, index) => {
    if (typeof item !== "string") {
      throw new ObservationInputError(`technologyNames[${index}] must be a string.`);
    }
    const name = item.trim();
    if (name.length === 0) {
      throw new ObservationInputError(`technologyNames[${index}] must not be empty.`);
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new ObservationInputError(`technologyNames[${index}] exceeds ${MAX_NAME_LENGTH} characters.`);
    }
    return name;
  });
}

function readSynthetic(value: unknown): boolean {
  if (value === undefined) return false;
  if (typeof value !== "boolean") {
    throw new ObservationInputError("Synthetic flag must be a boolean.");
  }
  return value;
}

export function normalizeTechnologyName(name: string): string {
  return name.trim().toLowerCase();
}

function continuesName(char: string): boolean {
  return /[A-Za-z0-9_+#@/-]/.test(char);
}

export function proseMentions(quote: string, name: string): boolean {
  const needle = name.trim().toLowerCase();
  if (needle.length === 0) return false;
  const haystack = quote.toLowerCase();
  let from = 0;
  while (from <= haystack.length - needle.length) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    const before = at === 0 ? "" : (haystack[at - 1] ?? "");
    const afterIndex = at + needle.length;
    const after = afterIndex >= haystack.length ? "" : (haystack[afterIndex] ?? "");
    if (!continuesName(before) && !continuesName(after)) return true;
    from = at + 1;
  }
  return false;
}

function backtickNames(quote: string): string[] {
  const names: string[] = [];
  for (const match of quote.matchAll(/`([^`]{1,120})`/g)) {
    const name = match[1]?.trim() ?? "";
    if (/^(?:@[A-Za-z0-9._-]+\/)?[A-Za-z][A-Za-z0-9._+#-]{0,119}$/.test(name)) names.push(name);
  }
  return names;
}

function dependencyRole(name: string): TechnologyRole {
  return FRAMEWORK_DEPENDENCIES.has(normalizeTechnologyName(name)) ? "framework" : "library";
}

function dependenciesForExcerpt(excerpt: TextExcerpt): string[] {
  switch (classifyPath(excerpt.path)) {
    case "package-json":
      return readPackageJsonDependencies(excerpt.quote);
    case "requirements":
      return readRequirements(excerpt.quote);
    case "go-mod":
      return readGoMod(excerpt.quote).dependencies;
    case "cargo-toml":
      return readCargoToml(excerpt.quote);
    case "pyproject":
      return readPyproject(excerpt.quote);
    default:
      return [];
  }
}

function consider(
  drafts: Map<string, Draft>,
  update: { name: string; role: TechnologyRole; basis: ObservationBasis; path?: string },
): void {
  const key = normalizeTechnologyName(update.name);
  if (key.length === 0 || key.length > MAX_NAME_LENGTH) return;
  const existing = drafts.get(key);
  if (!existing) {
    const evidencePaths = new Set<string>();
    if (update.path) evidencePaths.add(update.path);
    drafts.set(key, {
      name: update.name.trim(),
      role: update.role,
      basis: update.basis,
      evidencePaths,
    });
    return;
  }
  const strongerBasis = BASIS_RANK[update.basis] > BASIS_RANK[existing.basis];
  const strongerRole = ROLE_RANK[update.role] > ROLE_RANK[existing.role];
  if (strongerBasis) existing.basis = update.basis;
  if (strongerRole) existing.role = update.role;
  if (update.role === "language" && strongerRole) existing.name = update.name.trim();
  else if (strongerBasis && update.basis === "code-observed" && update.role !== "unknown") {
    existing.name = update.name.trim();
  }
  if (update.path) existing.evidencePaths.add(update.path);
}

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * Classify technologies from caller-supplied file listings and short excerpts.
 * Does not fetch, clone, or execute anything. Does not invent projects or awards.
 */
export function observeRepository(input: ObserveRepositoryInput): ObservationReport {
  if (!isRecord(input)) {
    throw new ObservationInputError("Observation input must be an object.");
  }
  const synthetic = readSynthetic(input.synthetic);
  const files = readFiles(input.files);
  const excerpts = readExcerpts(input.excerpts);
  const technologyNames = readTechnologyNames(input.technologyNames);
  const revision = pinRevision(input.revision);
  const drafts = new Map<string, Draft>();

  const paths: string[] = [];
  for (const file of files) paths.push(file.path);
  for (const excerpt of excerpts) paths.push(excerpt.path);

  for (const path of paths) {
    const language = languageForPath(path);
    if (!language) continue;
    consider(drafts, { name: language, role: "language", basis: "code-observed", path });
  }

  for (const excerpt of excerpts) {
    for (const name of dependenciesForExcerpt(excerpt)) {
      consider(drafts, {
        name,
        role: dependencyRole(name),
        basis: "code-observed",
        path: excerpt.path,
      });
    }
  }

  for (const excerpt of excerpts) {
    if (classifyPath(excerpt.path) !== "readme") continue;
    for (const name of backtickNames(excerpt.quote)) {
      consider(drafts, { name, role: "unknown", basis: "source-reported", path: excerpt.path });
    }
  }

  for (const name of technologyNames) {
    const readmePaths = excerpts
      .filter((excerpt) => classifyPath(excerpt.path) === "readme" && proseMentions(excerpt.quote, name))
      .map((excerpt) => excerpt.path);
    const existing = drafts.get(normalizeTechnologyName(name));
    if (existing) {
      for (const path of readmePaths) existing.evidencePaths.add(path);
      if (existing.basis === "unknown" && readmePaths.length > 0) {
        existing.basis = "source-reported";
      }
      continue;
    }
    if (readmePaths.length > 0) {
      consider(drafts, {
        name,
        role: "unknown",
        basis: "source-reported",
        path: readmePaths[0],
      });
      const draft = drafts.get(normalizeTechnologyName(name));
      if (draft) {
        for (const path of readmePaths) draft.evidencePaths.add(path);
      }
      continue;
    }
    consider(drafts, { name, role: "unknown", basis: "unknown" });
  }

  const observations: TechnologyObservation[] = [...drafts.values()]
    .map((draft) => ({
      name: draft.name,
      role: draft.role,
      basis: draft.basis,
      revision: copyRevision(revision),
      evidencePaths: [...draft.evidencePaths].sort(compareStrings),
      synthetic,
    }))
    .sort((left, right) => compareStrings(left.name, right.name) || compareStrings(left.basis, right.basis));

  const decided = observations.filter((observation) => observation.basis !== "unknown");
  return {
    synthetic,
    revision,
    observations,
    languages: observations.filter((observation) => observation.role === "language"),
    frameworks: observations.filter((observation) => observation.role === "framework"),
    award: { status: "unknown", reason: AWARD_NOT_INFERRED_REASON },
    projects: [],
    counts: {
      realProjects: 0,
      realObservations: synthetic ? 0 : decided.length,
      syntheticObservations: synthetic ? observations.length : 0,
    },
  };
}
