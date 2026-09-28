import { describe, expect, it } from "vitest";

import {
  TAXONOMY_DIMENSIONS,
  TaxonomyError,
  acceptValue,
  classify,
  createTaxonomyRegistry,
  listAccepted,
  listProposed,
  proposeValue,
  type Classification,
  type TaxonomyErrorCode,
} from "../src/index.js";

/**
 * Caller-supplied ids and tokens only. These tests do not create projects.
 */
const SOURCE_RECORD_ID = "evd_test_taxonomy_source_0001";
const RATIONALE = "Caller-supplied token for a later acceptance decision.";
const PROPOSED_VALUE = "sample-token";

function codeOf(run: () => void): TaxonomyErrorCode {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(TaxonomyError);
    return (error as TaxonomyError).code;
  }
  throw new Error("Expected a taxonomy rejection.");
}

describe("controlled taxonomy", () => {
  it("starts with an empty accepted set", () => {
    const registry = createTaxonomyRegistry();

    expect(TAXONOMY_DIMENSIONS).toEqual([
      "problem-domain",
      "target-user",
      "product-archetype",
      "interaction-paradigm",
      "ai-role",
      "technical-mechanism",
      "data-source",
      "physical-digital-context",
      "deployment-mode",
      "demo-mechanism",
      "novelty-dimension",
      "implementation-evidence-level",
    ]);
    expect(listAccepted(registry)).toEqual([]);
    expect(listProposed(registry)).toEqual([]);
  });

  it("does not accept a value when it is proposed", () => {
    const registry = createTaxonomyRegistry();
    const proposed = proposeValue(registry, {
      dimension: "problem-domain",
      value: PROPOSED_VALUE,
      rationale: RATIONALE,
      sourceRecordId: SOURCE_RECORD_ID,
    });

    expect(listAccepted(registry)).toEqual([]);
    expect(listAccepted(proposed)).toEqual([]);
    expect(listProposed(proposed)).toEqual([
      {
        status: "proposed",
        dimension: "problem-domain",
        value: PROPOSED_VALUE,
        rationale: RATIONALE,
        sourceRecordId: SOURCE_RECORD_ID,
      },
    ]);
  });

  it("rejects a classification that uses an unaccepted value", () => {
    const proposed = proposeValue(createTaxonomyRegistry(), {
      dimension: "technical-mechanism",
      value: PROPOSED_VALUE,
      rationale: RATIONALE,
      sourceRecordId: SOURCE_RECORD_ID,
    });

    expect(
      codeOf(() =>
        classify(proposed, {
          "technical-mechanism": { status: "value", value: PROPOSED_VALUE },
        }),
      ),
    ).toBe("unaccepted-value");
    expect(listAccepted(proposed)).toEqual([]);
  });

  it("allows unknown without treating it as a taxonomy value", () => {
    const registry = createTaxonomyRegistry();
    const classification = Object.fromEntries(
      TAXONOMY_DIMENSIONS.map((dimension) => [dimension, { status: "unknown" }]),
    ) as Classification;

    const result = classify(registry, classification);

    expect(result.dimensions).toEqual(
      TAXONOMY_DIMENSIONS.map((dimension) => ({ dimension, status: "unknown" })),
    );
    for (const item of result.dimensions) {
      expect(item).not.toHaveProperty("value");
    }
    expect(listAccepted(registry)).toEqual([]);
    expect(listProposed(registry)).toEqual([]);
    expect(codeOf(() => proposeValue(registry, {
      dimension: "ai-role",
      value: "unknown",
      rationale: RATIONALE,
      sourceRecordId: SOURCE_RECORD_ID,
    }))).toBe("reserved-unknown");
    expect(
      codeOf(() =>
        classify(registry, {
          "ai-role": { status: "value", value: "unknown" },
        }),
      ),
    ).toBe("reserved-unknown");
  });

  it("rejects a one-off string that was never proposed", () => {
    const registry = createTaxonomyRegistry();

    expect(
      codeOf(() =>
        classify(registry, {
          "novelty-dimension": { status: "value", value: "one-off-token" },
        }),
      ),
    ).toBe("never-proposed");
    expect(listProposed(registry)).toEqual([]);
    expect(listAccepted(registry)).toEqual([]);
  });

  it("accepts a value only through acceptValue", () => {
    const proposed = proposeValue(createTaxonomyRegistry(), {
      dimension: "demo-mechanism",
      value: PROPOSED_VALUE,
      rationale: RATIONALE,
      sourceRecordId: SOURCE_RECORD_ID,
    });
    const accepted = acceptValue(proposed, {
      dimension: "demo-mechanism",
      value: PROPOSED_VALUE,
    });

    expect(listProposed(accepted)).toEqual(listProposed(proposed));
    expect(listAccepted(accepted)).toEqual([
      {
        status: "accepted",
        dimension: "demo-mechanism",
        value: PROPOSED_VALUE,
        rationale: RATIONALE,
        sourceRecordId: SOURCE_RECORD_ID,
      },
    ]);
    expect(
      classify(accepted, {
        "demo-mechanism": { status: "value", value: PROPOSED_VALUE },
      }).dimensions,
    ).toEqual([
      {
        dimension: "demo-mechanism",
        status: "accepted",
        value: PROPOSED_VALUE,
      },
    ]);
    expect(
      codeOf(() =>
        classify(accepted, {
          "demo-mechanism": { status: "value", value: "one-off-token" },
        }),
      ),
    ).toBe("never-proposed");
  });

  it("rejects a dimension outside the closed list", () => {
    const registry = createTaxonomyRegistry();

    expect(
      codeOf(() =>
        classify(registry, {
          "not-a-dimension": { status: "unknown" },
        } as unknown as Classification),
      ),
    ).toBe("unknown-dimension");
  });
});
