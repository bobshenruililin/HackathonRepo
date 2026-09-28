/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 *
 * Temporary synthetic catalog. This file does not read catalog/hackmit.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { retrieveAnalogues } from "@hackathon-atlas/analogues";

import { findAnalogues, runCli } from "../src/index.js";
import type { AnaloguesResponse } from "../src/index.js";

const RETRIEVED = "2099-06-01T00:00:00.000Z";
const FIXTURE_WARNING = "SYNTHETIC FIXTURE. Not a real project. Do not count these records as real projects.";
const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const cliBin = path.join(packageRoot, "dist", "main.js");
const tempDirs: string[] = [];

type Subject = { entity: "project" | "submission" | "repository" | "event"; id: string };

type ClaimInput = {
  id: string;
  projectId: string;
  statement: string;
  subject?: Subject;
};

type ProjectInput = { id: string; name: string; synthetic?: boolean };

afterEach(() => {
  vi.unstubAllGlobals();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("analogues command", () => {
  it("prints shared text for an exact project id and does not score it", () => {
    const catalog = writeCatalog(trackCatalog());
    const fetchMock = vi.fn(() => {
      throw new Error("network disabled");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = capture([
      "analogues",
      "--catalog",
      catalog.path,
      "--mode",
      "direct",
      "--project",
      "prj_synthetic_query",
    ]);

    expect(result.code).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.stderr).toMatch(/Synthetic analogues are labeled synthetic/);
    const body = parseStdout(result.stdout);
    expect(Object.keys(body).sort()).toEqual(["analogues", "status"]);
    expect(body.status).toBe("matched");
    expect(body.analogues).toEqual([
      {
        projectId: "prj_synthetic_other",
        synthetic: true,
        shared: ["Education"],
      },
    ]);
    expect(JSON.stringify(body)).not.toMatch(/precision|recall|recommendation/i);
    const retrieval = retrieveAnalogues(catalog.document, "prj_synthetic_query", "direct");
    expect(retrieval.status).toBe("matched");
    if (retrieval.status !== "matched") return;
    expect(body.analogues.map((analogue) => analogue.shared)).toEqual(
      retrieval.analogues.map((analogue) => analogue.shared.map((item) => item.text)),
    );
  });

  it("resolves an exact title and leaves a different title unknown", () => {
    const catalog = writeCatalog(trackCatalog());
    const matched = capture([
      "analogues",
      "--catalog",
      catalog.path,
      "--mode",
      "direct",
      "--title",
      "SYNTHETIC Query Project",
    ]);
    expect(matched.code).toBe(0);
    expect(parseStdout(matched.stdout).analogues.map((analogue) => analogue.projectId)).toEqual([
      "prj_synthetic_other",
    ]);

    const unknown = capture([
      "analogues",
      "--catalog",
      catalog.path,
      "--mode",
      "direct",
      "--title",
      "synthetic query project",
    ]);
    expect(unknown.code).toBe(0);
    expect(parseStdout(unknown.stdout)).toEqual({
      status: "unknown",
      reason: "No project has that exact name.",
      analogues: [],
    });
    expect(unknown.stderr).toBe("");
  });

  it("exits with a usage error listing every id when a title is ambiguous", () => {
    const catalog = writeCatalog(
      fixture(
        [
          { id: "prj_synthetic_one", name: "SYNTHETIC Shared Name" },
          { id: "prj_synthetic_two", name: "SYNTHETIC Shared Name" },
        ],
        [
          {
            id: "clm_one_track",
            projectId: "prj_synthetic_one",
            statement: "The gallery card names the track Education.",
          },
          {
            id: "clm_two_track",
            projectId: "prj_synthetic_two",
            statement: "The gallery card names the track Education.",
          },
        ],
      ),
    );
    const result = capture([
      "analogues",
      "--catalog",
      catalog.path,
      "--mode",
      "direct",
      "--title",
      "SYNTHETIC Shared Name",
    ]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("prj_synthetic_one");
    expect(result.stderr).toContain("prj_synthetic_two");
    expect(result.stderr).toMatch(/more than one project/i);
  });

  it("keeps an unknown project id and an unknown track unknown", () => {
    const catalog = writeCatalog(
      fixture(
        [{ id: "prj_synthetic_query", name: "SYNTHETIC Query Project" }],
        [
          {
            id: "clm_unknown_track",
            projectId: "prj_synthetic_query",
            statement: "The track is unknown.",
          },
        ],
      ),
    );
    const missing = capture([
      "analogues",
      "--catalog",
      catalog.path,
      "--mode",
      "direct",
      "--project",
      "prj_synthetic_absent",
    ]);
    expect(missing.code).toBe(0);
    expect(parseStdout(missing.stdout)).toEqual({
      status: "unknown",
      reason: "The project id is not in the catalog.",
      analogues: [],
    });

    const unknownTrack = findAnalogues({
      catalogPath: catalog.path,
      mode: "direct",
      subject: { kind: "project", projectId: "prj_synthetic_query" },
    });
    expect(unknownTrack).toEqual({
      status: "unknown",
      reason: "The catalog states this value is unknown.",
      analogues: [],
    });
  });

  it("prints mechanism and demo shared text from the same temporary catalog", () => {
    const catalog = writeCatalog(
      fixture(
        [
          { id: "prj_synthetic_query", name: "SYNTHETIC Query Project" },
          { id: "prj_synthetic_other", name: "SYNTHETIC Other Project" },
        ],
        [
          {
            id: "clm_query_tech",
            projectId: "prj_synthetic_query",
            statement: "Built With: PostgreSQL, Redis.",
          },
          {
            id: "clm_other_tech",
            projectId: "prj_synthetic_other",
            statement: "Built With: Redis.",
          },
          {
            id: "clm_query_demo",
            projectId: "prj_synthetic_query",
            statement: "The gallery payload links a demo URL: https://river-health.example.test/demo",
          },
          {
            id: "clm_other_demo",
            projectId: "prj_synthetic_other",
            statement: "The Devpost project page links a demo URL: https://www.river-health.example.test/watch",
          },
        ],
      ),
    );

    const mechanism = capture([
      "analogues",
      "--catalog",
      catalog.path,
      "--mode",
      "mechanism",
      "--project",
      "prj_synthetic_query",
    ]);
    expect(parseStdout(mechanism.stdout).analogues).toEqual([
      {
        projectId: "prj_synthetic_other",
        synthetic: true,
        shared: ["Redis"],
      },
    ]);

    const demo = capture([
      "analogues",
      "--catalog",
      catalog.path,
      "--mode",
      "demo",
      "--title",
      "SYNTHETIC Query Project",
    ]);
    expect(parseStdout(demo.stdout).analogues).toEqual([
      {
        projectId: "prj_synthetic_other",
        synthetic: true,
        shared: ["river-health.example.test"],
      },
    ]);
  });

  it("rejects usage mistakes and a missing or invalid catalog without fetching", () => {
    const catalog = writeCatalog(trackCatalog());
    expect(capture(["analogues", "--catalog", catalog.path, "--project", "prj_synthetic_query"]).code).toBe(2);
    expect(
      capture([
        "analogues",
        "--catalog",
        catalog.path,
        "--mode",
        "vector",
        "--project",
        "prj_synthetic_query",
      ]).code,
    ).toBe(2);
    expect(
      capture([
        "analogues",
        "--catalog",
        catalog.path,
        "--mode",
        "direct",
        "--project",
        "prj_synthetic_query",
        "--title",
        "SYNTHETIC Query Project",
      ]).code,
    ).toBe(2);
    expect(capture(["analogues", "--mode", "direct", "--project", "prj_synthetic_query"]).code).toBe(2);
    expect(
      capture([
        "analogues",
        "--catalog",
        catalog.path,
        "--mode",
        "direct",
        "--index",
        path.join(tempDir(), "index.sqlite"),
        "--project",
        "prj_synthetic_query",
      ]).stderr,
    ).toMatch(/does not read an index/);

    const missing = capture([
      "analogues",
      "--catalog",
      path.join(tempDir(), "missing.json"),
      "--mode",
      "direct",
      "--project",
      "prj_synthetic_query",
    ]);
    expect(missing.code).toBe(1);
    expect(missing.stdout).toBe("");
    expect(missing.stderr).toMatch(/Catalog file does not exist/);

    const invalidPath = path.join(tempDir(), "invalid.json");
    writeFileSync(invalidPath, "{");
    const invalid = capture(["analogues", "--catalog", invalidPath, "--mode", "demo", "--title", "SYNTHETIC"]);
    expect(invalid.code).toBe(1);
    expect(invalid.stderr).toMatch(/not valid JSON/);

    const search = capture(["search", "--catalog", catalog.path, "--index", path.join(tempDir(), "index.sqlite"), "token"]);
    expect(search.code).toBe(2);
    expect(search.stderr).toMatch(/search does not accept analogues options/);
  });

  it("runs the built executable against a temporary synthetic catalog", () => {
    const catalog = writeCatalog(trackCatalog());
    const result = spawnSync(
      process.execPath,
      [
        cliBin,
        "analogues",
        "--catalog",
        catalog.path,
        "--mode",
        "direct",
        "--title",
        "SYNTHETIC Query Project",
      ],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    const body = parseStdout(result.stdout);
    expect(body.status).toBe("matched");
    expect(body.analogues).toEqual([
      {
        projectId: "prj_synthetic_other",
        synthetic: true,
        shared: ["Education"],
      },
    ]);
    expect(result.stdout).not.toMatch(/precision|recall|recommendation/i);
  });

  it("keeps the command local to a catalog file", () => {
    const root = path.resolve(packageRoot, "src");
    const sources = readdirSync(root)
      .filter((name) => name.endsWith(".ts"))
      .map((name) => readFileSync(path.join(root, name), "utf8"))
      .join("\n");
    const command = readFileSync(path.join(root, "analogues-command.ts"), "utf8");

    expect(sources).toContain("Copyright (c) 2026 Shen Ruililin");
    expect(command).toContain("retrieveAnalogues");
    expect(command).not.toMatch(/from ["']node:(?:sqlite|http|https|net)["']/);
    expect(command).not.toMatch(/\bfetch\s*\(/);
    expect(command).not.toContain("catalog/hackmit");
    expect(command.toLowerCase()).not.toContain("precision");
    expect(command.toLowerCase()).not.toContain("recall");
    expect(command.toLowerCase()).not.toContain("recommendation");
  });
});

function capture(argv: readonly string[]): { code: number; stdout: string; stderr: string } {
  let stdout = "";
  let stderr = "";
  const code = runCli(argv, {
    stdout: (chunk) => {
      stdout += chunk;
    },
    stderr: (chunk) => {
      stderr += chunk;
    },
  });
  return { code, stdout, stderr };
}

function parseStdout(stdout: string): AnaloguesResponse {
  return JSON.parse(stdout) as AnaloguesResponse;
}

function trackCatalog(): Record<string, unknown> {
  return fixture(
    [
      { id: "prj_synthetic_query", name: "SYNTHETIC Query Project" },
      { id: "prj_synthetic_other", name: "SYNTHETIC Other Project" },
    ],
    [
      {
        id: "clm_query_track",
        projectId: "prj_synthetic_query",
        statement: "The gallery card names the track Education.",
      },
      {
        id: "clm_other_track",
        projectId: "prj_synthetic_other",
        statement: "The gallery card names the track Education.",
      },
    ],
  );
}

function fixture(projects: readonly ProjectInput[], claims: readonly ClaimInput[]): Record<string, unknown> {
  return {
    schemaVersion: "0.1.0",
    authority: "canonical-catalog",
    authoritative: true,
    synthetic: true,
    datasetLabel: "synthetic-fixtures",
    fixtureWarning: FIXTURE_WARNING,
    events: [
      {
        id: "evt_synthetic_analogue_0001",
        synthetic: true,
        name: "SYNTHETIC Analogue Event",
        startsAt: { status: "unknown", reason: "No start time was staged." },
        endsAt: { status: "unknown", reason: "No end time was staged." },
      },
    ],
    projects: projects.map((project) => ({
      id: project.id,
      synthetic: project.synthetic ?? true,
      name: project.name,
      summary: { status: "unknown", reason: "No summary was staged." },
    })),
    submissions: [],
    repositories: [],
    evidence: claims.map((claim) => ({
      id: `evd_${claim.id}`,
      kind: "source",
      synthetic: true,
      sourceUrl: "https://example.invalid/synthetic/analogue-fixture",
      retrievedAt: RETRIEVED,
    })),
    claims: claims.map((claim) => ({
      id: claim.id,
      synthetic: true,
      subject: claim.subject ?? { entity: "project", id: claim.projectId },
      statement: claim.statement,
      basis: "source-reported",
      evidenceIds: [`evd_${claim.id}`],
      observedAt: RETRIEVED,
      reviewStatus: "unreviewed",
      sourceUrl: "https://example.invalid/synthetic/analogue-fixture",
      retrievedAt: RETRIEVED,
      repositoryInspected: false,
      resolution: { status: "unknown", reason: "No resolution was staged." },
    })),
  };
}

function writeCatalog(document: Record<string, unknown>): { path: string; document: Record<string, unknown> } {
  const dir = tempDir();
  const catalogPath = path.join(dir, "synthetic-catalog.json");
  writeFileSync(catalogPath, JSON.stringify(document));
  return { path: catalogPath, document };
}

function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "catalog-cli-analogues-"));
  tempDirs.push(dir);
  return dir;
}
