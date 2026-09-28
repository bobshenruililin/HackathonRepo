import { connection } from "next/server";

import { readGeneratedCounts } from "../lib/read-counts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connection();
  const counts = readGeneratedCounts();

  return (
    <main>
      <h1>Hackathon Atlas</h1>
      <p>
        This SQLite FTS5 database is a generated local index. Catalog JSON files are canonical.
        This scaffold does not browse projects, call the HackMIT archive, or use an LLM.
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
        </>
      ) : (
        <p>
          Index status: <span data-testid="index-status">not generated</span>
        </p>
      )}
    </main>
  );
}
