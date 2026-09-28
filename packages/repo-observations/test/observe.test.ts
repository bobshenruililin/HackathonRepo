import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  AWARD_NOT_INFERRED_REASON,
  countObservationReports,
  loadSyntheticObservation,
  MAX_EXCERPT_QUOTE_LENGTH,
  ObservationInputError,
  observeRepository,
} from "../src/index.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const fixturePath = fileURLToPath(
  new URL("../fixtures/synthetic-not-a-real-project.json", import.meta.url),
);
const readmeQuote =
  "SYNTHETIC FIXTURE. Not a real project. This prose names paperboat and is not a copied README.";

function findObservation<T extends { name: string }>(
  name: string,
  observations: readonly T[],
): T | undefined {
  return observations.find((observation) => observation.name.toLowerCase() === name.toLowerCase());
}

describe("README-only claim", () => {
  it("stays source-reported when the name is only in README prose", () => {
    const report = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      technologyNames: ["paperboat"],
      files: [{ path: "README.md" }],
      excerpts: [{ path: "README.md", quote: readmeQuote }],
    });
    const observation = findObservation("paperboat", report.observations);
    expect(observation).toMatchObject({
      name: "paperboat",
      basis: "source-reported",
      role: "unknown",
      evidencePaths: ["README.md"],
      synthetic: true,
      revision: { status: "known", value: "SYNTHETIC-REVISION-0001" },
    });
    expect(report.languages).toEqual([]);
    expect(report.frameworks).toEqual([]);
    expect(report.projects).toEqual([]);
    expect(report.revision).toEqual({ status: "known", value: "SYNTHETIC-REVISION-0001" });
    expect(JSON.stringify(report)).not.toContain("not a copied README");
  });

  it("treats a backtick-quoted README token as source-reported", () => {
    const report = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      excerpts: [
        {
          path: "README.md",
          quote: "SYNTHETIC FIXTURE names `paperboat` in prose only.",
        },
      ],
    });
    expect(findObservation("paperboat", report.observations)).toMatchObject({
      basis: "source-reported",
      evidencePaths: ["README.md"],
    });
  });
});

describe("package.json dependency", () => {
  it("records the same name as code-observed", () => {
    const quote = '{"name":"synthetic-not-a-real-project","dependencies":{"paperboat":"0.0.0"}}';
    expect(quote.length).toBeLessThanOrEqual(MAX_EXCERPT_QUOTE_LENGTH);
    const report = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      technologyNames: ["paperboat"],
      files: [{ path: "README.md" }, { path: "package.json" }],
      excerpts: [
        { path: "README.md", quote: readmeQuote },
        { path: "package.json", quote },
      ],
    });
    const matches = report.observations.filter(
      (observation) => observation.name.toLowerCase() === "paperboat",
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      basis: "code-observed",
      role: "library",
      synthetic: true,
      revision: { status: "known", value: "SYNTHETIC-REVISION-0001" },
    });
    expect(matches[0]?.evidencePaths).toContain("package.json");
    expect(report.projects).toEqual([]);
    expect(report.observations.map((observation) => observation.name)).not.toContain(
      "synthetic-not-a-real-project",
    );
  });

  it("does not treat script names as dependencies", () => {
    const quote =
      '{"name":"synthetic-not-a-real-project","scripts":{"paperboat":"echo no"},"dependencies":{}}';
    expect(quote.length).toBeLessThanOrEqual(MAX_EXCERPT_QUOTE_LENGTH);
    const report = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      technologyNames: ["paperboat"],
      excerpts: [{ path: "package.json", quote }],
    });
    expect(findObservation("paperboat", report.observations)).toMatchObject({ basis: "unknown" });
    expect(report.languages).toEqual([]);
    expect(report.frameworks).toEqual([]);
  });
});

