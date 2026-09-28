import { connection } from "next/server";

import { CorpusNotice } from "../../../components/corpus-notice";
import { ProjectView } from "../../../components/project-view";
import { readOne } from "../../../lib/read-projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  await connection();
  const { id } = await params;
  const { snapshot, record } = readOne(id);
  const realCount = snapshot.status === "generated" ? snapshot.counts.real : 0;

  return (
    <main>
      <p>
        <a href="/">Back to search</a>
      </p>
      {snapshot.status === "generated" ? <CorpusNotice realCount={realCount} /> : null}
      {snapshot.status === "not-generated" ? (
        <p>
          Index status: <span data-testid="index-status">not generated</span>
        </p>
      ) : record === null ? (
        <>
          <h1>Project not in the index</h1>
          <p data-testid="project-reality">Unknown. This id is not in the generated index.</p>
        </>
      ) : (
        <>
          <ProjectView record={record} />
          <p>
            <a href={`/compare?left=${encodeURIComponent(record.id)}`}>Compare this project</a>
          </p>
        </>
      )}
    </main>
  );
}
