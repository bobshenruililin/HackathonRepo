/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 *
 * In-memory synthetic fixture. This file does not read catalog/hackmit.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { AnalogueError, retrieveAnalogues, type AnalogueRetrieval } from "../src/index.js";

const RETRIEVED = "2099-06-01T00:00:00.000Z";
const FIXTURE_WARNING = "SYNTHETIC FIXTURE. Not a real project. Do not count these records as real projects.";

type Subject = { entity: "project" | "submission" | "repository" | "event"; id: string };

type ClaimInput = {
  id: string;
  projectId: string;
  statement: string;
  subject?: Subject;
  basis?: "source-reported" | "code-observed" | "test-observed" | "inferred";
  reviewStatus?: "unreviewed" | "accepted" | "rejected";
  evidenceId?: string;
  omitEvidence?: boolean;
  danglingEvidence?: boolean;
};

type ProjectInput = { id: string; synthetic?: boolean };

function claimRecord(input: ClaimInput): Record<string, unknown> {
  const evidenceId = input.evidenceId ?? `evd_${input.id}`;
  return {
    id: input.id,
    synthetic: true,
    subject: input.subject ?? { entity: "project", id: input.projectId },
    statement: input.statement,
    basis: input.basis ?? "source-reported",
    evidenceIds: input.omitEvidence ? [] : [evidenceId],
    observedAt: RETRIEVED,
    reviewStatus: input.reviewStatus ?? "unreviewed",
    sourceUrl: "https://example.invalid/synthetic/analogue-fixture",
    retrievedAt: RETRIEVED,
    repositoryInspected: false,
    resolution: { status: "unknown", reason: "No resolution was staged." },
  };
}

function fixture(projects: readonly ProjectInput[], claims: readonly ClaimInput[]): Record<string, unknown> {
  const evidence = claims
    .filter((item) => !item.omitEvidence && !item.danglingEvidence)
    .map((item) => ({
      id: item.evidenceId ?? `evd_${item.id}`,
      kind: "source",
      synthetic: true,
      sourceUrl: "https://example.invalid/synthetic/analogue-fixture",
      retrievedAt: RETRIEVED,
    }));
  const submissions = claims
    .filter((item) => item.subject?.entity === "submission")
    .map((item) => ({
      id: item.subject?.id,
      synthetic: true,
      projectId: item.projectId,
      eventId: "evt_synthetic_analogue_0001",
      submittedAt: { status: "unknown", reason: "No submission time was staged." },
    }));
  const repositories = claims
    .filter((item) => item.subject?.entity === "repository")
    .map((item) => ({
      id: item.subject?.id,
      synthetic: true,
      projectId: item.projectId,
      locator: { status: "unknown", reason: "No repository locator was staged." },
    }));
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
      name: `SYNTHETIC ${project.id}`,
      summary: { status: "unknown", reason: "No summary was staged." },
    })),
    submissions,
    repositories,
    evidence,
    claims: claims.map(claimRecord),
  };
}

function statementsOf(result: AnalogueRetrieval): string[] {
  if (result.status !== "matched") return [];
  return result.analogues.flatMap((analogue) => analogue.shared.flatMap((shared) => shared.claims.map((claim) => claim.statement)));
}

describe("synthetic fixture", () => {
  it("keeps the fixture in memory and labeled synthetic", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
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

    expect(catalog.synthetic).toBe(true);
    expect(catalog.datasetLabel).toBe("synthetic-fixtures");
    expect(catalog.fixtureWarning).toBe(FIXTURE_WARNING);
    expect(JSON.stringify(catalog)).not.toContain("catalog/hackmit");
  });
});

