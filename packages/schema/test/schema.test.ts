import { describe, expect, it } from "vitest";
import fixtureJson from "../fixtures/synthetic-catalog.json" with { type: "json" };
import {
  MAX_EXCERPT_QUOTE_LENGTH,
  SCHEMA_VERSION,
  SchemaValidationError,
  countRealProjects,
  loadSyntheticCatalog,
  validateCatalog,
  validateClaim,
  validateEvidence,
  validateGeneratedIndex,
  type Catalog,
  type ClaimRecord,
  type CodeEvidence,
} from "../src/index.ts";

const fixture = fixtureJson as unknown as Catalog;

function messageOf(run: () => void): string {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(SchemaValidationError);
    return (error as SchemaValidationError).message;
  }
  throw new Error("Expected validation to fail.");
}

function cloneFixture(): Catalog {
  return structuredClone(fixture);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

function sourceClaim(): ClaimRecord {
  const claim = fixture.claims.find((item) => item.basis === "source-reported");
  if (!claim) {
    throw new Error("Synthetic fixture is missing a source-reported claim.");
  }
  return structuredClone(claim);
}

function codeClaim(): ClaimRecord {
  const claim = fixture.claims.find((item) => item.basis === "code-observed");
  if (!claim) {
    throw new Error("Synthetic fixture is missing a code-observed claim.");
  }
  return structuredClone(claim);
}

function codeEvidence(): CodeEvidence {
  const evidence = fixture.evidence.find((item) => item.kind === "code");
  if (!evidence || evidence.kind !== "code") {
    throw new Error("Synthetic fixture is missing code evidence.");
  }
  return structuredClone(evidence);
}

describe("synthetic catalog fixture", () => {
  it("loads the labeled synthetic fixture", () => {
    const catalog = loadSyntheticCatalog(fixture);
    expect(catalog.schemaVersion).toBe(SCHEMA_VERSION);
    expect(catalog.authority).toBe("canonical-catalog");
    expect(catalog.authoritative).toBe(true);
    expect(catalog.synthetic).toBe(true);
    expect(catalog.datasetLabel).toBe("synthetic-fixtures");
    expect(catalog.fixtureWarning).toContain("SYNTHETIC");
    expect(catalog.fixtureWarning).toMatch(/not a real project/i);
  });

  it("gives one project multiple repositories and multiple event submissions", () => {
    const catalog = loadSyntheticCatalog(fixture);
    const projectId = catalog.projects[0]?.id;
    expect(projectId).toBe("prj_synthetic_paper_boat_0001");
    expect(catalog.repositories.filter((repository) => repository.projectId === projectId)).toHaveLength(2);
    expect(catalog.submissions.filter((submission) => submission.projectId === projectId)).toHaveLength(2);
    expect(new Set(catalog.submissions.map((submission) => submission.eventId)).size).toBe(2);
  });

  it("excludes the synthetic fixture from real project counts", () => {
    const catalog = loadSyntheticCatalog(fixture);
    expect(catalog.projects.length).toBeGreaterThan(0);
    expect(countRealProjects(catalog)).toBe(0);
  });

  it("keeps unknowns explicit and does not invent a test result", () => {
    const catalog = loadSyntheticCatalog(fixture);
    expect(catalog.projects[0]?.summary).toEqual({
      status: "unknown",
      reason: "No summary was supplied for this synthetic project.",
    });
    const testClaim = catalog.claims.find((claim) => claim.basis === "test-observed");
    expect(testClaim?.resolution).toEqual({
      status: "unknown",
      reason: "The synthetic test evidence did not record a pass or fail.",
    });
  });

  it("records every claim basis in the fixture", () => {
    const catalog = loadSyntheticCatalog(fixture);
    expect(catalog.claims.map((claim) => claim.basis).sort()).toEqual([
      "code-observed",
      "inferred",
      "source-reported",
      "test-observed",
    ]);
  });

  it("ties the code-observed claim to the inspected commit", () => {
    const catalog = loadSyntheticCatalog(fixture);
    const claim = catalog.claims.find((item) => item.basis === "code-observed");
    const evidence = catalog.evidence.find((item) => item.kind === "code");
    expect(claim?.repositoryInspected).toBe(true);
    if (claim?.repositoryInspected !== true || evidence?.kind !== "code") {
      throw new Error("Synthetic fixture is missing the code inspection pair.");
    }
    expect(claim.inspectedCommitId).toBe(evidence.inspectedRevision);
    expect(claim.inspectedCommitId).toBe("SYNTHETIC-COMMIT-paper-boat-app-0001");
  });

  it("rejects a fixture that is not labeled synthetic", () => {
    const unlabeled = cloneFixture();
    unlabeled.synthetic = false;
    expect(messageOf(() => loadSyntheticCatalog(unlabeled))).toMatch(/not labeled synthetic/i);
  });

  it("rejects a fixture that omits the synthetic label", () => {
    const unlabeled = asRecord(cloneFixture());
    delete unlabeled.synthetic;
    expect(messageOf(() => loadSyntheticCatalog(unlabeled))).toMatch(/not labeled synthetic/i);
  });

  it("rejects a fixture record that is not labeled synthetic", () => {
    const catalog = cloneFixture();
    const project = catalog.projects[0];
    if (!project) {
      throw new Error("Synthetic fixture is missing a project.");
    }
    project.synthetic = false;
    expect(messageOf(() => loadSyntheticCatalog(catalog))).toMatch(/not labeled synthetic/i);
  });

  it("still excludes synthetic projects when the catalog label is removed", () => {
    const probe = cloneFixture();
    probe.synthetic = false;
    probe.datasetLabel = "counter-probe";
    delete probe.fixtureWarning;
    expect(messageOf(() => loadSyntheticCatalog(probe))).toMatch(/not labeled synthetic/i);
    expect(countRealProjects(validateCatalog(probe))).toBe(0);
  });

  it("does not store emails, phones, schools, accounts, secrets, or page bodies", () => {
    const raw = JSON.stringify(fixture).toLowerCase();
    for (const word of ["email", "phone", "school", "password", "secret", "accountid", "profile"]) {
      expect(raw).not.toContain(word);
    }
  });
});

describe("claims", () => {
  it("accepts a fixture claim with basis, evidence, observation time, and review status", () => {
    const claim = validateClaim(sourceClaim());
    expect(claim.basis).toBe("source-reported");
    expect(claim.evidenceIds.length).toBeGreaterThan(0);
    expect(claim.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(claim.reviewStatus).toBe("unreviewed");
    expect(claim.sourceUrl).toMatch(/^https:\/\//);
    expect(claim.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(claim.repositoryInspected).toBe(false);
  });

  it("requires claim basis", () => {
    const claim = asRecord(sourceClaim());
    delete claim.basis;
    expect(messageOf(() => validateClaim(claim))).toMatch(/Claim basis is required/);
  });

  it("requires evidence references", () => {
    const missing = asRecord(sourceClaim());
    delete missing.evidenceIds;
    expect(messageOf(() => validateClaim(missing))).toMatch(/Evidence references are required/);

    const empty = sourceClaim();
    empty.evidenceIds = [];
    expect(messageOf(() => validateClaim(empty))).toMatch(/Evidence references are required/);
  });

  it("requires observation time", () => {
    const claim = asRecord(sourceClaim());
    delete claim.observedAt;
    expect(messageOf(() => validateClaim(claim))).toMatch(/Observation time is required/);
  });

  it("requires review status", () => {
    const claim = asRecord(sourceClaim());
    delete claim.reviewStatus;
    expect(messageOf(() => validateClaim(claim))).toMatch(/Review status is required/);
  });

  it("requires a source URL and retrieval time", () => {
    const missingUrl = asRecord(sourceClaim());
    delete missingUrl.sourceUrl;
    expect(messageOf(() => validateClaim(missingUrl))).toMatch(/Source URL is required/);

    const missingRetrieval = asRecord(sourceClaim());
    delete missingRetrieval.retrievedAt;
    expect(messageOf(() => validateClaim(missingRetrieval))).toMatch(/Retrieval time is required/);
  });

  it("requires the inspected commit id when a repository was inspected", () => {
    const claim = asRecord(codeClaim());
    delete claim.inspectedCommitId;
    expect(messageOf(() => validateClaim(claim))).toMatch(/Inspected commit id is required/);
  });

  it("rejects a code-observed claim that did not inspect a repository", () => {
    const claim = asRecord(codeClaim());
    claim.repositoryInspected = false;
    delete claim.inspectedCommitId;
    expect(messageOf(() => validateClaim(claim))).toMatch(/repository inspection/i);
  });

  it("rejects forbidden sensitive fields", () => {
    for (const key of ["email", "phone", "profile", "accountId", "secret", "school", "body"]) {
      const claim = asRecord(sourceClaim());
      claim[key] = "not-allowed";
      expect(messageOf(() => validateClaim(claim))).toMatch(/not allowed/i);
    }
  });
});

describe("evidence", () => {
  it("accepts code evidence only with the inspected revision", () => {
    const evidence = validateEvidence(codeEvidence());
    expect(evidence.kind).toBe("code");
    if (evidence.kind !== "code") {
      throw new Error("Expected code evidence.");
    }
    expect(evidence.inspectedRevision).toBe("SYNTHETIC-COMMIT-paper-boat-app-0001");
  });

  it("requires code evidence to carry an inspected revision", () => {
    const missing = asRecord(codeEvidence());
    delete missing.inspectedRevision;
    expect(messageOf(() => validateEvidence(missing))).toMatch(/inspected revision/i);

    const blank = codeEvidence();
    blank.inspectedRevision = " ";
    expect(messageOf(() => validateEvidence(blank))).toMatch(/inspected revision/i);

    const catalog = cloneFixture();
    const embedded = catalog.evidence.find((item) => item.kind === "code");
    if (!embedded || embedded.kind !== "code") {
      throw new Error("Synthetic fixture is missing code evidence.");
    }
    delete asRecord(embedded).inspectedRevision;
    expect(messageOf(() => validateCatalog(catalog))).toMatch(/inspected revision/i);
  });

  it("rejects a source body and an excerpt that is not third-party", () => {
    const withBody = asRecord(structuredClone(fixture.evidence.find((item) => item.kind === "source")));
    withBody.body = "SYNTHETIC full page body that must not be stored.";
    expect(messageOf(() => validateEvidence(withBody))).toMatch(/not allowed/i);

    const excerpt = asRecord(structuredClone(withBody.excerpt));
    delete withBody.body;
    excerpt.kind = "quote";
    withBody.excerpt = excerpt;
    expect(messageOf(() => validateEvidence(withBody))).toMatch(/third-party-excerpt/);
  });

  it("rejects an excerpt quote that is not short", () => {
    const source = asRecord(structuredClone(fixture.evidence.find((item) => item.kind === "source")));
    const excerpt = asRecord(source.excerpt);
    excerpt.quote = "S".repeat(MAX_EXCERPT_QUOTE_LENGTH + 1);
    source.excerpt = excerpt;
    expect(messageOf(() => validateEvidence(source))).toMatch(/Full page or source bodies are not stored/);
  });
});

describe("authority", () => {
  it("rejects a generated index marked authoritative", () => {
    expect(
      messageOf(() =>
        validateGeneratedIndex({
          schemaVersion: SCHEMA_VERSION,
          authority: "generated-index",
          authoritative: true,
          synthetic: true,
          entries: [{ label: "SYNTHETIC index row" }],
        }),
      ),
    ).toMatch(/Generated indexes are not authoritative/);
  });

  it("accepts a generated index only when it is not authoritative", () => {
    const index = validateGeneratedIndex({
      schemaVersion: SCHEMA_VERSION,
      authority: "generated-index",
      authoritative: false,
      synthetic: true,
      entries: [{ label: "SYNTHETIC index row" }],
    });
    expect(index.authoritative).toBe(false);
    expect(index.authority).toBe("generated-index");
  });
});
