import type { CatalogRecord } from "@hackathon-atlas/catalog-index";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { CorpusNotice } from "../../components/corpus-notice";
import { KnownValue, SourceLink } from "../../components/known-value";
import { deriveRecord, formatKnown } from "../../lib/derive";
import { readIndex } from "../../lib/read-projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompareProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ComparePage({ searchParams }: CompareProps) {
  await connection();
  const params = await searchParams;
  const leftId = first(params.left);
  const rightId = first(params.right);
  const index = readIndex();
  const records = index.status === "generated" ? index.all : [];
  const leftResolved = resolveSide(records, leftId);
  const rightResolved = resolveSide(records, rightId);
  const left = leftResolved.record;
  const right = rightResolved.record;
  const leftMatches = left === null ? leftResolved.matches : [];
  const rightMatches = right === null ? rightResolved.matches : [];

  return (
    <main>
      <h1>Compare projects</h1>
      <p>Field comparison from the generated index. No model API is used.</p>
      {index.status === "not-generated" ? (
        <p>
          Index status: <span data-testid="index-status">not generated</span>
        </p>
      ) : (
        <>
          <CorpusNotice realCount={index.counts.real} />
          <form method="get" action="/compare">
            <label htmlFor="left">Left project id or exact title</label>
            <input id="left" name="left" type="search" defaultValue={leftId} />
            <label htmlFor="right">Right project id or exact title</label>
            <input id="right" name="right" type="search" defaultValue={rightId} />
            <button type="submit">Compare</button>
          </form>
          <MatchList label="Left matches" matches={leftMatches} side="left" other={rightId} />
          <MatchList label="Right matches" matches={rightMatches} side="right" other={leftId} />
          {leftId !== "" && leftId === rightId ? <p>Both sides are the same catalog record.</p> : null}
          <table data-testid="comparison">
            <thead>
              <tr>
                <th>Field</th>
                <th>Left</th>
                <th>Right</th>
                <th>Derived relation</th>
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label="Reality"
                left={realityCell(left, leftId, "compare-left-reality")}
                right={realityCell(right, rightId, "compare-right-reality")}
              />
              <CompareRow label="Title" left={textCell(left, "title")} right={textCell(right, "title")} />
              <CompareRow label="Summary" left={summaryCell(left)} right={summaryCell(right)} />
              <CompareRow
                label="Synthetic flag"
                left={flagCell(left)}
                right={flagCell(right)}
              />
              <CompareRow
                label="Evidence"
                left={<EvidenceCell record={left} testId="compare-left-evidence" />}
                right={<EvidenceCell record={right} testId="compare-right-evidence" />}
              />
              <CompareRow
                label="Submissions"
                left={<AssociationCell record={left} kind="submissions" />}
                right={<AssociationCell record={right} kind="submissions" />}
              />
              <CompareRow
                label="Repositories"
                left={<AssociationCell record={left} kind="repositories" />}
                right={<AssociationCell record={right} kind="repositories" />}
              />
              <CompareRow
                label="Unknowns"
                left={<UnknownCell record={left} />}
                right={<UnknownCell record={right} />}
              />
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}

function CompareRow({
  label,
  left,
  right,
}: {
  label: string;
  left: string | ReactNode;
  right: string | ReactNode;
}) {
  const leftText = typeof left === "string" ? left : null;
  const rightText = typeof right === "string" ? right : null;
  const relation =
    leftText !== null && rightText !== null ? (leftText === rightText ? "same" : "different") : "see cells";
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{left}</td>
      <td>{right}</td>
      <td>{relation}</td>
    </tr>
  );
}

function realityCell(record: CatalogRecord | null, id: string, testId: string) {
  if (id === "") {
    return <span data-testid={testId}>Unknown. No project selected.</span>;
  }
  if (record === null) {
    return <span data-testid={testId}>Unknown. This project is not in the generated index.</span>;
  }
  return <span data-testid={testId}>{deriveRecord(record).realityLabel}</span>;
}

function textCell(record: CatalogRecord | null, field: "title"): string {
  if (record === null) {
    return "Unknown. No project selected.";
  }
  return formatKnown(record.details.sourceFacts[field], "No title was recorded.");
}

function summaryCell(record: CatalogRecord | null): string {
  if (record === null) {
    return "Unknown. No project selected.";
  }
  return formatKnown(record.details.sourceFacts.summary, "No summary was recorded.");
}

function flagCell(record: CatalogRecord | null): string {
  if (record === null) {
    return "Unknown. No project selected.";
  }
  return formatKnown(record.details.sourceFacts.synthetic, "No synthetic flag was recorded.");
}

function EvidenceCell({ record, testId }: { record: CatalogRecord | null; testId: string }) {
  if (record === null) {
    return <span data-testid={testId}>Unknown. No project selected.</span>;
  }
  if (record.details.evidence.length === 0) {
    return (
      <span data-testid={testId} className="unknown">
        Unknown. {record.details.unknowns.find((item) => item.field === "evidence")?.reason ?? "No evidence was recorded."}
      </span>
    );
  }
  return (
    <ul data-testid={testId}>
      {record.details.evidence.map((item) => (
        <li key={item.id}>
          {item.id}
          {item.sourceUrl?.status === "known" ? (
            <>
              {" "}
              <SourceLink url={item.sourceUrl.value} />
            </>
          ) : null}
          {item.quote ? (
            <>
              {" "}
              <KnownValue value={item.quote} />
            </>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function AssociationCell({
  record,
  kind,
}: {
  record: CatalogRecord | null;
  kind: "submissions" | "repositories";
}) {
  if (record === null) {
    return <span className="unknown">Unknown. No project selected.</span>;
  }
  const items = record.details[kind];
  if (items.length === 0) {
    const reason = record.details.unknowns.find((item) => item.field === kind)?.reason;
    return <span className="unknown">Unknown. {reason ?? "None were recorded."}</span>;
  }
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.id}
          {"locator" in item ? (
            <>
              {" "}
              {item.locator.status === "known" ? (
                <SourceLink url={item.locator.value} />
              ) : (
                <KnownValue value={item.locator} />
              )}
            </>
          ) : null}
          {"eventId" in item ? (
            <>
              {" "}
              <KnownValue value={item.eventId} />
            </>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function UnknownCell({ record }: { record: CatalogRecord | null }) {
  if (record === null) {
    return <span className="unknown">Unknown. No project selected.</span>;
  }
  if (record.details.unknowns.length === 0) {
    return <span>No unknown fields were recorded.</span>;
  }
  return (
    <ul>
      {record.details.unknowns.map((item) => (
        <li key={item.field}>
          {item.field}: Unknown. {item.reason}
        </li>
      ))}
    </ul>
  );
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function resolveSide(
  records: readonly CatalogRecord[],
  raw: string,
): { record: CatalogRecord | null; matches: CatalogRecord[] } {
  const query = raw.trim();
  if (query === "") return { record: null, matches: [] };
  const byId = records.find((record) => record.id === query);
  if (byId) return { record: byId, matches: [] };
  const exact = records.filter((record) => record.title.toLowerCase() === query.toLowerCase());
  if (exact.length === 1) return { record: exact[0] ?? null, matches: [] };
  const pool = exact.length > 1 ? exact : records.filter((record) => record.title.toLowerCase().includes(query.toLowerCase()));
  return { record: null, matches: pool.slice(0, 8) };
}

function MatchList({
  label,
  matches,
  side,
  other,
}: {
  label: string;
  matches: readonly CatalogRecord[];
  side: "left" | "right";
  other: string;
}) {
  if (matches.length === 0) return null;
  return (
    <section>
      <h2>{label}</h2>
      <ul>
        {matches.map((record) => {
          const params = new URLSearchParams();
          params.set("left", side === "left" ? record.id : other);
          params.set("right", side === "right" ? record.id : other);
          return (
            <li key={record.id}>
              <a href={`/compare?${params.toString()}`}>{record.title}</a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
