export function CorpusNotice({ realCount }: { realCount: number }) {
  if (realCount !== 0) {
    return null;
  }
  return <p data-testid="real-corpus-status">There are no real projects.</p>;
}
