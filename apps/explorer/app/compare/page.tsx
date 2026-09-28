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
  const left = records.find((record) => record.id === leftId) ?? null;
  const right = records.find((record) => record.id === rightId) ?? null;

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
            <label htmlFor="left">Left project</label>
            <select id="left" name="left" defaultValue={leftId}>
              <option value="">Select a project</option>
              {records.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.synthetic ? "Synthetic fixture: " : ""}
                  {record.title}
                </option>
              ))}
            </select>
            <label htmlFor="right">Right project</label>
            <select id="right" name="right" defaultValue={rightId}>
              <option value="">Select a project</option>
              {records.map((record) => (
                <option key={`right-${record.id}`} value={record.id}>
                  {record.synthetic ? "Synthetic fixture: " : ""}
                  {record.title}
                </option>
              ))}
            </select>
            <button type="submit">Compare</button>
          </form>
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
