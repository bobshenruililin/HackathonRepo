import { connection } from "next/server";

import { CorpusNotice } from "../components/corpus-notice";
import { SearchForm } from "../components/search-form";
import { readGeneratedCounts } from "../lib/read-counts";
import { readExplorerQuery } from "../lib/query";
import { readIndex } from "../lib/read-projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  await connection();
  const query = readExplorerQuery(await searchParams);
  const counts = readGeneratedCounts();
  const index = counts.status === "generated" ? readIndex(query.filters) : { status: "not-generated" as const };
  const records = index.status === "generated" ? index.records : [];
  const all = index.status === "generated" ? index.all : [];
  const real = records.filter((record) => record.synthetic === false);
  const synthetic = records.filter((record) => record.synthetic === true);

  return (
    <main>
      <h1>Hackathon Atlas</h1>
      <p>
        This SQLite FTS5 database is a generated local index. Catalog JSON files are canonical.
        Keyword search and comparison read that index in this process. No model API is used.
      </p>
      {counts.status === "generated" ? (
        <>
          <p>
            Index status: <span data-testid="index-status">generated</span>
          </p>
          <dl>
            <dt>Real records</dt>
            <dd data-testid="real-count">{counts.real}</dd>
            <dt>Synthetic records</dt>
            <dd data-testid="synthetic-count">{counts.synthetic}</dd>
          </dl>
          <SearchForm query={query} records={all} />
          {index.status === "generated" && index.searchError ? <p>{index.searchError}</p> : null}
          <section data-testid="real-projects">
            <h2>Real projects</h2>
            <ul data-testid="real-project-list">
              {real.map((record) => (
                <li key={record.id}>
                  <a href={`/projects/${encodeURIComponent(record.id)}`}>{record.title}</a>
                </li>
              ))}
            </ul>
            {counts.real === 0 ? (
              <CorpusNotice realCount={counts.real} />
            ) : real.length === 0 ? (
              <p>No real projects match these filters.</p>
            ) : null}
          </section>
          <section data-testid="synthetic-records">
            <h2>Synthetic fixtures</h2>
            <p>These rows are labeled synthetic. They are excluded from the real count.</p>
            {synthetic.length === 0 ? (
              <p>No synthetic fixtures match these filters.</p>
            ) : (
              <ul>
                {synthetic.map((record) => (
                  <li key={record.id}>
                    <a href={`/projects/${encodeURIComponent(record.id)}`}>{record.title}</a>
                    <span data-testid="synthetic-label">Not a real project</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <p>
          Index status: <span data-testid="index-status">not generated</span>
        </p>
      )}
    </main>
  );
}