describe("revision", () => {
  it("is unknown when the caller omits it", () => {
    const report = observeRepository({
      synthetic: true,
      technologyNames: ["paperboat"],
      excerpts: [{ path: "README.md", quote: readmeQuote }],
    });
    expect(report.revision).toEqual({
      status: "unknown",
      reason: "The caller did not supply a revision.",
    });
    expect(report.observations[0]?.revision).toEqual(report.revision);
    expect(report.observations[0]?.basis).toBe("source-reported");
  });

  it("is unknown for a blank revision and does not keep a commit found in prose", () => {
    const fakeCommit = "a".repeat(40);
    const quote = `SYNTHETIC FIXTURE names paperboat near ${fakeCommit}.`;
    expect(quote.length).toBeLessThanOrEqual(MAX_EXCERPT_QUOTE_LENGTH);
    const blank = observeRepository({
      revision: "   ",
      synthetic: true,
      technologyNames: ["paperboat"],
      excerpts: [{ path: "README.md", quote }],
    });
    expect(blank.revision.status).toBe("unknown");
    expect(JSON.stringify(blank.revision)).not.toContain(fakeCommit);

    const omitted = observeRepository({
      synthetic: true,
      technologyNames: ["paperboat"],
      excerpts: [{ path: "README.md", quote }],
    });
    expect(omitted.revision.status).toBe("unknown");
    expect(JSON.stringify(omitted)).not.toContain(fakeCommit);
  });

  it("does not store a revision that exceeds the length limit", () => {
    const tooLong = `SYNTHETIC-${"r".repeat(130)}`;
    const report = observeRepository({
      revision: tooLong,
      synthetic: true,
      files: [{ path: "src/main.py" }],
    });
    expect(report.revision).toEqual({
      status: "unknown",
      reason: "The caller-supplied revision exceeds the length limit.",
    });
    expect(JSON.stringify(report)).not.toContain(tooLong);
    expect(report.languages.map((observation) => observation.name)).toEqual(["Python"]);
  });
});

describe("empty input", () => {
  it("does not invent a language or framework", () => {
    const report = observeRepository({});
    expect(report.observations).toEqual([]);
    expect(report.languages).toEqual([]);
    expect(report.frameworks).toEqual([]);
    expect(report.projects).toEqual([]);
    expect(report.counts).toEqual({
      realProjects: 0,
      realObservations: 0,
      syntheticObservations: 0,
    });
    expect(report.award).toEqual({ status: "unknown", reason: AWARD_NOT_INFERRED_REASON });
    expect(report.revision.status).toBe("unknown");
  });

  it("does not invent JavaScript from a package.json path without a dependency excerpt", () => {
    const report = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      files: [{ path: "package.json" }, { path: "README.md" }],
    });
    expect(report.languages).toEqual([]);
    expect(report.frameworks).toEqual([]);
    expect(report.observations).toEqual([]);
  });

  it("does not invent React from a TypeScript source path", () => {
    const report = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      files: [{ path: "src/app.tsx" }],
    });
    expect(report.languages.map((observation) => observation.name)).toEqual(["TypeScript"]);
    expect(report.languages[0]).toMatchObject({
      basis: "code-observed",
      role: "language",
      evidencePaths: ["src/app.tsx"],
    });
    expect(report.frameworks).toEqual([]);
    expect(report.observations.map((observation) => observation.name)).not.toContain("React");
  });

  it("does not invent C or C++ from a header path", () => {
    const report = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      files: [{ path: "include/widget.h" }],
    });
    expect(report.languages).toEqual([]);
    expect(report.observations).toEqual([]);
  });
});

describe("insufficient evidence", () => {
  it("stays unknown when the name is not in README prose, a manifest, or a source path", () => {
    const report = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      technologyNames: ["paperboat"],
      excerpts: [
        {
          path: "notes/scratch.txt",
          quote: "SYNTHETIC FIXTURE names paperboat in a note that is not a README.",
        },
      ],
    });
    expect(findObservation("paperboat", report.observations)).toMatchObject({
      basis: "unknown",
      role: "unknown",
      evidencePaths: [],
      revision: { status: "known", value: "SYNTHETIC-REVISION-0001" },
    });
    expect(report.counts.realObservations).toBe(0);
  });
});

