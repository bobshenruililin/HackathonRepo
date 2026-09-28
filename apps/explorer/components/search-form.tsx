import type { EventOption } from "../lib/derive";
import type { ExplorerQuery } from "../lib/query";

export function SearchForm({
  query,
  events,
}: {
  query: ExplorerQuery;
  events: readonly EventOption[];
}) {
  const eventOptions =
    query.eventId === "" || query.eventId === "unknown" || events.some((event) => event.id === query.eventId)
      ? events
      : [...events, { id: query.eventId, label: query.eventId }];

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
        {eventOptions.map((event) => (
          <option key={event.id} value={event.id}>
            {event.label}
          </option>
        ))}
      </select>

      <label htmlFor="award">Award claim</label>
      <select id="award" name="award" defaultValue={query.award}>
        <option value="">Any (includes unknown)</option>
        <option value="unknown">No award claim</option>
        <option value="known">Award, prize, or winner claim</option>
      </select>

      <label htmlFor="track">Track text</label>
      <input id="track" name="track" type="search" defaultValue={query.track} />

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