describe("direct mode", () => {
  it("cites both projects and the track statements that match", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_track",
          projectId: "prj_synthetic_query",
          statement: "The gallery card names the track Education.",
        },
        {
          id: "clm_query_winner",
          projectId: "prj_synthetic_query",
          statement: "The gallery card states the award label Winner. It does not name a prize.",
        },
        {
          id: "clm_other_track",
          projectId: "prj_synthetic_other",
          statement: "The gallery card names the track Education.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "direct");

    expect(result.status).toBe("matched");
    expect(result.realAnalogueCount).toBe(0);
    expect(result.analogues).toEqual([
      {
        projectId: "prj_synthetic_other",
        synthetic: true,
        shared: [
          {
            text: "Education",
            claims: [
              {
                projectId: "prj_synthetic_query",
                claimId: "clm_query_track",
                statement: "The gallery card names the track Education.",
                evidenceIds: ["evd_clm_query_track"],
              },
              {
                projectId: "prj_synthetic_other",
                claimId: "clm_other_track",
                statement: "The gallery card names the track Education.",
                evidenceIds: ["evd_clm_other_track"],
              },
            ],
          },
        ],
      },
    ]);
    expect(statementsOf(result).some((statement) => statement.includes("Winner"))).toBe(false);
  });

  it("shares challenge text with a track of the same name and ignores a generic item", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_prefs",
          projectId: "prj_synthetic_query",
          statement: "The gallery card names challenge preferences: General, Windsurf Challenge.",
        },
        {
          id: "clm_other_track",
          projectId: "prj_synthetic_other",
          statement: "The gallery card names the track Windsurf Challenge.",
        },
        {
          id: "clm_other_general",
          projectId: "prj_synthetic_other",
          statement: "The gallery card names the track General.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "direct");

    expect(result.status).toBe("matched");
    expect(result.analogues[0]?.shared.map((shared) => shared.text)).toEqual(["Windsurf Challenge"]);
  });

  it("returns no match when the only shared track text is General or NO TRACK", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_general",
          projectId: "prj_synthetic_query",
          statement: "The gallery card names the track General.",
        },
        {
          id: "clm_other_general",
          projectId: "prj_synthetic_other",
          statement: "The gallery card names the track NO TRACK.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "direct");

    expect(result).toMatchObject({
      status: "no-match",
      analogues: [],
      realAnalogueCount: 0,
      reason: "The shared text is too generic to justify an analogue.",
    });
  });

  it("does not treat a shared Beginner track or challenge as a direct analogue", () => {
    const catalog = fixture(
      [
        { id: "prj_synthetic_query" },
        { id: "prj_synthetic_beginner" },
        { id: "prj_synthetic_education" },
      ],
      [
        {
          id: "clm_query_beginner_track",
          projectId: "prj_synthetic_query",
          statement: "The gallery card names the track Beginner.",
        },
        {
          id: "clm_query_beginner_challenge",
          projectId: "prj_synthetic_query",
          statement: "The gallery card names challenge preferences: Beginner.",
        },
        {
          id: "clm_query_education",
          projectId: "prj_synthetic_query",
          statement: "The gallery card names the track Education.",
        },
        {
          id: "clm_beginner_track",
          projectId: "prj_synthetic_beginner",
          statement: "The gallery card names the track Beginner.",
        },
        {
          id: "clm_beginner_challenge",
          projectId: "prj_synthetic_beginner",
          statement: "Challenge: Beginner",
        },
        {
          id: "clm_education_track",
          projectId: "prj_synthetic_education",
          statement: "The gallery card names the track Education.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "direct");

    expect(result.status).toBe("matched");
    expect(result.realAnalogueCount).toBe(0);
    expect(result.analogues.map((analogue) => analogue.projectId)).toEqual(["prj_synthetic_education"]);
    expect(result.analogues[0]?.shared.map((shared) => shared.text)).toEqual(["Education"]);
    expect(statementsOf(result).some((statement) => statement.includes("Beginner"))).toBe(false);
  });

  it("does not treat an award label that mentions a track as a named track", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_award",
          projectId: "prj_synthetic_query",
          statement: "The gallery card states the award label Healthcare Track Winner. It does not name a prize.",
        },
        {
          id: "clm_other_track",
          projectId: "prj_synthetic_other",
          statement: "The gallery card names the track Healthcare.",
        },
        {
          id: "clm_query_winner_only",
          projectId: "prj_synthetic_query",
          statement: "Winner",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "direct");

    expect(result.status).toBe("unknown");
    expect(result.analogues).toEqual([]);
  });

  it("stays unknown when the track claim says unknown", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_unknown",
          projectId: "prj_synthetic_query",
          statement: "The track is unknown.",
        },
        {
          id: "clm_other_track",
          projectId: "prj_synthetic_other",
          statement: "The gallery card names the track Healthcare.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "direct");

    expect(result).toMatchObject({
      status: "unknown",
      reason: "The catalog states this value is unknown.",
      analogues: [],
    });
  });

  it("uses a submission claim and a Track label, and does not return the query project", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_label",
          projectId: "prj_synthetic_query",
          statement: "Track: River Health",
          subject: { entity: "submission", id: "sub_synthetic_query" },
        },
        {
          id: "clm_other_suffix",
          projectId: "prj_synthetic_other",
          statement: "Submitted under the River Health track.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "direct");

    expect(result.status).toBe("matched");
    expect(result.analogues.map((analogue) => analogue.projectId)).toEqual(["prj_synthetic_other"]);
    expect(result.analogues[0]?.shared[0]?.text).toBe("River Health");
  });
});

