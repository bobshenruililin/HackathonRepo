import type { KnownOrUnknown } from "@hackathon-atlas/catalog-index";

export function KnownValue({ value }: { value: KnownOrUnknown | undefined }) {
  if (value === undefined) {
    return <span className="unknown">Unknown. This field was not recorded in the generated index.</span>;
  }
  if (value.status === "unknown") {
    return <span className="unknown">Unknown. {value.reason}</span>;
  }
  return <span>{value.value}</span>;
}

export function SourceLink({ url }: { url: string }) {
  if (!/^https?:\/\//i.test(url)) {
    return <span>{url}</span>;
  }
  return (
    <a href={url} rel="noreferrer">
      {url}
    </a>
  );
}
