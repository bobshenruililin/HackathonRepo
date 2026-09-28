import type { CatalogRecord, IndexedClaim, IndexedEvidence } from "@hackathon-atlas/catalog-index";

import { deriveRecord, unknownReason } from "../lib/derive";
import { KnownValue, SourceLink } from "./known-value";

export function ProjectView({ record }: { record: CatalogRecord }) {
  const derived = deriveRecord(record);
  const facts = record.details.sourceFacts;

  return (
    <article>
      <h1 data-testid="project-title">{record.title}</h1>
      <p data-testid="project-reality">{derived.realityLabel}</p>
      <p>{derived.realityDetail}</p>

      <section data-testid="source-facts">
        <h2>Source facts</h2>
        <dl>
          <dt>Record id</dt>
          <dd>{record.id}</dd>
          <dt>Title</dt>
          <dd>
            <KnownValue value={facts.title} />
          </dd>
          <dt>Summary</dt>
          <dd>
            <KnownValue value={facts.summary} />
          </dd>
          <dt>Synthetic flag</dt>
          <dd>
            <KnownValue value={facts.synthetic} />
          </dd>
        </dl>
      </section>

      <section data-testid="derived-fields">
        <h2>Derived fields</h2>
        <p>Computed from the generated index. No model API is used.</p>
        <dl>
          <dt>Counted in the real total</dt>
          <dd>{derived.countedInRealTotal ? "yes" : "no"}</dd>
          <dt>Evidence count</dt>
          <dd>{derived.evidenceCount}</dd>
          <dt>Submission count</dt>
          <dd>{derived.submissionCount}</dd>
          <dt>Repository count</dt>
          <dd>{derived.repositoryCount}</dd>
          <dt>Claim count</dt>
          <dd>{derived.claimCount}</dd>
          <dt>Known source URL count</dt>
          <dd>{derived.knownSourceUrlCount}</dd>
        </dl>
      </section>

      <section data-testid="evidence">
        <h2>Evidence and source links</h2>
        {record.details.evidence.length === 0 ? (
          <p className="unknown">Unknown. {unknownReason(record, "evidence")}</p>
        ) : (
          <ul>
            {record.details.evidence.map((item) => (
              <li key={item.id} id={`evidence-${item.id}`}>
                <EvidenceItem item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-testid="submissions">
        <h2>Submissions</h2>
        {record.details.submissions.length === 0 ? (
          <p className="unknown">Unknown. {unknownReason(record, "submissions")}</p>
        ) : (
          <ul>
            {record.details.submissions.map((item) => (
              <li key={item.id}>
                <p>Submission id: {item.id}</p>
                <p>Synthetic flag: {item.synthetic ? "true" : "false"}</p>
                <p>
                  Event id: <KnownValue value={item.eventId} />
                </p>
                <p>
                  Event name: <KnownValue value={item.eventName} />
                </p>
                <p>
                  Submitted at: <KnownValue value={item.submittedAt} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-testid="repositories">
        <h2>Repositories</h2>
        {record.details.repositories.length === 0 ? (
          <p className="unknown">Unknown. {unknownReason(record, "repositories")}</p>
        ) : (
          <ul>
            {record.details.repositories.map((item) => (
              <li key={item.id}>
                <p>Repository id: {item.id}</p>
                <p>Synthetic flag: {item.synthetic ? "true" : "false"}</p>
                <p>
                  Locator:{" "}
                  {item.locator.status === "known" ? (
                    <SourceLink url={item.locator.value} />
                  ) : (
                    <KnownValue value={item.locator} />
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-testid="claims">
        <h2>Recorded claims</h2>
        {record.details.claims.length === 0 ? (
          <p className="unknown">Unknown. {unknownReason(record, "claims")}</p>
        ) : (
          <ul>
            {record.details.claims.map((claim) => (
              <li key={claim.id}>
                <ClaimItem claim={claim} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-testid="unknowns">
        <h2>Unknowns</h2>
        {record.details.unknowns.length === 0 ? (
          <p>The generated index recorded no unknown fields for this project.</p>
        ) : (
          <ul>
            {record.details.unknowns.map((item) => (
              <li key={item.field}>
                <span>{item.field}</span>: <span className="unknown">Unknown. {item.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

function EvidenceItem({ item }: { item: IndexedEvidence }) {
  return (
    <>
      <p>Evidence id: {item.id}</p>
      <p>Kind: {item.kind}</p>
      <p>Synthetic flag: {item.synthetic ? "true" : "false"}</p>
      {item.sourceUrl ? (
        <p>
          Source URL:{" "}
          {item.sourceUrl.status === "known" ? (
            <SourceLink url={item.sourceUrl.value} />
          ) : (
            <KnownValue value={item.sourceUrl} />
          )}
        </p>
      ) : null}
      {item.retrievedAt ? (
        <p>
          Retrieved at: <KnownValue value={item.retrievedAt} />
        </p>
      ) : null}
      {item.observedAt ? (
        <p>
          Observed at: <KnownValue value={item.observedAt} />
        </p>
      ) : null}
      {item.attribution ? (
        <p>
          Attribution: <KnownValue value={item.attribution} />
        </p>
      ) : null}
      {item.quote ? (
        <p>
          Quote: <KnownValue value={item.quote} />
        </p>
      ) : null}
      {item.repositoryId ? (
        <p>
          Repository id: <KnownValue value={item.repositoryId} />
        </p>
      ) : null}
      {item.inspectedRevision ? (
        <p>
          Inspected revision: <KnownValue value={item.inspectedRevision} />
        </p>
      ) : null}
      {item.path ? (
        <p>
          Path: <KnownValue value={item.path} />
        </p>
      ) : null}
      {item.result ? (
        <p>
          Result: <KnownValue value={item.result} />
        </p>
      ) : null}
    </>
  );
}

function ClaimItem({ claim }: { claim: IndexedClaim }) {
  return (
    <>
      <p>Claim id: {claim.id}</p>
      <p>Statement: {claim.statement}</p>
      <p>Basis: {claim.basis}</p>
      <p>Review status: {claim.reviewStatus}</p>
      <p>Synthetic flag: {claim.synthetic ? "true" : "false"}</p>
      <p>
        Source URL:{" "}
        {claim.sourceUrl.status === "known" ? (
          <SourceLink url={claim.sourceUrl.value} />
        ) : (
          <KnownValue value={claim.sourceUrl} />
        )}
      </p>
      <p>
        Evidence ids:{" "}
        {claim.evidenceIds.status === "known" ? (
          claim.evidenceIds.value.join(", ")
        ) : (
          <KnownValue value={claim.evidenceIds} />
        )}
      </p>
      <p>
        Observed at: <KnownValue value={claim.observedAt} />
      </p>
      <p>
        Retrieved at: <KnownValue value={claim.retrievedAt} />
      </p>
      <p>
        Resolution: <KnownValue value={claim.resolution} />
      </p>
    </>
  );
}