describe("mechanism mode", () => {
  it("shares Built With, dependency, and gallery technology wording", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_built" }, { id: "prj_synthetic_gallery" }],
      [
        {
          id: "clm_query_dep",
          projectId: "prj_synthetic_query",
          statement: "Dependencies: opencv, ai.",
          subject: { entity: "repository", id: "repo_synthetic_query" },
        },
        {
          id: "clm_built",
          projectId: "prj_synthetic_built",
          statement:
            "The Devpost page lists Built With tags: opencv, python. These tags are source-reported, not code-observed.",
        },
        {
          id: "clm_gallery",
          projectId: "prj_synthetic_gallery",
          statement: "Gallery technology: OpenCV.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "mechanism");

    expect(result.status).toBe("matched");
    expect(result.analogues.map((analogue) => analogue.projectId)).toEqual([
      "prj_synthetic_built",
      "prj_synthetic_gallery",
    ]);
    expect(result.analogues.every((analogue) => analogue.shared.length === 1)).toBe(true);
    expect(result.analogues.every((analogue) => analogue.shared.every((shared) => shared.text.toLowerCase() === "opencv"))).toBe(
      true,
    );
  });

  it("does not treat an award label as a mechanism", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_built",
          projectId: "prj_synthetic_query",
          statement: "Built With: Twilio.",
        },
        {
          id: "clm_other_award",
          projectId: "prj_synthetic_other",
          statement: "The Devpost project page states Winner Best Use of Twilio.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "mechanism");

    expect(result).toMatchObject({
      status: "no-match",
      reason: "No other project shares a specific value for this mode.",
    });
  });

  it("returns no match for a generic technology word", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_web",
          projectId: "prj_synthetic_query",
          statement: "Built With: web.",
        },
        {
          id: "clm_other_web",
          projectId: "prj_synthetic_other",
          statement: "Gallery technologies: web and technology.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "mechanism");

    expect(result.status).toBe("no-match");
    expect(result.analogues).toEqual([]);
  });

  it("shares a code-observed technology token", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_flask",
          projectId: "prj_synthetic_query",
          basis: "code-observed",
          statement:
            "Flask is code-observed as a framework at revision cf5f0dbf89bba5adc93f079618d2e8b0d28a72a4. Manifest path: requirements.txt.",
        },
        {
          id: "clm_other_flask",
          projectId: "prj_synthetic_other",
          basis: "code-observed",
          statement:
            "Flask is code-observed as a framework at revision cf5f0dbf89bba5adc93f079618d2e8b0d28a72a4. Manifest path: requirements.txt.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "mechanism");

    expect(result.status).toBe("matched");
    expect(result.analogues.map((analogue) => analogue.projectId)).toEqual(["prj_synthetic_other"]);
    expect(result.analogues[0]?.shared.map((shared) => shared.text)).toEqual(["Flask"]);
  });

  it("does not match different code-observed technology tokens", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_flask",
          projectId: "prj_synthetic_query",
          basis: "code-observed",
          statement:
            "Flask is code-observed as a framework at revision cf5f0dbf89bba5adc93f079618d2e8b0d28a72a4. Manifest path: requirements.txt.",
        },
        {
          id: "clm_other_react",
          projectId: "prj_synthetic_other",
          basis: "code-observed",
          statement:
            "react is code-observed as a library at revision 85ca6d3f81da206b8b06997af4ebb1b88ecaf00a. Manifest path: package.json.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "mechanism");

    expect(result).toMatchObject({
      status: "no-match",
      reason: "No other project shares a specific value for this mode.",
      analogues: [],
    });
  });

  it("keeps the scoped npm package prefix as the display name", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_types_node",
          projectId: "prj_synthetic_query",
          basis: "code-observed",
          statement:
            "Scoped npm package types/node is code-observed as a library at revision 85ca6d3f81da206b8b06997af4ebb1b88ecaf00a. Manifest path: package.json.",
        },
        {
          id: "clm_other_types_node",
          projectId: "prj_synthetic_other",
          basis: "code-observed",
          statement:
            "Scoped npm package types/node is code-observed as a library at revision 85ca6d3f81da206b8b06997af4ebb1b88ecaf00a. Manifest path: package.json.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "mechanism");

    expect(result.status).toBe("matched");
    expect(result.analogues).toHaveLength(1);
    expect(result.analogues[0]?.shared.map((shared) => shared.text)).toEqual(["Scoped npm package types/node"]);
  });
});