describe("manifests and source paths", () => {
  it("code-observes languages and dependencies the caller supplied", () => {
    const cases: Array<{ path: string; quote: string; names: string[]; language: string }> = [
      {
        path: "requirements.txt",
        quote: "paperboat==0.0.0\n# SYNTHETIC FIXTURE, not a real project",
        names: ["paperboat"],
        language: "Python",
      },
      {
        path: "go.mod",
        quote:
          'module example.invalid/synthetic-not-a-real-project\n\ngo 1.22\n\nrequire (\n\texample.invalid/widget v0.0.1\n)\n',
        names: ["example.invalid/widget"],
        language: "Go",
      },
      {
        path: "Cargo.toml",
        quote: '[package]\nname = "synthetic-not-a-real-project"\nversion = "0.0.0"\n\n[dependencies]\npaperboat = "0.0.0"\n',
        names: ["paperboat"],
        language: "Rust",
      },
      {
        path: "pyproject.toml",
        quote: '[project]\nname = "synthetic-not-a-real-project"\ndependencies = [\n  "paperboat>=0.0.0",\n]\n',
        names: ["paperboat"],
        language: "Python",
      },
    ];

    for (const item of cases) {
      expect(item.quote.length).toBeLessThanOrEqual(MAX_EXCERPT_QUOTE_LENGTH);
      expect(item.quote).toMatch(/synthetic/i);
      const report = observeRepository({
        revision: "SYNTHETIC-REVISION-0001",
        synthetic: true,
        files: [{ path: item.path }],
        excerpts: [{ path: item.path, quote: item.quote }],
      });
      expect(report.projects).toEqual([]);
      expect(report.counts.realProjects).toBe(0);
      expect(report.counts.realObservations).toBe(0);
      const language = findObservation(item.language, report.observations);
      expect(language).toMatchObject({
        basis: "code-observed",
        role: "language",
        evidencePaths: [item.path],
      });
      for (const name of item.names) {
        expect(findObservation(name, report.observations)).toMatchObject({
          basis: "code-observed",
          evidencePaths: [item.path],
        });
      }
      expect(report.observations.map((observation) => observation.name)).not.toContain(
        "synthetic-not-a-real-project",
      );
      expect(report.observations.map((observation) => observation.name)).not.toContain(
        "example.invalid/synthetic-not-a-real-project",
      );
    }
  });

  it("code-observes a framework only from a manifest dependency", () => {
    const quote = '{"name":"synthetic-not-a-real-project","dependencies":{"react":"0.0.0"}}';
    expect(quote.length).toBeLessThanOrEqual(MAX_EXCERPT_QUOTE_LENGTH);
    const fromManifest = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      excerpts: [{ path: "package.json", quote }],
    });
    expect(fromManifest.frameworks).toEqual([
      expect.objectContaining({
        name: "react",
        role: "framework",
        basis: "code-observed",
        evidencePaths: ["package.json"],
      }),
    ]);

    const fromReadme = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      technologyNames: ["react"],
      excerpts: [
        {
          path: "README.md",
          quote: "SYNTHETIC FIXTURE names react in prose only.",
        },
      ],
    });
    expect(fromReadme.frameworks).toEqual([]);
    expect(findObservation("react", fromReadme.observations)?.basis).toBe("source-reported");
  });

  it("code-observes Python from a named source file", () => {
    const report = observeRepository({
      revision: "SYNTHETIC-REVISION-0002",
      files: [{ path: "src/main.py" }],
    });
    expect(report.synthetic).toBe(false);
    expect(report.projects).toEqual([]);
    expect(report.counts).toEqual({
      realProjects: 0,
      realObservations: 1,
      syntheticObservations: 0,
    });
    expect(report.languages[0]).toMatchObject({
      name: "Python",
      basis: "code-observed",
      synthetic: false,
      revision: { status: "known", value: "SYNTHETIC-REVISION-0002" },
    });
  });
});

describe("awards", () => {
  it("stays unknown when prose mentions a prize", () => {
    const report = observeRepository({
      revision: "SYNTHETIC-REVISION-0001",
      synthetic: true,
      technologyNames: ["paperboat"],
      excerpts: [
        {
          path: "README.md",
          quote: "SYNTHETIC FIXTURE mentions a prize and an award. Not a real award and not a real project.",
        },
      ],
    });
    expect(report.award).toEqual({ status: "unknown", reason: AWARD_NOT_INFERRED_REASON });
    expect(report.projects).toEqual([]);
    expect(JSON.stringify(report.award)).not.toMatch(/prize|winner|first place/i);
    expect(report.observations.some((observation) => /prize|award/i.test(observation.name))).toBe(false);
  });
});

