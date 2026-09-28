import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildUnevaluatedBundle,
  evaluateQueries,
  FIXED_QUERIES,
  loadGoldSetFile,
  NOT_MEASURED,
  NotAGoldSetError,
  requirePrecisionAndRecall,
} from "../src/index.js";

const syntheticGoldPath = fileURLToPath(
  new URL("../fixtures/synthetic-not-a-gold-set.json", import.meta.url),
);

const notMeasuredKeys = ["queryId", "reason", "status", "text"];

describe("empty gold set", () => {
  it("yields NOT MEASURED for every query", () => {
    const goldCases = [
      undefined,
      null,
      { synthetic: false as const, judgments: [] },
      {
        synthetic: false as const,
        judgments: FIXED_QUERIES.map((query) => ({ queryId: query.id, relevantIds: [] })),
      },
    ];

    for (const gold of goldCases) {
      const results = evaluateQueries({
        gold,
        corpus: [{ id: "test-only-real-record", synthetic: false }],
        retrievedByQueryId: Object.fromEntries(
          FIXED_QUERIES.map((query) => [query.id, ["test-only-real-record"]]),
        ),
      });

      expect(results.map((result) => result.queryId)).toEqual(FIXED_QUERIES.map((query) => query.id));
      for (const result of results) {
        expect(result.status).toBe(NOT_MEASURED);
        expect(result.text).toBe(FIXED_QUERIES.find((query) => query.id === result.queryId)?.text);
        expect(Object.keys(result).sort()).toEqual(notMeasuredKeys);
        expect(result).not.toHaveProperty("precision");
        expect(result).not.toHaveProperty("recall");
        expect(() => requirePrecisionAndRecall(result)).toThrow(NOT_MEASURED);
        expect(JSON.stringify(result)).not.toMatch(/"precision"|"recall"/);
      }
    }
  });

  it("does not put a precision or recall number in the default bundle", () => {
    const bundle = buildUnevaluatedBundle();
    expect(bundle.status).toBe(NOT_MEASURED);
    expect(bundle.goldSet).toBe("empty");
    expect(bundle.realCorpusCount).toBe(0);
    expect(bundle.syntheticFixturesAreGoldSet).toBe(false);
    expect(bundle.queries).toHaveLength(FIXED_QUERIES.length);
    expect(bundle.queries.every((query) => query.status === NOT_MEASURED)).toBe(true);
    expect(JSON.stringify(bundle)).not.toMatch(/"precision"|"recall"/);
  });
});

describe("synthetic fixture", () => {
  it("is labeled synthetic and is not a gold set", () => {
    const fixture = JSON.parse(readFileSync(syntheticGoldPath, "utf8")) as {
      synthetic?: unknown;
      label?: unknown;
    };
    expect(fixture.synthetic).toBe(true);
    expect(fixture.label).toMatch(/SYNTHETIC FIXTURE/i);
    expect(fixture.label).toMatch(/not a gold set/i);
    expect(() => loadGoldSetFile(syntheticGoldPath)).toThrow(NotAGoldSetError);
    expect(() =>
      evaluateQueries({
        gold: { synthetic: true, judgments: [] },
        corpus: [{ id: "test-only-real-record" }],
        retrievedByQueryId: { "hackmit-computer-vision-not-healthcare": ["test-only-real-record"] },
      }),
    ).toThrow(NotAGoldSetError);
  });

  it("does not count a synthetic-only corpus as real", () => {
    const results = evaluateQueries({
      gold: {
        synthetic: false,
        judgments: [
          {
            queryId: "hackmit-computer-vision-not-healthcare",
            relevantIds: ["test-only-synthetic-record"],
          },
        ],
      },
      corpus: [{ id: "test-only-synthetic-record", synthetic: true }],
      retrievedByQueryId: {
        "hackmit-computer-vision-not-healthcare": ["test-only-synthetic-record"],
      },
    });
    expect(results.every((result) => result.status === NOT_MEASURED)).toBe(true);
    expect(JSON.stringify(results)).not.toMatch(/"precision"|"recall"/);
  });
});

describe("measurement", () => {
  it("scores only ids present in the supplied real corpus and retrieval", () => {
    const results = evaluateQueries({
      gold: {
        synthetic: false,
        judgments: FIXED_QUERIES.map((query) => ({
          queryId: query.id,
          relevantIds: ["test-only-real-a"],
        })),
      },
      corpus: [
        { id: "test-only-real-a", synthetic: false },
        { id: "test-only-real-b", synthetic: false },
        { id: "test-only-synthetic", synthetic: true },
      ],
      retrievedByQueryId: Object.fromEntries(
        FIXED_QUERIES.map((query) => [query.id, ["test-only-real-a", "test-only-real-b"]]),
      ),
    });

    expect(results).toHaveLength(FIXED_QUERIES.length);
    for (const result of results) {
      expect(result.status).toBe("MEASURED");
      if (result.status !== "MEASURED") {
        continue;
      }
      expect(requirePrecisionAndRecall(result)).toEqual({ precision: 0.5, recall: 1 });
      expect(result.hitCount).toBe(1);
      expect(result.relevantCount).toBe(1);
      expect(result.retrievedCount).toBe(2);
    }
  });

  it("does not invent a project that is missing from the real corpus", () => {
    const results = evaluateQueries({
      gold: {
        synthetic: false,
        judgments: [
          {
            queryId: "speech-primary-interaction",
            relevantIds: ["test-only-missing-project"],
          },
        ],
      },
      corpus: [{ id: "test-only-real-a", synthetic: false }],
      retrievedByQueryId: {
        "speech-primary-interaction": ["test-only-real-a"],
      },
    });
    const speech = results.find((result) => result.queryId === "speech-primary-interaction");
    expect(speech?.status).toBe(NOT_MEASURED);
    expect(speech && "reason" in speech ? speech.reason : "").toMatch(/not in the real corpus/);
    expect(speech).not.toHaveProperty("precision");
  });

  it("does not score when retrieval results were not supplied", () => {
    const results = evaluateQueries({
      gold: {
        synthetic: false,
        judgments: [
          {
            queryId: "award-winning-public-code",
            relevantIds: ["test-only-real-a"],
          },
        ],
      },
      corpus: [{ id: "test-only-real-a", synthetic: false }],
    });
    expect(results.every((result) => result.status === NOT_MEASURED)).toBe(true);
    expect(JSON.stringify(results)).not.toMatch(/"precision"|"recall"/);
  });
});