describe("demo mode", () => {
  it("matches a specific demo host and cites both statements", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
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
        {
          id: "clm_other_repo",
          projectId: "prj_synthetic_other",
          statement: "The gallery payload also links https://github.com/example/synthetic.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "demo");

    expect(result.status).toBe("matched");
    expect(result.analogues).toHaveLength(1);
    expect(result.analogues[0]?.shared).toEqual([
      {
        text: "river-health.example.test",
        claims: [
          {
            projectId: "prj_synthetic_query",
            claimId: "clm_query_demo",
            statement: "The gallery payload links a demo URL: https://river-health.example.test/demo",
            evidenceIds: ["evd_clm_query_demo"],
          },
          {
            projectId: "prj_synthetic_other",
            claimId: "clm_other_demo",
            statement: "The Devpost project page links a demo URL: https://www.river-health.example.test/watch",
            evidenceIds: ["evd_clm_other_demo"],
          },
        ],
      },
    ]);
  });

  it("returns no match when the only demo host is a shared video site", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_video",
          projectId: "prj_synthetic_query",
          statement: "The gallery payload links a demo URL: https://youtu.be/synthetic0001",
        },
        {
          id: "clm_other_video",
          projectId: "prj_synthetic_other",
          statement: "The gallery payload links a demo URL: https://www.youtube.com/watch?v=synthetic0002",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "demo");

    expect(result.status).toBe("no-match");
    expect(result.analogues).toEqual([]);
  });

  it("stays unknown when the demo URL is unknown", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }],
      [
        {
          id: "clm_query_unknown",
          projectId: "prj_synthetic_query",
          statement: "The demo URL is unknown.",
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "demo");

    expect(result).toMatchObject({
      status: "unknown",
      reason: "The catalog states this value is unknown.",
    });
  });
});

describe("catalog bounds", () => {
  it("returns unknown for a project id that is not in the catalog", () => {
    const catalog = fixture([{ id: "prj_synthetic_query" }], []);
    const result = retrieveAnalogues(catalog, "prj_synthetic_missing", "direct");

    expect(result).toMatchObject({
      status: "unknown",
      reason: "The project id is not in the catalog.",
      analogues: [],
      realAnalogueCount: 0,
    });
  });

  it("ignores inferred and rejected claims and claims whose evidence id is absent", () => {
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }, { id: "prj_synthetic_other" }],
      [
        {
          id: "clm_query_track",
          projectId: "prj_synthetic_query",
          statement: "The gallery card names the track Education.",
        },
        {
          id: "clm_other_inferred",
          projectId: "prj_synthetic_other",
          statement: "The gallery card names the track Education.",
          basis: "inferred",
        },
        {
          id: "clm_other_rejected",
          projectId: "prj_synthetic_other",
          statement: "The gallery card names the track Education.",
          reviewStatus: "rejected",
        },
        {
          id: "clm_other_dangling",
          projectId: "prj_synthetic_other",
          statement: "The gallery card names the track Education.",
          evidenceId: "evd_missing",
          danglingEvidence: true,
        },
      ],
    );

    const result = retrieveAnalogues(catalog, "prj_synthetic_query", "direct");

    expect(result).toMatchObject({
      status: "no-match",
      reason: "No other project shares a specific value for this mode.",
      analogues: [],
    });
  });

  it("rejects a catalog that is not schema 0.1.0", () => {
    expect(() => retrieveAnalogues({ schemaVersion: "0.0.0" }, "prj_synthetic_query", "direct")).toThrow(AnalogueError);
  });

  it("rejects an unknown mode", () => {
    const catalog = fixture([{ id: "prj_synthetic_query" }], []);
    expect(() => retrieveAnalogues(catalog, "prj_synthetic_query", "vector")).toThrow(AnalogueError);
  });

  it("does not call the network", () => {
    const fetchMock = vi.fn(() => {
      throw new Error("network disabled");
    });
    vi.stubGlobal("fetch", fetchMock);
    const catalog = fixture(
      [{ id: "prj_synthetic_query" }],
      [
        {
          id: "clm_query_track",
          projectId: "prj_synthetic_query",
          statement: "The gallery card names the track Education.",
        },
      ],
    );

    retrieveAnalogues(catalog, "prj_synthetic_query", "direct");

    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("does not import a network, process, or model client", () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
    const sources = readdirSync(root)
      .filter((name) => name.endsWith(".ts"))
      .map((name) => readFileSync(path.join(root, name), "utf8"))
      .join("\n");

    expect(sources).toContain("Copyright (c) 2026 Shen Ruililin");
    expect(sources).not.toMatch(/from ["']node:(?:http|https|net|child_process)["']/);
    expect(sources).not.toMatch(/\bfetch\s*\(/);
    expect(sources.toLowerCase()).not.toContain("openai");
    expect(sources.toLowerCase()).not.toContain("vector");
  });
});