describe("synthetic fixture", () => {
  it("is labeled synthetic and is excluded from real counts", () => {
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
      synthetic?: unknown;
      datasetLabel?: unknown;
      fixtureWarning?: unknown;
      excerpts?: { quote?: string }[];
    };
    expect(fixture.synthetic).toBe(true);
    expect(fixture.datasetLabel).toBe("synthetic-fixtures");
    expect(fixture.fixtureWarning).toMatch(/SYNTHETIC FIXTURE/);
    expect(fixture.fixtureWarning).toMatch(/not a real project/i);
    for (const excerpt of fixture.excerpts ?? []) {
      expect(excerpt.quote).toMatch(/SYNTHETIC/);
      expect(excerpt.quote?.length ?? 0).toBeLessThanOrEqual(MAX_EXCERPT_QUOTE_LENGTH);
    }

    const report = loadSyntheticObservation(fixture);
    expect(report.synthetic).toBe(true);
    expect(report.projects).toEqual([]);
    expect(report.counts).toEqual({
      realProjects: 0,
      realObservations: 0,
      syntheticObservations: 1,
    });
    expect(findObservation("paperboat", report.observations)).toMatchObject({
      basis: "source-reported",
      synthetic: true,
      revision: { status: "known", value: "SYNTHETIC-REVISION-paper-boat-0001" },
    });

    const listed = observeRepository({
      revision: "SYNTHETIC-REVISION-0002",
      files: [{ path: "src/main.py" }],
    });
    expect(countObservationReports([report, listed])).toEqual({
      realProjects: 0,
      realObservations: 1,
      syntheticObservations: 1,
    });
  });

  it("rejects a fixture that is not labeled synthetic", () => {
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
    expect(() => loadSyntheticObservation({ ...fixture, synthetic: false })).toThrow(ObservationInputError);
    expect(() => loadSyntheticObservation({ ...fixture, datasetLabel: "projects" })).toThrow(
      /not labeled synthetic/i,
    );
    const { fixtureWarning: _ignored, ...unwarned } = fixture;
    expect(() => loadSyntheticObservation(unwarned)).toThrow(/not labeled synthetic/i);
  });
});

describe("input limits", () => {
  it("rejects an excerpt longer than 240 characters without echoing the quote", () => {
    const quote = `SYNTHETIC ${"q".repeat(240)}`;
    expect(quote.length).toBeGreaterThan(MAX_EXCERPT_QUOTE_LENGTH);
    expect(() =>
      observeRepository({
        synthetic: true,
        excerpts: [{ path: "README.md", quote }],
      }),
    ).toThrow(/exceeds 240 characters/);
    try {
      observeRepository({ synthetic: true, excerpts: [{ path: "README.md", quote }] });
    } catch (error) {
      expect(error).toBeInstanceOf(ObservationInputError);
      expect((error as Error).message).not.toContain(quote);
    }
  });

  it("rejects a non-boolean synthetic flag", () => {
    expect(() => observeRepository({ synthetic: "true" as unknown as boolean })).toThrow(
      /Synthetic flag must be a boolean/,
    );
  });
});

describe("package boundary", () => {
  it("does not fetch, clone, or execute", () => {
    const sourceDir = path.join(packageRoot, "src");
    const files = readdirSync(sourceDir).filter((name) => name.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(0);
    const forbidden = [
      "node:child_process",
      "node:http",
      "node:https",
      "child_process",
      "execSync",
      "spawn(",
      "fetch(",
      "git clone",
      "eval(",
      "new Function",
    ];
    for (const file of files) {
      const source = readFileSync(path.join(sourceDir, file), "utf8");
      for (const token of forbidden) {
        expect(source.includes(token), `${file} contains ${token}`).toBe(false);
      }
    }
  });
});
