import type { CatalogRecord } from "@hackathon-atlas/catalog-index";

import { knownEventIds } from "../lib/derive";
import type { ExplorerQuery } from "../lib/query";

export function SearchForm({
  query,
  records,
}: {
  query: ExplorerQuery;
  records: readonly CatalogRecord[];
}) {
  const eventIds = knownEventIds(records);
  const eventOptions = eventIds.includes(query.eventId) || query.eventId === "" || query.eventId === "unknown"
    ? eventIds
    : [...eventIds, query.eventId].sort();

  return (
    <form className="search" method="get" action="/" data-testid="search-form">
      <label htmlFor="q">Keyword</label>
      <input id="q" name="q" type="search" defaultValue={query.keywordInput} />

      <label htmlFor="basis">Claim basis</label>
      <select id="basis" name="basis" defaultValue={query.basis}>
        <option value="">Any (includes unknown)</option>
        <option value="unknown">Unknown</option>
        <option value="source-reported">source-reported</option>
        <option value="code-observed">code-observed</option>
        <option value="test-observed">test-observed</option>
        <option value="inferred">inferred</option>
      </select>

      <label htmlFor="reviewStatus">Review status</label>
      <select id="reviewStatus" name="reviewStatus" defaultValue={query.reviewStatus}>
        <option value="">Any (includes unknown)</option>
        <option value="unknown">Unknown</option>
        <option value="unreviewed">unreviewed</option>
        <option value="accepted">accepted</option>
        <option value="rejected">rejected</option>
      </select>

      <label htmlFor="eventId">Event</label>
      <select id="eventId" name="eventId" defaultValue={query.eventId}>
        <option value="">Any (includes unknown)</option>
        <option value="unknown">Unknown</option>
        {eventOptions.map((eventId) => (
          <option key={eventId} value={eventId}>
            {eventId}
          </option>
        ))}
      </select>

      <label htmlFor="repository">Repository locator</label>
      <select id="repository" name="repository" defaultValue={query.repository}>
        <option value="">Any (includes unknown)</option>
        <option value="unknown">Unknown</option>
        <option value="known">Known locator</option>
      </select>

      <button type="submit">Search</button>
      {query.keywordNote ? <p data-testid="keyword-note">{query.keywordNote}</p> : null}
      <p>Keyword search reads the SQLite FTS5 index. No model API is used.</p>
    </form>
  );
}
