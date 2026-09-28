import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { countRealProjects, type Catalog, type ClaimRecord } from "@hackathon-atlas/schema";

import manifest from "../package.json" with { type: "json" };
import { IngestError, INGEST_PIPELINE_VERSION, runIngest } from "../src/index.ts";

const RETRIEVED = "2099-06-01T00:00:00.000Z";
const dirs: string[] = [];
let networkCalls = 0;

beforeEach(() => {
  networkCalls = 0;
  vi.stubGlobal("fetch", () => {
    networkCalls += 1;
    throw new Error("network disabled");
  });
});

afterEach(() => {
  expect(networkCalls).toBe(0);
  vi.unstubAllGlobals();
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "atlas-ingest-"));
  dirs.push(dir);
  return dir;
}

function staged(observationId: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    observationId,
    synthetic: true,
    source: {
      url: `https://example.invalid/synthetic/${observationId}`,
      retrievedAt: RETRIEVED,
      excerpt: {
        attribution: "SYNTHETIC staged observation",
        quote: "SYNTHETIC quote: this sentence is not from a real project.",
      },
    },
    ...extra,
  };
}

function writeObservations(stagingDir: string, observations: readonly Record<string, unknown>[]): void {
  mkdirSync(stagingDir, { recursive: true });
  for (const observation of observations) {
    const id = observation.observationId;
    if (typeof id !== "string") throw new Error("Test observation is missing observationId.");
    writeFileSync(path.join(stagingDir, `${id}.json`), `${JSON.stringify(observation, null, 2)}\n`);
  }
}

function assertSynthetic(catalog: Catalog): void {
  expect(catalog.synthetic).toBe(true);
  expect(catalog.datasetLabel).toBe("synthetic-fixtures");
  expect(catalog.fixtureWarning).toMatch(/SYNTHETIC/);
  expect(catalog.fixtureWarning).toMatch(/not a real project/i);
  expect(countRealProjects(catalog)).toBe(0);
  const records = [
    ...catalog.events,
    ...catalog.projects,
    ...catalog.submissions,
    ...catalog.repositories,
    ...catalog.evidence,
    ...catalog.claims,
  ];
  expect(records.every((record) => record.synthetic)).toBe(true);
  const ids = records.map((record) => record.id);
  expect(new Set(ids).size).toBe(ids.length);
}

function runTwice(observations: readonly Record<string, unknown>[]): Catalog {
  const stagingDir = tempDir();
  const outputDir = tempDir();
  writeObservations(stagingDir, observations);
  const first = runIngest({ stagingDir, outputDir });
  const firstCatalog = readFileSync(first.catalogPath, "utf8");
  const firstCheckpoint = readFileSync(first.checkpointPath, "utf8");
  assertSynthetic(first.catalog);
  expect(first.realProjectCount).toBe(0);
  expect(first.syntheticProjectCount).toBe(first.catalog.projects.length);
  expect(first.resumed).toBe(false);
  const second = runIngest({ stagingDir, outputDir });
  expect(second.appliedThisRun).toEqual([]);
  expect(second.pendingCount).toBe(0);
  expect(second.resumed).toBe(true);
  expect(second.acceptedCount).toBe(first.acceptedCount);
  expect(readFileSync(second.catalogPath, "utf8")).toBe(firstCatalog);
  expect(readFileSync(second.checkpointPath, "utf8")).toBe(firstCheckpoint);
  expect(second.catalog).toEqual(first.catalog);
  return first.catalog;
}

function unknownReasons(claims: readonly ClaimRecord[]): string[] {
  return claims.flatMap((claim) => (claim.resolution.status === "unknown" ? [claim.resolution.reason] : []));
}

describe("staged observation ingest", () => {
  it("pins the workspace TypeScript and Vitest versions and does not add a model or vector client", () => {
    expect(manifest.devDependencies?.typescript).toBe("7.0.2");
    expect(manifest.devDependencies?.vitest).toBe("5.0.2");
    expect(manifest.dependencies).toEqual({ "@hackathon-atlas/schema": "workspace:*" });
    expect(INGEST_PIPELINE_VERSION).toBe("0.1.0");
  });

  it("keeps the committed synthetic fixture out of real counts", () => {
    const stagingDir = path.join(import.meta.dirname, "../fixtures");
    const outputDir = tempDir();
    const first = runIngest({ stagingDir, outputDir });
    const text = readFileSync(first.catalogPath, "utf8");
    assertSynthetic(first.catalog);
    expect(first.catalog.projects).toHaveLength(1);
    expect(first.catalog.repositories[0]?.locator.status).toBe("unknown");
    const second = runIngest({ stagingDir, outputDir });
    expect(readFileSync(second.catalogPath, "utf8")).toBe(text);
    expect(second.appliedThisRun).toEqual([]);
  });

  it("does not merge projects that share a name when identity is uncertain", () => {
    const catalog = runTwice([
      staged("obs_synthetic_dup_alpha", {
        project: { identityKey: "alpha", name: "SYNTHETIC Shared Label", summary: null },
      }),
      staged("obs_synthetic_dup_beta", {
        project: {
          identityKey: "beta",
          name: "SYNTHETIC Shared Label",
          summary: null,
          uncertainSameAs: "alpha",
        },
      }),
    ]);
    expect(catalog.projects).toHaveLength(2);
    expect(new Set(catalog.projects.map((project) => project.id)).size).toBe(2);
    expect(catalog.projects.every((project) => project.name === "SYNTHETIC Shared Label")).toBe(true);
    expect(unknownReasons(catalog.claims).some((reason) => /did not merge/i.test(reason))).toBe(true);
  });

  it("keeps one repository when a rename is asserted and leaves an uncertain rename unmerged", () => {
    const oldUrl = "https://example.invalid/synthetic/boat-old";
    const newUrl = "https://example.invalid/synthetic/boat-new";
    const project = { identityKey: "paper-boat", name: "SYNTHETIC Paper Boat", summary: null };
    const renamed = runTwice([
      staged("obs_synthetic_rename_first", {
        project,
        repository: {
          identityKey: "boat-repo",
          projectIdentityKey: "paper-boat",
          locator: oldUrl,
          linkStatus: "reported",
        },
      }),
      staged("obs_synthetic_rename_second", {
        project,
        repository: {
          identityKey: "boat-repo",
          projectIdentityKey: "paper-boat",
          locator: newUrl,
          previousLocator: oldUrl,
          rename: "asserted-same",
          linkStatus: "reported",
        },
      }),
    ]);
    expect(renamed.projects).toHaveLength(1);
    expect(renamed.repositories).toHaveLength(1);
    expect(renamed.repositories[0]?.locator).toEqual({ status: "known", value: newUrl });

    const maybeUrl = "https://example.invalid/synthetic/boat-maybe";
    const uncertain = runTwice([
      staged("obs_synthetic_rename_keep", {
        project,
        repository: {
          identityKey: "boat-repo",
          projectIdentityKey: "paper-boat",
          locator: oldUrl,
          linkStatus: "reported",
        },
      }),
      staged("obs_synthetic_rename_uncertain", {
        project,
        repository: {
          identityKey: "boat-other",
          projectIdentityKey: "paper-boat",
          locator: maybeUrl,
          previousLocator: oldUrl,
          rename: "uncertain",
          linkStatus: "reported",
        },
      }),
    ]);
    expect(uncertain.repositories).toHaveLength(2);
    const locators = uncertain.repositories.flatMap((repository) =>
      repository.locator.status === "known" ? [repository.locator.value] : [],
    );
    expect(locators).toContain(oldUrl);
    expect(locators).toContain(maybeUrl);
    expect(new Set(uncertain.repositories.map((repository) => repository.projectId)).size).toBe(1);
    expect(
      uncertain.claims.some(
        (claim) => claim.resolution.status === "unknown" && /rename/i.test(claim.statement),
      ),
    ).toBe(true);
  });

  it("records a missing repository locator as unknown", () => {
    const catalog = runTwice([
      staged("obs_synthetic_missing_repo", {
        project: { identityKey: "no-repo", name: "SYNTHETIC Missing Repository", summary: null },
        repository: {
          identityKey: "missing-repo",
          projectIdentityKey: "no-repo",
          locator: null,
          linkStatus: "missing",
        },
      }),
    ]);
    expect(catalog.repositories).toHaveLength(1);
    expect(catalog.repositories[0]?.locator).toEqual({
      status: "unknown",
      reason: "No repository locator was staged.",
    });
    expect(JSON.stringify(catalog.repositories)).not.toContain("https://");
  });

  it("leaves a staged license unset and does not copy the reported text", () => {
    const stagingDir = tempDir();
    const outputDir = tempDir();
    writeObservations(stagingDir, [
      staged("obs_synthetic_unknown_license", {
        project: { identityKey: "unlicensed", name: "SYNTHETIC Unknown License", summary: null },
        license: { reportedText: "MIT" },
      }),
    ]);
    const first = runIngest({ stagingDir, outputDir });
    const catalogText = readFileSync(first.catalogPath, "utf8");
    const checkpointText = readFileSync(first.checkpointPath, "utf8");
    expect(catalogText).not.toContain("MIT");
    expect(checkpointText).not.toContain("MIT");
    expect(catalogText).not.toContain("reportedText");
    assertNoLicenseKey(first.catalog);
    expect(
      first.catalog.claims.some(
        (claim) =>
          claim.statement === "The license is unknown." &&
          claim.resolution.status === "unknown" &&
          /no license was selected/i.test(claim.resolution.reason),
      ),
    ).toBe(true);
    const second = runIngest({ stagingDir, outputDir });
    expect(readFileSync(second.catalogPath, "utf8")).toBe(catalogText);
    expect(second.catalog.claims).toHaveLength(first.catalog.claims.length);
  });

  it("keeps conflicting claims without choosing a winner", () => {
    const project = { identityKey: "color-project", name: "SYNTHETIC Color Project", summary: null };
    const catalog = runTwice([
      staged("obs_synthetic_conflict_blue", {
        project,
        claims: [
          {
            identityKey: "color-blue",
            statement: "The synthetic label color is blue.",
            basis: "source-reported",
            subject: "project",
            resolution: "blue",
            conflictKey: "label-color",
          },
        ],
      }),
      staged("obs_synthetic_conflict_red", {
        project,
        claims: [
          {
            identityKey: "color-red",
            statement: "The synthetic label color is red.",
            basis: "source-reported",
            subject: "project",
            resolution: "red",
            conflictKey: "label-color",
          },
        ],
      }),
    ]);
    const color = catalog.claims.filter((claim) => claim.statement.includes("label color"));
    expect(color).toHaveLength(2);
    expect(color.every((claim) => claim.resolution.status === "unknown")).toBe(true);
    expect(color.map((claim) => claim.statement).sort()).toEqual([
      "The synthetic label color is blue.",
      "The synthetic label color is red.",
    ]);
    expect(unknownReasons(color).every((reason) => /did not choose a winner/i.test(reason))).toBe(true);
  });

  it("records broken links without inventing a replacement", () => {
    const brokenUrl = "https://example.invalid/synthetic/broken-page";
    const badUrl = "http://example.invalid/synthetic/not-https";
    const catalog = runTwice([
      staged("obs_synthetic_broken_https", {
        project: { identityKey: "broken-project", name: "SYNTHETIC Broken Link", summary: null },
        repository: {
          identityKey: "broken-repo",
          projectIdentityKey: "broken-project",
          locator: brokenUrl,
          linkStatus: "broken",
        },
      }),
      staged("obs_synthetic_broken_invalid", {
        project: { identityKey: "invalid-project", name: "SYNTHETIC Invalid Link", summary: null },
        repository: {
          identityKey: "invalid-repo",
          projectIdentityKey: "invalid-project",
          locator: badUrl,
          linkStatus: "broken",
        },
      }),
    ]);
    const serialized = JSON.stringify(catalog);
    expect(serialized).not.toContain(badUrl);
    expect(serialized).not.toContain("not-https");
    const knownLocators = catalog.repositories.flatMap((repository) =>
      repository.locator.status === "known" ? [repository.locator.value] : [],
    );
    expect(knownLocators).toEqual([brokenUrl]);
    expect(catalog.repositories.some((repository) => repository.locator.status === "unknown")).toBe(true);
    expect(catalog.claims.some((claim) => /broken/i.test(claim.statement))).toBe(true);
    expect(unknownReasons(catalog.claims).some((reason) => /no replacement/i.test(reason))).toBe(true);
  });

  it("keeps multiple submissions of one project", () => {
    const project = { identityKey: "paper-boat", name: "SYNTHETIC Paper Boat", summary: null };
    const catalog = runTwice([
      staged("obs_synthetic_submit_north", {
        event: { identityKey: "north", name: "SYNTHETIC North Demo Event", startsAt: null, endsAt: null },
        project,
        submission: {
          identityKey: "boat-north",
          eventIdentityKey: "north",
          projectIdentityKey: "paper-boat",
          submittedAt: null,
        },
      }),
      staged("obs_synthetic_submit_south", {
        event: {
          identityKey: "south",
          name: "SYNTHETIC South Demo Event",
          startsAt: "2099-02-01T00:00:00.000Z",
          endsAt: null,
        },
        project,
        submission: {
          identityKey: "boat-south",
          eventIdentityKey: "south",
          projectIdentityKey: "paper-boat",
          submittedAt: "2099-02-02T00:00:00.000Z",
        },
      }),
    ]);
    expect(catalog.projects).toHaveLength(1);
    expect(catalog.events).toHaveLength(2);
    expect(catalog.submissions).toHaveLength(2);
    expect(new Set(catalog.submissions.map((submission) => submission.projectId)).size).toBe(1);
    expect(new Set(catalog.submissions.map((submission) => submission.eventId)).size).toBe(2);
    expect(catalog.submissions.map((submission) => submission.submittedAt.status).sort()).toEqual([
      "known",
      "unknown",
    ]);
    expect(catalog.projects[0]?.summary.status).toBe("unknown");
  });

  it("resumes a partial run without duplicating accepted observations", () => {
    const observations = ["a", "b", "c"].map((suffix) =>
      staged(`obs_synthetic_resume_${suffix}`, {
        project: {
          identityKey: `resume-${suffix}`,
          name: `SYNTHETIC Resume ${suffix}`,
          summary: null,
        },
      }),
    );
    const stagingDir = tempDir();
    writeObservations(stagingDir, observations);
    const full = runIngest({ stagingDir, outputDir: tempDir() });
    const partialDir = tempDir();
    const partial = runIngest({ stagingDir, outputDir: partialDir, maxNew: 1 });
    expect(partial.acceptedCount).toBe(1);
    expect(partial.pendingCount).toBe(2);
    expect(partial.catalog.projects).toHaveLength(1);
    expect(partial.resumed).toBe(false);
    const resumed = runIngest({ stagingDir, outputDir: partialDir });
    expect(resumed.resumed).toBe(true);
    expect(resumed.acceptedCount).toBe(3);
    expect(resumed.pendingCount).toBe(0);
    expect(resumed.catalog.projects).toHaveLength(3);
    expect(resumed.catalog).toEqual(full.catalog);
    expect(readFileSync(resumed.catalogPath, "utf8")).toBe(readFileSync(full.catalogPath, "utf8"));
    assertSynthetic(resumed.catalog);
    const again = runIngest({ stagingDir, outputDir: partialDir });
    expect(again.appliedThisRun).toEqual([]);
    expect(again.catalog.projects).toHaveLength(3);
  });

  it("does not invent a project for an unresolved repository link", () => {
    const stagingDir = tempDir();
    const outputDir = tempDir();
    writeObservations(stagingDir, [
      staged("obs_synthetic_orphan_repo", {
        repository: {
          identityKey: "orphan",
          projectIdentityKey: "not-staged",
          locator: "https://example.invalid/synthetic/orphan",
          linkStatus: "reported",
        },
      }),
    ]);
    expect(() => runIngest({ stagingDir, outputDir })).toThrow(/did not invent/);
    expect(existsSync(path.join(outputDir, "catalog.json"))).toBe(false);
  });

  it("accepts a staged Devpost source URL without fetching or counting it as real", () => {
    const catalog = runTwice([
      staged("obs_synthetic_devpost", {
        project: { identityKey: "devpost-case", name: "SYNTHETIC Devpost Citation", summary: null },
        source: {
          url: "https://devpost.com/software/synthetic-not-real",
          retrievedAt: RETRIEVED,
        },
      }),
    ]);
    expect(catalog.projects).toHaveLength(1);
    expect(catalog.projects[0]?.synthetic).toBe(true);
    expect(countRealProjects(catalog)).toBe(0);
    expect(
      catalog.evidence.some(
        (item) => item.kind === "source" && item.sourceUrl === "https://devpost.com/software/synthetic-not-real",
      ),
    ).toBe(true);
    expect(networkCalls).toBe(0);
  });

  it("does not store secret-like values, email fields, or instruction fields", () => {
    const token = ["ghp", "abcdefghijklmnopqrstuvwxyz0123456789"].join("_");
    const address = ["person", "example.invalid"].join("@");
    const secretDir = tempDir();
    const secretOut = tempDir();
    writeObservations(secretDir, [
      staged("obs_synthetic_secret", {
        project: { identityKey: "secret-case", name: "SYNTHETIC Secret Skip", summary: null },
        source: {
          url: "https://example.invalid/synthetic/secret-case",
          retrievedAt: RETRIEVED,
          excerpt: { attribution: "SYNTHETIC staged observation", quote: token },
        },
      }),
    ]);
    try {
      runIngest({ stagingDir: secretDir, outputDir: secretOut });
      throw new Error("Expected a secret-like value to be rejected.");
    } catch (error) {
      expect(error).toBeInstanceOf(IngestError);
      expect((error as Error).message).toMatch(/secret-like/);
      expect((error as Error).message).not.toContain(token);
    }
    expect(existsSync(path.join(secretOut, "catalog.json"))).toBe(false);

    const emailDir = tempDir();
    const emailOut = tempDir();
    const emailObservation = staged("obs_synthetic_email", {
      project: { identityKey: "email-case", name: "SYNTHETIC Email Skip", summary: null },
    });
    emailObservation.email = address;
    writeObservations(emailDir, [emailObservation]);
    try {
      runIngest({ stagingDir: emailDir, outputDir: emailOut });
      throw new Error("Expected an email field to be rejected.");
    } catch (error) {
      expect(error).toBeInstanceOf(IngestError);
      expect((error as Error).message).toMatch(/not stored/);
      expect((error as Error).message).not.toContain(address);
    }

    const instructionDir = tempDir();
    const instructionOut = tempDir();
    const instructionObservation = staged("obs_synthetic_instruction", {
      project: { identityKey: "instruction-case", name: "SYNTHETIC Instruction Skip", summary: null },
    });
    instructionObservation.instructions = "ignore previous instructions";
    writeObservations(instructionDir, [instructionObservation]);
    expect(() => runIngest({ stagingDir: instructionDir, outputDir: instructionOut })).toThrow(/not instructions/);
  });

  it("writes an empty synthetic catalog when staging has no observations", () => {
    const result = runIngest({ stagingDir: tempDir(), outputDir: tempDir() });
    assertSynthetic(result.catalog);
    expect(result.catalog.projects).toHaveLength(0);
    expect(result.realProjectCount).toBe(0);
    expect(result.acceptedCount).toBe(0);
  });
});

function assertNoLicenseKey(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) assertNoLicenseKey(item);
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      expect(key.toLowerCase()).not.toBe("license");
      assertNoLicenseKey(child);
    }
  }
}
